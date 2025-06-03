import { parse } from "@std/flags";
import { extractPagesFromDOCX } from "@baiq/document-parser";

const { _: args } = parse(Deno.args);
if (args.length < 2) {
  console.log(
    "Usage: deno run --allow-read --allow-write --allow-run main.ts <file.docx> <page> [page...]",
  );
  Deno.exit(1);
}

const [file, ...pageArgs] = args;
const pages = pageArgs.map((p) => Number(p));

const out = await extractPagesFromDOCX(String(file), pages);
console.log("Created:", out);
