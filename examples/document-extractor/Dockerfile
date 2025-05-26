FROM denoland/deno:alpine
# Install dependencies

RUN apk add --no-cache mupdf mupdf-tools poppler-utils

WORKDIR /app

COPY deno.json ./deno.json
COPY libs/deno ./libs/deno
COPY examples/document-extractor ./examples/document-extractor

WORKDIR /app/examples/document-extractor
RUN deno cache main.ts

CMD ["deno", "task", "start"]
