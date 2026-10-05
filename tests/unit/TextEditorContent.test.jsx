import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextEditorContent from "../../src/components/TextEditorContent.jsx";
import { DRAFT_KEY, MAX_FILE_BYTES } from "../../src/lib/textEditor.js";

const downloads = vi.hoisted(() => ({ downloadText: vi.fn() }));
vi.mock("../../src/lib/fileDownload.js", () => ({
  downloadText: downloads.downloadText,
  browserDownloadDeps: {},
}));

const textbox = () => /** @type {HTMLTextAreaElement} */ (screen.getByRole("textbox", { name: "Document text" }));
const nameField = () => /** @type {HTMLInputElement} */ (screen.getByRole("textbox", { name: "File name" }));
const button = (name) => /** @type {HTMLButtonElement} */ (screen.getByRole("button", { name }));
/** The zoom readout is an <output> (also role "status"), so find the save state by its class. */
const status = () => document.querySelector(".editor__state")?.textContent;

function setup() {
  const user = userEvent.setup({ applyAccept: false });
  render(<TextEditorContent />);
  return user;
}

beforeEach(() => {
  window.localStorage.clear();
  downloads.downloadText.mockClear();
});

describe("TextEditorContent", () => {
  it("starts empty and saved, with the caret at line 1, column 1", () => {
    setup();
    expect(textbox().value).toBe("");
    expect(status()).toBe("Saved");
    expect(screen.getByText("Ln 1, Col 1")).toBeTruthy();
    expect(screen.getByText("0 words")).toBeTruthy();
  });

  it("updates counts, the caret position and the saved state as you type", async () => {
    const user = setup();
    await user.type(textbox(), "hello world{Enter}ok");
    expect(screen.getByText("3 words")).toBeTruthy();
    expect(screen.getByText("14 characters")).toBeTruthy();
    expect(screen.getByText("Ln 2, Col 3")).toBeTruthy();
    expect(status()).toBe("Unsaved changes");
  });

  it("follows the caret when it moves without typing", async () => {
    const user = setup();
    await user.type(textbox(), "ab\ncd");
    await user.keyboard("{ArrowUp}{Home}");
    expect(screen.getByText("Ln 1, Col 1")).toBeTruthy();
  });

  it("downloads the text under a normalized name and marks it saved", async () => {
    const user = setup();
    await user.type(textbox(), "draft");
    const name = nameField();
    await user.clear(name);
    await user.type(name, "my notes");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(downloads.downloadText).toHaveBeenCalledWith("my notes.txt", "draft", {});
    expect(name.value).toBe("my notes.txt");
    expect(status()).toBe("Saved");
  });

  it("saves with Ctrl+S from the text area and from the name field", async () => {
    const user = setup();
    await user.type(textbox(), "x");
    await user.keyboard("{Control>}s{/Control}");
    expect(downloads.downloadText).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("textbox", { name: "File name" }));
    await user.keyboard("{Control>}s{/Control}");
    expect(downloads.downloadText).toHaveBeenCalledTimes(2);
  });

  it("opens a file, uses its name and counts it as saved", async () => {
    const user = setup();
    await user.upload(
      screen.getByLabelText("Choose a text file"),
      new File(["one two three"], "report.md", { type: "text/markdown" }),
    );
    await waitFor(() => expect(textbox().value).toBe("one two three"));
    expect(nameField().value).toBe("report.md");
    expect(status()).toBe("Saved");
  });

  it("refuses a file over the size limit and keeps the document", async () => {
    const user = setup();
    await user.type(textbox(), "keep me");
    await user.upload(
      screen.getByLabelText("Choose a text file"),
      new File(["x".repeat(MAX_FILE_BYTES + 1)], "huge.txt", { type: "text/plain" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe("huge.txt is larger than 1 MB.");
    expect(textbox().value).toBe("keep me");
  });

  it("reports a file that cannot be read", async () => {
    const user = setup();
    const file = new File(["x"], "broken.txt", { type: "text/plain" });
    file.text = () => Promise.reject(new Error("read failed"));
    await user.upload(screen.getByLabelText("Choose a text file"), file);
    expect((await screen.findByRole("alert")).textContent).toBe("Could not read broken.txt.");
  });

  it("asks before New throws away unsaved changes, and cancels on blur", async () => {
    const user = setup();
    await user.type(textbox(), "precious");
    await user.click(screen.getByRole("button", { name: "New" }));
    expect(textbox().value).toBe("precious");
    await user.click(textbox()); // blur cancels the question
    expect(screen.getByRole("button", { name: "New" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "New" }));
    await user.click(screen.getByRole("button", { name: "Discard changes?" }));
    expect(textbox().value).toBe("");
    expect(status()).toBe("Saved");
  });

  it("starts a new document at once when there is nothing unsaved", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "New" }));
    expect(screen.queryByRole("button", { name: "Discard changes?" })).toBeNull();
  });

  it("asks before Open replaces unsaved changes", async () => {
    const user = setup();
    await user.type(textbox(), "x");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Discard changes?" })).toBeTruthy();
  });

  it("toggles word wrap", async () => {
    const user = setup();
    const toggle = screen.getByRole("button", { name: "Word wrap" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(textbox().getAttribute("wrap")).toBe("soft");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(textbox().getAttribute("wrap")).toBe("off");
  });

  it("zooms between 75 and 200 percent and disables the buttons at the ends", async () => {
    const user = setup();
    const out = button("Zoom out");
    const inn = button("Zoom in");
    await user.click(out);
    expect(textbox().getAttribute("data-zoom")).toBe("75");
    expect(out.disabled).toBe(true);
    for (let i = 0; i < 4; i++) await user.click(inn);
    expect(textbox().getAttribute("data-zoom")).toBe("200");
    expect(inn.disabled).toBe(true);
  });

  it("keeps a draft across a reload and treats it as unsaved", async () => {
    const user = setup();
    await user.type(textbox(), "carry on");
    await waitFor(() => expect(window.localStorage.getItem(DRAFT_KEY)).toContain("carry on"));
    document.body.innerHTML = "";
    const { unmount } = render(<TextEditorContent />);
    expect(textbox().value).toBe("carry on");
    expect(status()).toBe("Unsaved changes");
    unmount();
  });
});
