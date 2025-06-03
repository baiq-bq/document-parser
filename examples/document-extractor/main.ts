import { basename, extname, join } from "@std/path";
import { ensureDir } from "@std/fs";
import { Storage } from "@google-cloud/storage";
import { extractPDFContent } from "@baiq/document-parser";
import { extractEPUBContent } from "@baiq/document-parser";
import { extractDOCXContent } from "@baiq/document-parser";

const projectId = Deno.env.get("GCLOUD_PROJECT_ID");
if (!projectId) {
  throw new Error("GCLOUD_PROJECT_ID environment variable is not set");
}

const bucketName = Deno.env.get("GCLOUD_STORAGE_BUCKET")!;
if (!bucketName) {
  throw new Error("GCLOUD_STORAGE_BUCKET environment variable is not set");
}

const keyFile = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS");
if (!keyFile) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set",
  );
}

const storage = new Storage({ projectId });
const bucket = storage.bucket(bucketName);

async function generateSignedUrl(filePath: string): Promise<string> {
  const file = bucket.file(filePath);

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60, // 1 hour expiration
  });

  return signedUrl;
}

async function uploadFile(
  localPath: string,
  destPath: string,
): Promise<string> {
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      cacheControl: "public max-age=86400",
      customTime: new Date().toISOString(),
    },
    predefinedAcl: undefined, // Ensures no ACL modification
  });

  // Generate Signed URL instead of public URL
  const signedUrl = await generateSignedUrl(destPath);
  console.log(`File uploaded to ${destPath}, accessible at ${signedUrl}`);

  return signedUrl;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (req.method !== "POST" || url.pathname !== "/extract") {
    return new Response("Not Found", { status: 404 });
  }

  const { fileUrl } = await req.json();
  if (!fileUrl) {
    return new Response("Missing fileUrl", { status: 400 });
  }

  const match = fileUrl.match(
    /^https:\/\/storage\.cloud\.google\.com\/([^\/]+)\/(.+)$/,
  );
  if (!match || match[1] !== bucketName) {
    return new Response("Invalid GCS URL", { status: 400 });
  }

  const [, , objectPath] = match;

  const ext = extname(objectPath).toLowerCase();
  if (![".pdf", ".epub", ".docx"].includes(ext)) {
    return new Response("Unsupported file type", { status: 400 });
  }

  await ensureDir("/tmp");
  const localFile = join("/tmp", `${crypto.randomUUID()}${ext}`);

  console.log(`Downloading gs://${bucketName}/${objectPath} to ${localFile}`);

  try {
    await bucket.file(objectPath).download({ destination: localFile });
  } catch (err) {
    console.error("GCS download failed:", err);
    return new Response("Failed to download file from GCS", { status: 400 });
  }

  const fileDest = `uploads/${basename(localFile)}`;
  const uploadedFileUrl = await uploadFile(localFile, fileDest);

  const outputDir = "/tmp/extract-output";
  let pages;
  if (ext === ".pdf") {
    pages = (await extractPDFContent(localFile, outputDir)).pages;
  } else if (ext === ".epub") {
    pages = (await extractEPUBContent(localFile, outputDir)).pages;
  } else {
    pages = (await extractDOCXContent(localFile, outputDir)).pages;
  }

  for (const [idx, page] of pages.entries()) {
    const uploaded: string[] = [];
    for (const imgPath of page.images) {
      const dest = `uploads/${basename(localFile)}/page-${idx + 1}-${
        basename(
          imgPath,
        )
      }`;
      const url = await uploadFile(imgPath, dest);
      uploaded.push(url);
    }
    page.images = uploaded;
  }

  await Deno.remove(localFile);
  await Deno.remove(outputDir, { recursive: true });

  const result = {
    fileUrl: uploadedFileUrl,
    pages,
  };
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(
  {
    port: 8000,
    onListen: () =>
      console.log(
        "Document extractor service running on http://localhost:8000",
      ),
  },
  handler,
);
