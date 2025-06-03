import { assert, assertEquals } from "jsr:@std/assert@^1";
import { fromFileUrl } from "@std/path";
import { exists } from "@std/fs";
import { PDFDocument } from "pdf-lib";
import { extractPagesFromDOCX } from "../docx-page-extractor/mod.ts";

const EXAMPLE_DOCX = fromFileUrl(
  new URL("./assets/example.docx", import.meta.url),
);
const EXAMPLE_PDF = fromFileUrl(
  new URL("./assets/example.pdf", import.meta.url),
);

Deno.test("extracts pages from DOCX via PDF", async () => {
  // stub converter to avoid external soffice dependency
  const output = await extractPagesFromDOCX(EXAMPLE_DOCX, [2], {
    convert: async () => EXAMPLE_PDF,
  });

  assert(await exists(output), "output file should exist");

  const bytes = await Deno.readFile(output);
  const doc = await PDFDocument.load(bytes);
  assertEquals(doc.getPageCount(), 1);

  await Deno.remove(output);
});
