// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  noteRepoReducer,
  type NoteRepoAction,
  type NoteRepoState,
} from "../hooks/useNoteRepository";
import { AppMode } from "../hooks/useAppMode";

function makeInputsAction(
  overrides: Partial<Extract<NoteRepoAction, { type: "INPUTS_CHANGED" }>> = {},
): NoteRepoAction {
  return {
    type: "INPUTS_CHANGED",
    userId: null,
    mode: AppMode.Local,
    vaultKey: null,
    activeKeyId: null,
    date: null,
    year: 2024,
    ...overrides,
  };
}

// Minimal seed replicating initialState shape via a date-change action chain
// is impractical (initialState is module-private), so drive from the reducer's
// own transitions starting at whatever INPUTS_CHANGED produces.
function stateForDate(date: string): NoteRepoState {
  // The reducer treats any state object structurally; construct a base state.
  const base = {
    phase: "ready",
    userId: null,
    mode: AppMode.Local,
    vaultKey: null,
    activeKeyId: null,
    date: null,
    year: 2024,
    db: null,
    dbName: null,
    repository: null,
    imageRepository: null,
    replication: null,
    syncStatus: "idle",
    syncError: null,
    note: null,
    noteLoading: true,
    noteError: null,
    weather: null,
    localContent: "",
    hasEdits: false,
    isSaving: false,
    noteDates: new Set<string>(),
    noteSections: new Map<string, string[]>(),
    isSoftDeleted: false,
    repositoryVersion: 0,
    emptyNoteDate: null,
  } as unknown as NoteRepoState;
  return noteRepoReducer(base, makeInputsAction({ date }));
}

describe("noteRepoReducer emptyNoteDate latch", () => {
  it("latches the date when its note loads empty", () => {
    const loading = stateForDate("01-06-2024");
    expect(loading.noteLoading).toBe(true);
    expect(loading.emptyNoteDate).toBeNull();

    const loaded = noteRepoReducer(loading, {
      type: "NOTE_DOC_CHANGED",
      note: null,
      isSoftDeleted: false,
      noteIsEmpty: true,
    });
    expect(loaded.emptyNoteDate).toBe("01-06-2024");
  });

  it("stays null when the note loads with content", () => {
    const loading = stateForDate("01-06-2024");
    const loaded = noteRepoReducer(loading, {
      type: "NOTE_DOC_CHANGED",
      note: { date: "01-06-2024", content: "<p>hi</p>", updatedAt: "1" },
      isSoftDeleted: false,
      noteIsEmpty: false,
    });
    expect(loaded.emptyNoteDate).toBeNull();
  });

  it("keeps the latch when content appears after load (autosave)", () => {
    const loading = stateForDate("01-06-2024");
    const loaded = noteRepoReducer(loading, {
      type: "NOTE_DOC_CHANGED",
      note: null,
      isSoftDeleted: false,
      noteIsEmpty: true,
    });
    const afterSave = noteRepoReducer(loaded, {
      type: "NOTE_DOC_CHANGED",
      note: { date: "01-06-2024", content: "<p>typed</p>", updatedAt: "2" },
      isSoftDeleted: false,
      noteIsEmpty: false,
    });
    expect(afterSave.emptyNoteDate).toBe("01-06-2024");
  });

  it("resets the latch when the date changes", () => {
    const loading = stateForDate("01-06-2024");
    const loaded = noteRepoReducer(loading, {
      type: "NOTE_DOC_CHANGED",
      note: null,
      isSoftDeleted: false,
      noteIsEmpty: true,
    });
    const navigated = noteRepoReducer(
      loaded,
      makeInputsAction({ date: "02-06-2024" }),
    );
    expect(navigated.emptyNoteDate).toBeNull();
    expect(navigated.noteLoading).toBe(true);
  });

  it("does not latch soft-deleted notes", () => {
    const loading = stateForDate("01-06-2024");
    const loaded = noteRepoReducer(loading, {
      type: "NOTE_DOC_CHANGED",
      note: null,
      isSoftDeleted: true,
      noteIsEmpty: false,
    });
    expect(loaded.emptyNoteDate).toBeNull();
  });
});

describe("noteRepoReducer note sections", () => {
  it("stores dates and section types together", () => {
    const state = stateForDate("01-06-2024");
    const next = noteRepoReducer(state, {
      type: "NOTE_DATES_CHANGED",
      dates: new Set(["01-06-2024", "02-06-2024"]),
      sections: new Map([["01-06-2024", ["run"]]]),
    });
    expect(next.noteDates.has("02-06-2024")).toBe(true);
    expect(next.noteSections.get("01-06-2024")).toEqual(["run"]);
    expect(next.noteSections.has("02-06-2024")).toBe(false);
  });

  it("clears sections when the user changes and a new database opens", () => {
    const state = noteRepoReducer(stateForDate("01-06-2024"), {
      type: "NOTE_DATES_CHANGED",
      dates: new Set(["01-06-2024"]),
      sections: new Map([["01-06-2024", ["run"]]]),
    });
    const switched = noteRepoReducer(
      { ...state, dbName: "local" },
      makeInputsAction({ date: "01-06-2024", userId: "user-1" }),
    );
    expect(switched.phase).toBe("opening");
    expect(switched.noteSections.size).toBe(0);
  });
});
