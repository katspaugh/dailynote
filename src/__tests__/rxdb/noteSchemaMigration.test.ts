import { describe, it, expect, afterEach } from "vitest";
import { createRxDatabase, type RxDatabase, type RxJsonSchema } from "rxdb/plugins/core";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { createAppDatabase, type AppDatabase } from "../../storage/rxdb/database";
import { imageSchema } from "../../storage/rxdb/schemas";

// The notes schema as shipped before sectionTypes existed.
interface NoteV0 {
  date: string;
  content: string;
  updatedAt: string;
  isDeleted: boolean;
  weather?: null;
}

const noteSchemaV0: RxJsonSchema<NoteV0> = {
  version: 0,
  primaryKey: "date",
  type: "object",
  properties: {
    date: { type: "string", maxLength: 10 },
    content: { type: "string" },
    updatedAt: { type: "string" },
    isDeleted: { type: "boolean" },
    weather: { type: ["object", "null"], properties: {} },
  },
  required: ["date", "content", "updatedAt", "isDeleted"],
};

describe("notes schema migration v0 → v1", () => {
  let db: AppDatabase | null = null;

  afterEach(async () => {
    if (db) {
      await db.remove();
      db = null;
    }
  });

  it("fills sectionTypes for notes stored before the field existed", async () => {
    const userId = `migrate-${Date.now()}-${Math.random()}`;
    const name = `ichinichi-${userId}`;

    // Memory storage keeps data by database name across close(), which
    // stands in for Dexie persisting between app launches.
    const legacy: RxDatabase = await createRxDatabase({
      name,
      storage: getRxStorageMemory(),
    });
    await legacy.addCollections({
      notes: { schema: noteSchemaV0 },
      images: { schema: imageSchema },
    });
    await legacy.notes.insert({
      date: "03-03-2025",
      content: '<div data-section-type="run">+run</div><div>5k</div>',
      updatedAt: "2025-03-03T08:00:00.000Z",
      isDeleted: false,
      weather: null,
    });
    await legacy.notes.insert({
      date: "04-03-2025",
      content: "<p>no sections</p>",
      updatedAt: "2025-03-04T08:00:00.000Z",
      isDeleted: false,
      weather: null,
    });
    await legacy.close();

    db = await createAppDatabase(userId, { memory: true });
    const run = await db.notes.findOne("03-03-2025").exec();
    const plain = await db.notes.findOne("04-03-2025").exec();

    expect(run?.sectionTypes).toEqual(["run"]);
    expect(run?.content).toContain("+run");
    expect(plain?.sectionTypes).toEqual([]);
  });
});
