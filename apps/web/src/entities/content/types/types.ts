export interface News {
  authorId: string;
  content: {
    type: string;
    value: string;
  }[];
  createdAt: string;
  excerpt: string;
  mainImage: string;
  slug: string;
  status: NewsStatus;
  tags: string[];
  title: string;
  updatedAt: string;
  __v: number;
  _id: string;
}

enum NewsStatus {
  "DRAFT",
  "PUBLISHED",
}
