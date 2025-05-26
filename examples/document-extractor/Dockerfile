FROM denoland/deno:alpine
# Install dependencies

RUN apk add --no-cache mupdf mupdf-tools poppler-utils

WORKDIR /app

COPY . .

WORKDIR /app/
RUN deno cache main.ts

CMD ["deno", "task", "start"]
