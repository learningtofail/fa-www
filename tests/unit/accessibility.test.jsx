import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopShell from "../../src/components/DesktopShell.jsx";
import IframeContent from "../../src/components/IframeContent.jsx";
import MobileShell from "../../src/components/MobileShell.jsx";
import Window from "../../src/components/Window.jsx";
import { TOOL_FRAME } from "../../src/data/tools.js";

const dockButton = (container, name) => within(container.querySelector(".gnome-dock")).getByRole("button", { name });

describe("focus handoff (S11)", () => {
  it("moves focus into a window opened from the dock and returns it when the window closes", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    const tools = dockButton(container, "Tools");
    await user.click(tools);
    // Focus is inside the new dialog once it has mounted from a user action.
    const dialog = screen.getByRole("dialog", { name: "Tools" });
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.click(within(dialog).getByRole("button", { name: "Close Tools" }));
    expect(document.activeElement).toBe(tools);
  });

  it("puts the terminal input in focus when the terminal opens", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    await user.click(dockButton(container, "Terminal"));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Terminal command input" }));
  });

  it("does not steal focus for the windows that are open at page load", () => {
    render(<DesktopShell lastDeploy="x" />);
    expect(document.activeElement).toBe(document.body);
  });

  it("does not move focus to an opener that has left the page", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    const tools = dockButton(container, "Tools");
    await user.click(tools);
    tools.remove();
    await user.click(screen.getByRole("button", { name: "Close Tools" }));
    expect(document.activeElement).toBe(document.body);
  });

  it("returns focus to the home-screen icon when a mobile app view closes", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    const icon = screen.getByRole("button", { name: "About" });
    await user.click(icon);
    expect(screen.getByRole("dialog", { name: "About" }).contains(document.activeElement)).toBe(true);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(document.activeElement).toBe(icon);
  });

  it("closes the mobile tools popup on Escape and returns focus to the folder icon", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    const folder = screen.getByRole("button", { name: "Tools" });
    await user.click(folder);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Tools" })).toBeNull();
    expect(document.activeElement).toBe(folder);
  });

  it("closes a mobile app view on Escape", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "About" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "About" })).toBeNull();
  });
});

describe("window keyboard policy", () => {
  function setup() {
    const handlers = { onFocus: vi.fn(), onClose: vi.fn(), onMinimize: vi.fn(), onMove: vi.fn(), onResize: vi.fn() };
    document.documentElement.style.setProperty("--window-key-step", "16px");
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 600);
    render(
      <Window id="w" title="demo" x={100} y={80} width={400} height={300} zIndex={1} noPadding={false} {...handlers}>
        <p>body</p>
      </Window>,
    );
    return { handlers, handle: screen.getByRole("button", { name: "demo" }) };
  }

  afterEach(() => {
    document.documentElement.removeAttribute("style");
    vi.unstubAllGlobals();
  });

  it("exposes a focusable title control described by the key hints", () => {
    const { handle } = setup();
    expect(handle.getAttribute("aria-describedby")).toBeTruthy();
    const hint = document.getElementById(handle.getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toMatch(/Arrow keys move this window.*Shift plus arrow keys resize/);
  });

  it("moves with the arrow keys", async () => {
    const user = userEvent.setup();
    const { handlers, handle } = setup();
    handle.focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(handlers.onMove).toHaveBeenNthCalledWith(1, "w", 116, 80);
    expect(handlers.onMove).toHaveBeenNthCalledWith(2, "w", 100, 96);
    expect(handlers.onResize).not.toHaveBeenCalled();
  });

  it("resizes with Shift plus the arrow keys", async () => {
    const user = userEvent.setup();
    const { handlers, handle } = setup();
    handle.focus();
    await user.keyboard("{Shift>}{ArrowRight}{ArrowUp}{/Shift}");
    expect(handlers.onResize).toHaveBeenNthCalledWith(1, "w", 416, 300);
    expect(handlers.onResize).toHaveBeenNthCalledWith(2, "w", 400, 284);
    expect(handlers.onMove).not.toHaveBeenCalled();
  });

  it("leaves other keys alone", () => {
    const { handlers, handle } = setup();
    fireEvent.keyDown(handle, { key: "a" });
    expect(handlers.onMove).not.toHaveBeenCalled();
    expect(handlers.onResize).not.toHaveBeenCalled();
  });
});

describe("IframeContent", () => {
  afterEach(() => vi.useRealTimers());

  it("sandboxes the frame and loads it lazily with a referrer policy", () => {
    render(<IframeContent url="https://tools.test/a/" label="Tool A" />);
    const frame = screen.getByTitle("Tool A");
    expect(frame.getAttribute("sandbox")).toBe(TOOL_FRAME.sandbox);
    expect(frame.getAttribute("loading")).toBe("lazy");
    expect(frame.getAttribute("referrerpolicy")).toBe(TOOL_FRAME.referrerPolicy);
  });

  it("always offers a link that opens the tool in a new tab", () => {
    render(<IframeContent url="https://tools.test/a/" label="Tool A" />);
    const link = screen.getByRole("link", { name: "Open Tool A in a new tab" });
    expect(link.getAttribute("href")).toBe("https://tools.test/a/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows the fallback notice when the frame has not loaded in time, and drops it once it loads", () => {
    vi.useFakeTimers();
    render(<IframeContent url="https://tools.test/a/" label="Tool A" />);
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => vi.advanceTimersByTime(TOOL_FRAME.loadTimeoutMs + 1));
    expect(screen.getByRole("alert").textContent).toMatch(/did not load/);
    fireEvent.load(screen.getByTitle("Tool A"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("never shows the fallback once the frame has loaded, even after the timeout", () => {
    vi.useFakeTimers();
    render(<IframeContent url="https://tools.test/a/" label="Tool A" />);
    fireEvent.load(screen.getByTitle("Tool A"));
    act(() => vi.advanceTimersByTime(TOOL_FRAME.loadTimeoutMs + 1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("desktop chrome", () => {
  it("hides the decorative tray emoji from assistive technology", () => {
    const { container } = render(<DesktopShell lastDeploy="x" />);
    const tray = container.querySelectorAll(".gnome-tray span");
    expect(tray).toHaveLength(3);
    for (const el of tray) expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("tiles windows into the measured desktop surface through the layout tokens", async () => {
    const user = userEvent.setup();
    document.documentElement.style.setProperty("--tile-margin", "20px");
    document.documentElement.style.setProperty("--tile-gap", "16px");
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 600);
    render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Activities" }));
    const about = screen.getByRole("dialog", { name: "about.txt" });
    expect(about.style.getPropertyValue("--window-x")).toBe("20px");
    expect(about.style.getPropertyValue("--window-y")).toBe("20px");
    document.documentElement.removeAttribute("style");
    vi.unstubAllGlobals();
  });

  it("clears the icon selection when the user clicks away", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    const icon = container.querySelector(".desktop-icon");
    await user.click(icon);
    expect(icon.classList.contains("selected")).toBe(true);
    await user.click(container.querySelector(".gnome-desktop-surface"));
    expect(icon.classList.contains("selected")).toBe(false);
  });
});
