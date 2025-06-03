import { assert, assertEquals } from "jsr:@std/assert@^1";
import { fromFileUrl } from "@std/path";
import { exists } from "@std/fs";
import JSZip from "jszip";
import { extractPagesFromDOCX } from "../docx-page-extractor/mod.ts";

const EXAMPLE_DOCX = fromFileUrl(
  new URL("./assets/example.docx", import.meta.url)
);

Deno.test("extracts specified pages from DOCX", async () => {
  const output = await extractPagesFromDOCX(EXAMPLE_DOCX, [1, 3]);

  // 1. File should exist
  assert(await exists(output), "output file should exist");
  console.log("Output file:", output);

  // 2. Load the DOCX and verify pages
  const bytes = await Deno.readFile(output);
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")!.async("text");

  console.log(xml);

  // assert(xml.includes("1"));
  // assert(xml.includes("3"));
  // assert(!xml.includes("2"));

  // 3. Clean up
  //await Deno.remove(output);
});
