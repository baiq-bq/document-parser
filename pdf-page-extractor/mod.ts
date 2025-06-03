import { PDFDocument } from "pdf-lib";

/**
 * Extract specific pages from a PDF file.
 *
 * @param pdfPath Path to the source PDF.
 * @param pages Array of 1-based page numbers to include in the new PDF.
 * @returns Path to a temporary PDF file containing the selected pages.
 */
export async function extractPagesFromPDF(
  pdfPath: string,
  pages: number[],
): Promise<string> {
  const bytes = await Deno.readFile(pdfPath);
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();

  const pageCount = src.getPageCount();
  for (const p of pages) {
    if (p < 1 || p > pageCount) continue;
    const [copied] = await out.copyPages(src, [p - 1]);
    out.addPage(copied);
  }

  const tmp = await Deno.makeTempFile({ suffix: ".pdf" });
  await Deno.writeFile(tmp, await out.save());
  return tmp;
}
