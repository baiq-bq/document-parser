// mod.ts
import JSZip from "jszip";
import { ensureDir } from "@std/fs";
import { basename, dirname, join } from "@std/path";
import { DOMParser } from "@b-fuze/deno-dom";
import { XMLParser } from "npm:fast-xml-parser";

export type PageContent = {
  images: string[];
  paragraphs: string[];
};

export type EPUBExtractionResult = {
  pages: PageContent[];
};

// configure fast-xml-parser to expose attributes as normal props
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

async function readXmlObj(zip: JSZip, path: string): Promise<any> {
  const file = zip.file(path);
  if (!file) throw new Error(`Missing file in epub: ${path}`);
  const text = await file.async("text");
  try {
    return xmlParser.parse(text);
  } catch (e: unknown) {
    const message =
      typeof e === "object" && e !== null && "message" in e
        ? (e as { message: string }).message
        : String(e);
    throw new Error(`Failed to parse XML (${path}): ${message}`);
  }
}

/**
 * Extract text paragraphs and images from an EPUB file.
 */
export async function extractEPUBContent(
  epubPath: string,
  outputDir: string
): Promise<EPUBExtractionResult> {
  await ensureDir(outputDir);
  const data = await Deno.readFile(epubPath);
  const zip = await JSZip.loadAsync(data);

  // 1) parse container.xml to find the OPF package path
  const containerJson = await readXmlObj(zip, "META-INF/container.xml");
  // path is at container.rootfiles.rootfile["full-path"]
  const opfPath = containerJson.container.rootfiles.rootfile["full-path"];
  if (!opfPath) throw new Error("container.xml missing rootfile/full-path");

  // 2) parse the OPF document as JSON
  const opfJson = await readXmlObj(zip, opfPath);
  const pkg = opfJson.package;

  // build a manifest map: id → { href, mediaType }
  const manifest: Record<string, { href: string; mediaType: string }> = {};
  const items = Array.isArray(pkg.manifest.item)
    ? pkg.manifest.item
    : [pkg.manifest.item];
  for (const item of items) {
    const id = item.id!;
    manifest[id] = {
      href: item.href!,
      mediaType: item["media-type"]!,
    };
  }

  // build spine array of idrefs
  const spine: string[] = [];
  const refs = Array.isArray(pkg.spine.itemref)
    ? pkg.spine.itemref
    : [pkg.spine.itemref];
  for (const ref of refs) {
    if (ref.idref) spine.push(ref.idref);
  }

  const pages: PageContent[] = [];
  for (const [idx, id] of spine.entries()) {
    const item = manifest[id];
    if (!item || !item.mediaType.includes("html")) continue;

    // load the XHTML
    const filePath = join(dirname(opfPath), item.href);
    const file = zip.file(filePath);
    if (!file) continue;
    const html = await file.async("text");
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) continue;

    // extract paragraphs
    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map((p) => p.textContent?.trim() || "")
      .filter((t) => t.length > 0);

    // extract images
    const images: string[] = [];
    for (const img of Array.from(doc.querySelectorAll("img"))) {
      const src = img.getAttribute("src");
      if (!src) continue;
      const imgPath = join(dirname(filePath), src);
      const imgFile = zip.file(imgPath);
      if (!imgFile) continue;
      const dest = join(outputDir, `page-${idx + 1}-${basename(src)}`);
      const bytes = await imgFile.async("uint8array");
      await Deno.writeFile(dest, bytes);
      images.push(dest);
    }

    pages.push({ images, paragraphs });
  }

  return { pages };
}
