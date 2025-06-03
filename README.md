# Module Documentation

This repository contains three standalone Deno modules for extracting text and
images from different document formats. Each module exposes a single function
that returns a list of pages with text paragraphs and any extracted images.

## `extractDOCXContent`

Reads a DOCX file and extracts all paragraphs and embedded images. The entire
document is treated as a single page.

```ts
import { extractDOCXContent } from "@baiq/document-parser";
const result = await extractDOCXContent("document.docx", "./out");
console.log(result.pages[0].paragraphs);
```

## `extractPDFContent`

Uses external tools (`mutool` and `pdfimages`) to extract text and embedded
images from each page of a PDF.

```ts
import { extractPDFContent } from "@baiq/document-parser";
const result = await extractPDFContent("file.pdf", "./out");
console.log(result.pages.length);
```

## `extractPagesFromPDF`

Creates a new PDF containing only the pages you specify.

```ts
import { extractPagesFromPDF } from "@baiq/document-parser";
const outPath = await extractPagesFromPDF("file.pdf", [1, 3]);
console.log(outPath);
```

## `extractPagesFromDOCX`

Converts a DOCX file to PDF using the `soffice` CLI and returns a new PDF
containing only the pages you specify.

It requires LibreOffice to be installed and available in your PATH.

```ts
import { extractPagesFromDOCX } from "@baiq/document-parser";
const outPath = await extractPagesFromDOCX("file.docx", [1, 3]);
console.log(outPath);
```

## `extractEPUBContent`

Parses an EPUB archive to gather paragraphs and referenced images from each
chapter.

```ts
import { extractEPUBContent } from "@baiq/document-parser";
const result = await extractEPUBContent("book.epub", "./out");
console.log(result.pages.map((p) => p.images.length));
```

Each function returns an object of the form:

```ts
{
  pages: Array<{
    images: string[];
    paragraphs: string[];
  }>;
}
```

Images are written to the provided output directory, and the returned paths
reference those files.

## Examples

See the `examples` directory for usage examples and a simple HTTP service that
demonstrates how to use these modules in practice.

## HTTP Service Example

This repository also includes an example HTTP service that uses these modules to
extract content from files stored on Google Cloud Storage. The service accepts a
`POST /extract` request with a JSON body containing a `fileUrl` pointing to a
GCS object. It downloads the file, extracts its contents, and re-uploads any
extracted images, returning a JSON response with signed URLs.
