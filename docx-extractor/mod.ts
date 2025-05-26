import mammoth from "mammoth";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import type { PageContent } from "../types.ts";

export type DOCXExtractionResult = {
  pages: PageContent[];
};

/**
 * Extracts text paragraphs and images from a DOCX.
 * Treats the whole document as a single “page.”
 */
export async function extractDOCXContent(
  docxPath: string,
  outputDir: string
): Promise<DOCXExtractionResult> {
  // Make sure the output directory exists
  await ensureDir(outputDir);

  const images: string[] = [];

  // Convert to HTML, with a custom image handler
  const result = await mammoth.convertToHtml(
    { path: docxPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const ext = image.contentType.split("/")[1];
        const filename = `img-${crypto.randomUUID()}.${ext}`;
        const destPath = join(outputDir, filename);

        // Get a base64‐encoded string
        const b64: string = await image.read("base64");

        // Decode to a Uint8Array
        const binString = atob(b64);
        const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));

        await Deno.writeFile(destPath, bytes);
        images.push(destPath);

        return { src: destPath };
      }),
    }
  );

  const html = result.value;

  // 1) Extract clean paragraph text
  const paragraphs = Array.from(
    html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi),
    (m) => m[1].replace(/<[^>]+>/g, "").trim()
  ).filter((p) => p.length > 0);

  return {
    pages: [
      {
        images, // list of file paths to your extracted images
        paragraphs, // list of clean text paragraphs
      },
    ],
  };
}
