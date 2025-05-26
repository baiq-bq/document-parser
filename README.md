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
