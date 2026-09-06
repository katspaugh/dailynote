import type { MigrationStrategies, RxJsonSchema } from "rxdb";
import { extractSectionTypes } from "../../utils/sectionTypes";

export interface NoteDocType {
  date: string;
  content: string;
  updatedAt: string;
  isDeleted: boolean;
  /** Section types (`+run`, `+dream`) present in content. Derived, never
   *  authored: every write path recomputes it from `content`. */
  sectionTypes?: string[];
  weather?: {
    icon: string;
    temperatureHigh: number;
    temperatureLow: number;
    unit: "C" | "F";
    city: string;
  } | null;
}

export interface ImageDocType {
  id: string;
  noteDate: string;
  type: "background" | "inline";
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
  isDeleted: boolean;
}

export const noteSchema: RxJsonSchema<NoteDocType> = {
  version: 1,
  primaryKey: "date",
  type: "object",
  properties: {
    date: { type: "string", maxLength: 10 },
    content: { type: "string" },
    updatedAt: { type: "string" },
    isDeleted: { type: "boolean" },
    sectionTypes: {
      type: "array",
      items: { type: "string" },
    },
    weather: {
      type: ["object", "null"],
      properties: {
        icon: { type: "string" },
        temperatureHigh: { type: "number" },
        temperatureLow: { type: "number" },
        unit: { type: "string", enum: ["C", "F"] },
        city: { type: "string" },
      },
    },
  },
  required: ["date", "content", "updatedAt", "isDeleted"],
};

/**
 * Schema migrations for the notes collection. Each key is the version the
 * strategy migrates *to*; RxDB chains them from the stored version.
 */
export const noteMigrationStrategies: MigrationStrategies = {
  // v1: sectionTypes derived from content
  1: (doc: NoteDocType) => ({
    ...doc,
    sectionTypes: extractSectionTypes(doc.content),
  }),
};

export const imageSchema: RxJsonSchema<ImageDocType> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    noteDate: { type: "string", maxLength: 10 },
    type: { type: "string", enum: ["background", "inline"] },
    filename: { type: "string" },
    mimeType: { type: "string" },
    width: { type: "number" },
    height: { type: "number" },
    size: { type: "number" },
    createdAt: { type: "string" },
    isDeleted: { type: "boolean" },
  },
  required: [
    "id", "noteDate", "type", "filename", "mimeType",
    "width", "height", "size", "createdAt", "isDeleted",
  ],
  indexes: ["noteDate"],
  attachments: {},
};
