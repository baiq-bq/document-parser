import { assert, assertEquals } from "jsr:@std/assert@^1";
import { fromFileUrl } from "@std/path";
import { exists } from "@std/fs";
import { PDFDocument } from "pdf-lib";
import { extractPagesFromPDF } from "../pdf-page-extractor/mod.ts";

const EXAMPLE_PDF = fromFileUrl(
  new URL("./assets/example.pdf", import.meta.url),
);

Deno.test("extracts specified pages", async () => {
  const output = await extractPagesFromPDF(EXAMPLE_PDF, [1, 3]);

  // 1. File should exist
  assert(await exists(output), "output file should exist");

  // 2. Load the new PDF and verify it has exactly 2 pages
  const outBytes = await Deno.readFile(output);
  const outDoc = await PDFDocument.load(outBytes);
  const pageCount = outDoc.getPageCount();
  assertEquals(pageCount, 2);

  // 3. Clean up
  await Deno.remove(output);
});
