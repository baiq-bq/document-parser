/*
Explanation and Fixed Code for DOCX Page Extractor

Issue:
The error `DOMParser: "application/xml" unimplemented` occurs because the `@b-fuze/deno-dom` DOMParser does not support parsing XML when using the MIME type "application/xml". It currently only implements HTML parsing. To work around this, we can avoid using DOMParser entirely and instead operate on the raw XML text directly or use fast-xml-parser to manage the XML as JavaScript objects.

Below is a revised version of the `extractPagesFromDOCX` function that:
1. Reads the DOCX as a ZIP and extracts `word/document.xml`.
2. Uses a regular-expression-based split on the raw XML to segment the document into pages (relying on the fact that page breaks are represented by their own `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` paragraphs).
3. Selects only the requested page segments and rejoins them with a single page-break tag between each.
4. Writes the new XML back into the ZIP and returns a path to the temp DOCX.

This approach avoids DOMParser entirely and works purely on string operations, which are supported in Deno out of the box.
*/

import JSZip from "jszip";

/**
 * Extract specific pages from a DOCX file by splitting the raw XML.
 *
 * Pages are determined by explicit page breaks (<w:p><w:r><w:br w:type="page"/></w:r></w:p>).
 * We split <w:body> content on this exact paragraph, group into segments,
 * then reassemble only the requested segments (in order), reinserting
 * a single page-break paragraph between each.
 *
 * @param docxPath Path to the source DOCX.
 * @param pages    Array of 1-based page numbers to include in the new DOCX.
 * @returns        Path to a temporary DOCX file containing only the selected pages.
 */
export async function extractPagesFromDOCX(
  docxPath: string,
  pages: number[]
): Promise<string> {
  // 1. Read the .docx as a ZIP, find word/document.xml
  const data = await Deno.readFile(docxPath);
  const zip = await JSZip.loadAsync(data);
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) throw new Error("Invalid DOCX: missing word/document.xml");

  // 2. Load the XML text
  const xmlText = await xmlFile.async("text");

  // 3. Locate the <w:body> section via regex
  const bodyMatch = xmlText.match(/<w:body[^>]*>([\s\S]*?)<\/w:body>/i);
  if (!bodyMatch) {
    throw new Error("Invalid DOCX: <w:body> not found or malformed");
  }
  const innerContent = bodyMatch[1];

  // 4. Split the document content on page-break paragraphs.
  //    Page breaks are represented by a `<w:br w:type="page"/>` run inside its own
  //    paragraph, but Word may insert additional attributes or whitespace. Use a
  //    regex that tolerates these variations rather than matching an exact string.
  const pageBreakRegex =
    /<w:p[^>]*>\s*<w:r[^>]*>\s*<w:br[^>]*w:type="page"[^>]*\/?>\s*<\/w:r>\s*<\/w:p>/i;

  // Standard representation used when reassembling the document
  const pageBreakTag = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

  // 4a. Use split with the regex so the break markers are discarded from the
  //     resulting segments.
  const pageSegments = innerContent.split(pageBreakRegex);
  // Now pageSegments[0] is content for page 1, pageSegments[1] is page 2, etc.

  // 5. Build new body inner content by joining only requested pages
  const selectedSegments: string[] = [];
  for (const pNum of pages) {
    if (pNum < 1 || pNum > pageSegments.length) continue;
    selectedSegments.push(pageSegments[pNum - 1]);
  }
  if (selectedSegments.length === 0) {
    throw new Error("No valid page numbers given.");
  }

  // Reinsert a single page-break paragraph between each selected segment
  const newBodyInner = selectedSegments.join(pageBreakTag);

  // 6. Reconstruct the full new document.xml by replacing the old body content
  const newXmlText = xmlText.replace(
    /(<w:body[^>]*>)([\s\S]*?)(<\/w:body>)/i,
    (_match, openTag, _oldInner, closeTag) => {
      return `${openTag}${newBodyInner}${closeTag}`;
    }
  );

  // 7. Write back into the ZIP and save a temp .docx
  zip.file("word/document.xml", newXmlText);
  const outBytes = await zip.generateAsync({ type: "uint8array" });

  const tmpPath = await Deno.makeTempFile({ suffix: ".docx" });
  await Deno.writeFile(tmpPath, outBytes);
  return tmpPath;
}

/**
 * Notes:
 * - This implementation expects page breaks to appear as standalone paragraphs
 *   containing a `<w:br w:type="page"/>` run. The regex used to split pages
 *   tolerates extra attributes and whitespace, but if your document structures
 *   page breaks differently you may need to adjust the pattern.
 *
 * - By avoiding `DOMParser`, we sidestep the "unimplemented" XML parsing error.
 *   All operations on the XML are done via string manipulation and fast-xml-parser
 *   only if deeper transformation is required (not strictly used above).
 *
 * - If you need to inspect or manipulate other elements (e.g., styles, numbering),
 *   consider using `fast-xml-parser` to parse into a JS object and reconstruct via `XMLBuilder`.
 */
