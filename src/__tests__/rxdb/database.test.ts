import { describe, it, expect, afterEach } from "vitest";
import { createAppDatabase, type AppDatabase } from "../../storage/rxdb/database";
import { noteMigrationStrategies, noteSchema } from "../../storage/rxdb/schemas";

describe("createAppDatabase", () => {
  let db: AppDatabase | null = null;

  afterEach(async () => {
    if (db) {
      await db.close();
      db = null;
    }
  });

  it("creates a database with notes and images collections", async () => {
    db = await createAppDatabase("test-user-123");
    expect(db.notes).toBeDefined();
    expect(db.images).toBeDefined();
  });

  it("notes collection has correct schema properties", async () => {
    db = await createAppDatabase("test-user-456");
    const schema = db.notes.schema.jsonSchema;
    expect(schema.primaryKey).toBe("date");
    expect(schema.properties).toHaveProperty("content");
    expect(schema.properties).toHaveProperty("updatedAt");
    expect(schema.properties).toHaveProperty("isDeleted");
  });

  it("images collection has correct schema properties", async () => {
    db = await createAppDatabase("test-user-789");
    const schema = db.images.schema.jsonSchema;
    expect(schema.primaryKey).toBe("id");
    expect(schema.properties).toHaveProperty("noteDate");
    expect(schema.properties).toHaveProperty("filename");
    expect(schema.properties).toHaveProperty("mimeType");
    expect(schema.properties).toHaveProperty("isDeleted");
  });

  it("notes schema is at v1 with sectionTypes and a migration for it", async () => {
    db = await createAppDatabase("test-user-sections");
    const schema = db.notes.schema.jsonSchema;
    expect(schema.version).toBe(1);
    expect(schema.properties).toHaveProperty("sectionTypes");
    expect(noteSchema.version).toBe(1);
    expect(Object.keys(noteMigrationStrategies)).toEqual(["1"]);
  });

  it("v1 migration derives sectionTypes from stored content", () => {
    const migrated = noteMigrationStrategies[1](
      {
        date: "01-01-2024",
        content: '<div data-section-type="run">+run</div><div>5k</div>',
        updatedAt: "2024-01-01T00:00:00.000Z",
        isDeleted: false,
        weather: null,
      },
      null as never,
    );
    expect(migrated.sectionTypes).toEqual(["run"]);
    expect(migrated.content).toContain("+run");
  });

  it("images collection supports attachments", async () => {
    db = await createAppDatabase("test-user-att");
    expect(db.images.schema.jsonSchema.attachments).toBeDefined();
  });
});
