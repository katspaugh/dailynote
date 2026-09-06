// @vitest-environment jsdom
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { NoteLogView } from "../components/NoteLog/NoteLogView";
import { ok } from "../domain/result";
import { getTodayString } from "../utils/date";

vi.mock("../contexts/weatherContext", () => ({
  useWeatherContext: () => ({
    state: { showWeather: false, dailyWeather: null },
    formatWeatherLabel: () => null,
  }),
}));

const imageRepository = {
  upload: vi.fn(),
  get: vi.fn().mockResolvedValue(ok(null)),
  getUrl: vi.fn().mockResolvedValue(ok(null)),
  delete: vi.fn().mockResolvedValue(ok(undefined)),
  getByNoteDate: vi.fn().mockResolvedValue(ok([])),
  deleteByNoteDate: vi.fn().mockResolvedValue(ok(undefined)),
};

vi.mock("../contexts/noteRepositoryContext", () => ({
  useNoteRepositoryContext: () => ({
    imageRepository,
    weather: null,
    noteSections: new Map(),
  }),
}));

vi.mock("../contexts/routingContext", () => ({
  useRoutingContext: () => ({ navigateToDate: vi.fn() }),
}));

vi.mock("../utils/imageCompression", () => ({
  compressImage: vi.fn(async (file: File) => ({
    blob: file,
    width: 120,
    height: 80,
    mimeType: file.type,
  })),
}));

type Deferred = {
  resolve: () => void;
  reject: (error: Error) => void;
};

function deferUpload(id: string): Deferred {
  const deferred: Partial<Deferred> = {};
  const result = new Promise((resolve, reject) => {
    deferred.resolve = () =>
      resolve(
        ok({
          id,
          noteDate: getTodayString(),
          type: "inline",
          filename: "photo.jpg",
          mimeType: "image/jpeg",
          width: 120,
          height: 80,
          size: 4,
          createdAt: new Date().toISOString(),
        }),
      );
    deferred.reject = reject;
  });
  imageRepository.upload.mockImplementationOnce(() => result);
  return deferred as Deferred;
}

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function renderView(onChange = vi.fn()) {
  const utils = render(
    <NoteLogView
      date={getTodayString()}
      content=""
      onChange={onChange}
      isContentReady={true}
    />,
  );
  const editor = utils.getByLabelText("New entry");
  const fileInput = utils.container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  return { ...utils, editor, fileInput, onChange };
}

function pickFile(fileInput: HTMLInputElement, name = "photo.jpg") {
  const file = new File(["data"], name, { type: "image/jpeg" });
  fireEvent.change(fileInput, { target: { files: [file] } });
}

describe("NoteLogView image uploads", () => {
  beforeEach(() => {
    imageRepository.upload.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    delete (globalThis as { caches?: unknown }).caches;
  });

  it("inserts a picked image into the composer once uploaded", async () => {
    const upload = deferUpload("img-1");
    const { editor, fileInput, getByLabelText } = renderView();

    pickFile(fileInput);
    expect(
      editor.querySelector('img[data-image-id="uploading"]'),
    ).not.toBeNull();

    await act(async () => upload.resolve());

    const image = editor.querySelector('img[data-image-id="img-1"]');
    expect(image).not.toBeNull();
    expect(editor.querySelector('img[data-image-id="uploading"]')).toBeNull();
    // The composer is not part of `content`, so nothing resolves a URL for
    // its images: the preview must stay as the src or the image shimmers.
    expect(image?.getAttribute("src")).toBe("blob:preview");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    fireEvent.click(getByLabelText("Save entry"));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("keeps the composer intact while the photo picker hides the page", async () => {
    const upload = deferUpload("img-1");
    const { editor, fileInput, getByLabelText, onChange } = renderView();
    editor.textContent = "on my way";

    // On mobile, opening the photo picker backgrounds the page.
    fireEvent.click(getByLabelText("Insert image"));
    setVisibility("hidden");

    expect(onChange).not.toHaveBeenCalled();
    expect(editor.textContent).toBe("on my way");

    pickFile(fileInput);
    setVisibility("visible");
    await act(async () => upload.resolve());

    expect(editor.textContent).toContain("on my way");
    expect(editor.querySelector('img[data-image-id="img-1"]')).not.toBeNull();

    // Once the picker is closed, backgrounding commits the entry as before.
    setVisibility("hidden");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toContain('data-image-id="img-1"');
    expect(onChange.mock.calls[0][0]).toContain("on my way");
  });

  it("still commits the entry when the page hides without a picker open", () => {
    const { editor, onChange } = renderView();
    editor.textContent = "quick thought";

    setVisibility("hidden");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toContain("quick thought");
  });

  it("waits for an in-flight upload before saving the entry", async () => {
    const upload = deferUpload("img-1");
    const { editor, fileInput, getByLabelText, onChange } = renderView();

    pickFile(fileInput);
    fireEvent.click(getByLabelText("Save entry"));

    expect(onChange).not.toHaveBeenCalled();
    expect(
      editor.querySelector('img[data-image-id="uploading"]'),
    ).not.toBeNull();

    await act(async () => upload.resolve());

    expect(onChange).toHaveBeenCalledTimes(1);
    const saved = onChange.mock.calls[0][0] as string;
    expect(saved).toContain('data-image-id="img-1"');
    expect(saved).not.toContain("uploading");
    expect(editor.querySelector("img")).toBeNull();
  });

  it("keeps a saved entry's resolved image across unrelated re-renders", async () => {
    imageRepository.get.mockResolvedValueOnce(
      ok(new Blob(["img"], { type: "image/jpeg" })),
    );
    const content =
      '<hr data-timestamp="2026-09-04T10:00:00.000Z" contenteditable="false">' +
      'hello<img data-image-id="img-saved" alt="p.jpg" width="10" height="10">';
    const { container, rerender } = render(
      <NoteLogView
        date={getTodayString()}
        content={content}
        onChange={vi.fn()}
        isContentReady={true}
      />,
    );

    const image = () =>
      container.querySelector('img[data-image-id="img-saved"]');
    await waitFor(() => {
      expect(image()?.getAttribute("src")).toBe("blob:preview");
    });

    // A parent re-render with the same content (e.g. a new onChange identity,
    // a sync status tick) must not rewrite the entry's DOM and lose the src.
    rerender(
      <NoteLogView
        date={getTodayString()}
        content={content}
        onChange={vi.fn()}
        isContentReady={true}
      />,
    );

    expect(image()?.getAttribute("src")).toBe("blob:preview");
  });

  it("inserts photos shared to the app via the share target", async () => {
    const upload = deferUpload("img-shared");
    window.history.replaceState({}, "", "/?share-target");

    const sharedBlob = new Blob(["data"], { type: "image/jpeg" });
    const headers = new Map([
      ["Content-Type", "image/jpeg"],
      ["X-Filename", "photo.jpg"],
    ]);
    const cache = {
      keys: vi.fn().mockResolvedValue(["/shared-image/1-photo.jpg"]),
      match: vi.fn().mockResolvedValue({
        blob: async () => sharedBlob,
        headers: { get: (name: string) => headers.get(name) ?? null },
      }),
    };
    (globalThis as { caches?: unknown }).caches = {
      open: vi.fn().mockResolvedValue(cache),
      delete: vi.fn().mockResolvedValue(true),
    };

    const { editor } = renderView();

    await waitFor(() => {
      expect(imageRepository.upload).toHaveBeenCalledTimes(1);
    });
    expect(imageRepository.upload.mock.calls[0][3]).toBe("photo.jpg");

    await act(async () => upload.resolve());

    expect(
      editor.querySelector('img[data-image-id="img-shared"]'),
    ).not.toBeNull();
    expect(window.location.search).toBe("");
  });
});
