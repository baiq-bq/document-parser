export type PageContent = {
  images: string[];
  paragraphs: string[];
};

export type DocExtractionResult = {
  /** Ordered list of page contents. */
  pages: PageContent[];
};
