import { basename, dirname, extname, join } from "@std/path";
import { extractPagesFromPDF } from "../pdf-page-extractor/mod.ts";

/**
 * Convert a DOCX file to PDF using the `soffice` CLI.
 *
 * @param docxPath Path to the source DOCX file.
 * @returns Path to the generated PDF.
 */
async function defaultConvert(docxPath: string): Promise<string> {
  const outDir = await Deno.makeTempDir();
  const cmd = new Deno.Command("soffice", {
    args: ["--headless", "--convert-to", "pdf", "--outdir", outDir, docxPath],
    stdout: "null",
    stderr: "null",
  });
  const { code } = await cmd.output();
  if (code !== 0) {
    throw new Error("Failed to convert DOCX to PDF using soffice");
  }
  const pdfName = `${basename(docxPath, extname(docxPath))}.pdf`;
  return join(outDir, pdfName);
}

export interface ExtractDocxOptions {
  /** Custom conversion function. Defaults to using `soffice`. */
  convert?: (docxPath: string) => Promise<string>;
}

/**
 * Extract specific pages from a DOCX file.
 *
 * This helper converts the DOCX to PDF using a CLI command and then
 * delegates to {@link extractPagesFromPDF}.
 *
 * @param docxPath Path to the DOCX file.
 * @param pages    1-based page numbers to include.
 * @param options  Optional conversion override.
 * @returns Path to a temporary PDF containing the selected pages.
 */
export async function extractPagesFromDOCX(
  docxPath: string,
  pages: number[],
  options: ExtractDocxOptions = {},
): Promise<string> {
  const convert = options.convert ?? defaultConvert;
  const pdfPath = await convert(docxPath);
  const outPath = await extractPagesFromPDF(pdfPath, pages);

  // clean up if default converter was used
  if (options.convert === undefined) {
    try {
      await Deno.remove(pdfPath);
      await Deno.remove(dirname(pdfPath), { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  }

  return outPath;
}
