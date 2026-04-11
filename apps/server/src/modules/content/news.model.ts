import { Schema, model, Document } from "mongoose";

export interface INews extends Document {
  title: string;
  slug: string;
  authorId: string;
  mainImage: string;
  excerpt: string;
  content: Array<{
    type: "text" | "image" | "video" | "motorcycle";
    value: any;
  }>;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    authorId: { type: String, required: true },
    mainImage: { type: String, default: "" },
    excerpt: { type: String, required: true },
    content: [
      {
        _id: false, //Отключаем генерацию ID для каждого блока внутри массива
        type: {
          type: String,
          enum: ["text", "image", "video", "motorcycle"],
          required: true,
        },
        value: {
          type: Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
    collection: "news",
  },
);

export const NewsModel = model<INews>("News", NewsSchema);
