# Document Extractor Example

This example demonstrates how to build a small HTTP service using
`@baiq/document-parser` to extract text and images from files stored on Google
Cloud Storage. The service accepts a `POST /extract` request with a JSON body
containing a `fileUrl` pointing to a GCS object. It downloads the file, extracts
its contents and re-uploads any extracted images, returning a JSON response with
signed URLs.

The service requires the following environment variables:

- `GCLOUD_PROJECT_ID`
- `GCLOUD_STORAGE_BUCKET`
- `GOOGLE_APPLICATION_CREDENTIALS`

See `env.sample` for an example configuration.

Run the service locally with:

```bash
$ deno task dev
```

A `Dockerfile` is provided to build a container image that includes the required
system packages (`mupdf`, `mupdf-tools`, `poppler-utils`).
