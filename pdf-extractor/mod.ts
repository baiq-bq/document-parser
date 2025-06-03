import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { DocExtractionResult } from "../types.ts";

/**
 * Content extracted from a single PDF page.
 */
export type PageContent = {
  /** Paths to images extracted for this page. */
  images: string[];
  /** Individual text paragraphs on the page. */
  paragraphs: string[];
};

/**
 * Extract images and text from a PDF.
 *
 * @param pdfPath Path to the PDF file.
 * @param outputDir Directory to save extracted images/text.
 * @returns A {@link DocExtractionResult} with page content.
 *
 * @example
 * ```ts
 * import { extractPDFContent } from "@baiq/pdf-extractor";
 * const result = await extractPDFContent("report.pdf", "./out");
 * console.log(result.pages.length);
 * ```
 */
export async function extractPDFContent(
  pdfPath: string,
  outputDir: string
): Promise<DocExtractionResult> {
  // ensure our output directory exists
  await ensureDir(outputDir);

  // temp dirs for intermediate extraction
  const textDir: string = await Deno.makeTempDir();
  const imgDir: string = await Deno.makeTempDir();

  // 1) Extract page text
  await new Deno.Command("mutool", {
    args: ["draw", "-F", "txt", "-o", join(textDir, "page-%d.txt"), pdfPath],
  }).output();

  // 2) Extract embedded images using poppler's pdfimages
  await new Deno.Command("pdfimages", {
    args: ["-p", "-all", pdfPath, join(imgDir, "img")],
  }).output();

  // map of page number -> extracted image paths
  const pageImages: Map<number, string[]> = new Map<number, string[]>();
  for await (const entry of Deno.readDir(imgDir)) {
    if (!entry.isFile) continue;
    const match: RegExpMatchArray | null = entry.name.match(
      /^img-(\d+)-(\d+)\.[^\.]+$/
    );
    if (!match) continue;
    const pageNum: number = parseInt(match[1], 10);
    const src: string = join(imgDir, entry.name);
    const dest: string = join(outputDir, entry.name);
    await Deno.copyFile(src, dest);
    await Deno.remove(src);
    if (!pageImages.has(pageNum)) pageImages.set(pageNum, []);
    pageImages.get(pageNum)!.push(dest);
  }

  // 3) Build page-by-page text and attach extracted images
  const pages: PageContent[] = [];
  for (let pageIndex: number = 1; ; pageIndex++) {
    const txtPath: string = join(textDir, `page-${pageIndex}.txt`);
    if (!(await exists(txtPath))) break;

    const textContent: string = await Deno.readTextFile(txtPath);
    const paragraphs: string[] = textContent
      .split(/\n\s*\n/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    pages.push({
      images: pageImages.get(pageIndex) ?? [],
      paragraphs,
    });
  }

  // clean up temp text
  await Deno.remove(textDir, { recursive: true });
  await Deno.remove(imgDir, { recursive: true });

  return { pages };
}
