export type MangaPage = {
  id: string;
  imageUrl: string;
  alt: string;
};

export type MangaChapter = {
  id: string;
  title: string;
  pages: MangaPage[];
};
