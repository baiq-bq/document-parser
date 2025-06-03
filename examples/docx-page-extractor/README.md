# DOCX Page Extractor Example

This example shows how to use `extractPagesFromDOCX` to convert a DOCX file to
PDF and keep only specific pages.

Run the script with the required permissions:

```bash
$ deno run --allow-read --allow-write --allow-run main.ts <file.docx> <page> [page...]
```

The script prints the path to the generated PDF.
