import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Terminal from "../../src/components/Terminal.jsx";

/** Types a command into the terminal input and presses Enter. */
async function run(user, command) {
  const input = screen.getByRole("textbox", { name: "Terminal command input" });
  await user.type(input, `${command}{Enter}`);
}

const output = () => screen.getByRole("log", { name: "Terminal output" }).textContent;

function setup() {
  const onOpenTool = vi.fn();
  const user = userEvent.setup();
  render(<Terminal onOpenTool={onOpenTool} />);
  return { user, onOpenTool };
}

describe("Terminal commands (current behavior)", () => {
  it("shows the boot hint", () => {
    setup();
    expect(output()).toContain("type 'help' to get started.");
  });

  it("prints help, whoami and the sudo easter egg", async () => {
    const { user } = setup();
    await run(user, "help");
    expect(output()).toContain("available commands:");
    await run(user, "whoami");
    expect(output()).toContain("a very convincing impression");
    await run(user, "sudo rm -rf /");
    expect(output()).toContain("you have 0 privileges here");
  });

  it("answers an unknown command", async () => {
    const { user } = setup();
    await run(user, "frobnicate");
    expect(output()).toContain("command not found");
  });

  it("clears the screen", async () => {
    const { user } = setup();
    await run(user, "help");
    await run(user, "clear");
    expect(output()).toBe("");
  });

  it("lists the root and reads a file", async () => {
    const { user } = setup();
    await run(user, "ls");
    expect(output()).toContain("about.txt   contact.txt   tools/");
    await run(user, "cat about.txt");
    expect(output()).toContain("22 years making Google behave");
  });

  it("reports missing files, directories and arguments", async () => {
    const { user } = setup();
    await run(user, "cat nope.txt");
    expect(output()).toContain("cat: nope.txt: no such file");
    await run(user, "cat tools");
    expect(output()).toContain("cat: tools: is a directory");
    await run(user, "cat");
    expect(output()).toContain("cat: missing filename");
    await run(user, "cd nowhere");
    expect(output()).toContain("cd: nowhere: no such directory");
  });

  it("walks into tools, lists every slug, and refuses to cat a tool", async () => {
    const { user } = setup();
    await run(user, "cd tools");
    await run(user, "ls");
    for (const slug of ["utm-auditor", "gtm-auditor", "cac-calculator", "attribution", "disclosure-check"]) {
      expect(output()).toContain(slug);
    }
    expect(output()).toContain("[more coming]");
    await run(user, "cat utm-auditor");
    expect(output()).toContain("that's a tool, not a file");
  });

  it("updates the prompt on cd and returns with cd ..", async () => {
    const { user } = setup();
    await run(user, "cd tools");
    expect(screen.getByText("faysal@desktop:~/tools$")).toBeTruthy();
    await run(user, "cd ..");
    expect(screen.getByText("faysal@desktop:~$")).toBeTruthy();
  });

  it("opens a tool through the onOpenTool callback", async () => {
    const { user, onOpenTool } = setup();
    await run(user, "open utm-auditor");
    expect(onOpenTool).toHaveBeenCalledWith(
      "utm-auditor",
      "UTM Governance Auditor",
      "https://portfolio.faysalahmed.ca/tools/utm-auditor/",
    );
  });

  it("opens the portfolio in a new tab for 'open resume'", async () => {
    const { user } = setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await run(user, "open resume");
    expect(open).toHaveBeenCalledWith("https://portfolio.faysalahmed.ca", "_blank", "noopener");
    open.mockRestore();
  });

  it("recalls earlier commands with the arrow keys", async () => {
    const { user } = setup();
    await run(user, "whoami");
    const input = /** @type {HTMLInputElement} */ (screen.getByRole("textbox", { name: "Terminal command input" }));
    await user.type(input, "{ArrowUp}");
    expect(input.value).toBe("whoami");
    await user.type(input, "{ArrowDown}");
    expect(input.value).toBe("");
  });
});

// Review D3: path handling in the terminal.
describe("Terminal paths (D3)", () => {
  it("accepts a trailing slash in cd", async () => {
    const { user } = setup();
    await run(user, "cd tools/");
    expect(screen.getByText("faysal@desktop:~/tools$")).toBeTruthy();
  });

  it("honors the path argument of ls", async () => {
    const { user } = setup();
    await run(user, "ls tools");
    expect(output()).toContain("utm-auditor");
    expect(screen.getByText("faysal@desktop:~$")).toBeTruthy();
  });

  it("hides dotfiles from a plain ls and shows them with -a", async () => {
    const { user } = setup();
    await run(user, "ls");
    expect(output()).not.toContain(".secrets");
    await run(user, "ls -a");
    expect(output()).toContain(".secrets/");
  });

  it("lists a hidden directory by path", async () => {
    const { user } = setup();
    await run(user, "ls .secrets");
    expect(output()).toContain("resume-link.txt");
  });

  it("resolves multi-segment paths in cat", async () => {
    const { user } = setup();
    await run(user, "cat .secrets/resume-link.txt");
    expect(output()).toContain("the paper trail lives at");
  });

  it("cds through nested paths and parent segments", async () => {
    const { user } = setup();
    await run(user, "cd .secrets");
    expect(screen.getByText("faysal@desktop:~/.secrets$")).toBeTruthy();
    await run(user, "cd ../tools");
    expect(screen.getByText("faysal@desktop:~/tools$")).toBeTruthy();
    await run(user, "cd /");
    expect(screen.getByText("faysal@desktop:~$")).toBeTruthy();
  });

  it("refuses to cd into a file and reports ls on a missing path", async () => {
    const { user } = setup();
    await run(user, "cd about.txt");
    expect(output()).toContain("cd: about.txt: not a directory");
    await run(user, "ls nowhere");
    expect(output()).toContain("ls: nowhere: no such file or directory");
  });

  it("does not resolve inherited object keys as files", async () => {
    const { user } = setup();
    await run(user, "cat constructor");
    expect(output()).toContain("cat: constructor: no such file");
  });
});
