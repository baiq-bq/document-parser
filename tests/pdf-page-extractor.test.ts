import { assert, assertEquals } from "jsr:@std/assert@^1";
import { fromFileUrl } from "@std/path";
import { exists } from "@std/fs";
import { extractPagesFromPDF } from "../pdf-page-extractor/mod.ts";

const EXAMPLE_PDF = fromFileUrl(new URL("./assets/example.pdf", import.meta.url));

Deno.test("extracts specified pages", async () => {
  const output = await extractPagesFromPDF(EXAMPLE_PDF, [1, 3]);
  assert(await exists(output), "output file should exist");
  const text = await Deno.readTextFile(output);
  const pageCount = (text.match(/\/Type \/Page/g) ?? []).length;
  assertEquals(pageCount, 2);
  await Deno.remove(output);
});
