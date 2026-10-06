import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopShell from "../../src/components/DesktopShell.jsx";
import MobileShell from "../../src/components/MobileShell.jsx";
import { yearsActive } from "../../src/data/profile.js";

/** Dock buttons share accessible names with desktop icons, so scope queries to the dock. */
const dockButton = (container, name) => within(container.querySelector(".gnome-dock")).getByRole("button", { name });

const windowTitles = () => screen.queryAllByRole("dialog").map((w) => w.getAttribute("aria-label"));

describe("DesktopShell", () => {
  it("opens with about, contact and status windows", () => {
    render(<DesktopShell lastDeploy="2026-10-04" theme="light" onThemeChange={vi.fn()} />);
    expect(windowTitles().sort()).toEqual(["about.txt", "contact.txt", "status.txt"]);
    expect(screen.getByText("last deploy: 2026-10-04")).toBeTruthy();
  });

  it("shows four desktop icons and ten dock buttons", () => {
    const { container } = render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    expect(container.querySelectorAll(".desktop-icon")).toHaveLength(4);
    expect(container.querySelectorAll(".gnome-dock .dock-icon-btn")).toHaveLength(10);
  });

  it("closes and minimizes windows with the titlebar buttons", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    expect(windowTitles()).not.toContain("about.txt");
    await user.click(screen.getByRole("button", { name: "Minimize contact.txt" }));
    expect(windowTitles()).not.toContain("contact.txt");
  });

  it("restores a closed window from the dock", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    await user.click(dockButton(container, "About"));
    expect(windowTitles()).toContain("about.txt");
  });

  it("opens a desktop icon with Enter, which stands in for double-click", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    const icon = screen.getAllByRole("button", { name: "About" }).find((b) => b.classList.contains("desktop-icon"));
    icon.focus();
    await user.keyboard("{Enter}");
    expect(windowTitles()).toContain("about.txt");
  });

  it("opens an Astro tool from the Marketing folder in an iframe window", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(dockButton(container, "Marketing"));
    const folder = screen.getByRole("dialog", { name: "Marketing" });
    await user.click(within(folder).getByRole("button", { name: "Multi-Touch" }));
    const frame = screen.getAllByTitle("Multi-Touch Attribution").find((el) => el.tagName === "IFRAME");
    expect(frame.getAttribute("src")).toBe("https://portfolio.faysalahmed.ca/tools/attribution/");
  });

  it("opens a marketing tool as its own window, with its own dock icon and the marketing frame", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(dockButton(container, "Marketing"));
    const folder = screen.getByRole("dialog", { name: "Marketing" });
    expect(folder.querySelectorAll(".tools-grid__tile")).toHaveLength(23);
    expect(within(folder).getByRole("heading", { name: "Technical SEO" })).toBeTruthy();
    await user.click(within(folder).getByRole("button", { name: "Redirect Mapper" }));
    const name = "Bulk Redirect Mapper & Loop Validator";
    const frame = screen.getAllByTitle(name).find((el) => el.tagName === "IFRAME");
    expect(frame.getAttribute("src")).toBe("https://portfolio.faysalahmed.ca/marketing/redirect-mapper.html");
    expect(frame.getAttribute("sandbox")).toContain("allow-modals");
    expect(frame.getAttribute("sandbox")).toContain("allow-same-origin");
    expect(frame.getAttribute("allow")).toBe("clipboard-write");
    const dockIcon = within(container.querySelector(".gnome-dock")).getByRole("button", { name });
    expect(dockIcon.querySelector(".app-icon--mkt-seo")?.textContent).toBe("\u{1F500}");
  });

  it("keeps the plain tool frame for the two Astro tools in the Marketing folder", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(dockButton(container, "Marketing"));
    await user.click(
      within(screen.getByRole("dialog", { name: "Marketing" })).getByRole("button", { name: "Disclosure Check" }),
    );
    const frame = screen.getAllByTitle("Disclosure Language Checker").find((el) => el.tagName === "IFRAME");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-modals");
    expect(frame.hasAttribute("allow")).toBe(false);
  });

  it("closes the window that holds focus on Escape", () => {
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    const before = windowTitles().length;
    const aboutBody = screen.getByRole("dialog", { name: "about.txt" }).querySelector(".win-body");
    fireEvent.keyDown(aboutBody, { key: "Escape" });
    expect(windowTitles()).toHaveLength(before - 1);
    expect(windowTitles()).not.toContain("about.txt");
  });

  it("ignores Escape when no window holds focus", () => {
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    const before = windowTitles().length;
    fireEvent.keyDown(window, { key: "Escape" });
    expect(windowTitles()).toHaveLength(before);
  });

  it("tiles open windows from Activities without losing any", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Activities" }));
    expect(windowTitles()).toHaveLength(3);
  });
});

// Review D4: Escape must not close a window while the user types in it.
describe("DesktopShell Escape while typing (D4)", () => {
  it("keeps the terminal open when Escape is pressed inside its input", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Terminal" }));
    const input = screen.getByRole("textbox", { name: "Terminal command input" });
    input.focus();
    await user.keyboard("{Escape}");
    expect(windowTitles()).toContain("terminal");
  });

  it("keeps the contact window open when Escape is pressed inside a form field", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    const contact = screen.getByRole("dialog", { name: "contact.txt" });
    within(contact).getByPlaceholderText("Name").focus();
    await user.keyboard("{Escape}");
    expect(windowTitles()).toContain("contact.txt");
  });
});

describe("MobileShell", () => {
  it("shows all ten apps on the home grid and four in the dock", () => {
    const { container } = render(<MobileShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    const grid = within(container.querySelector(".app-grid"));
    for (const label of [
      "About",
      "Contact",
      "Now",
      "Files",
      "Text Editor",
      "Calculator",
      "Weather",
      "Image Viewer",
      "Marketing",
      "Terminal",
    ]) {
      expect(grid.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(container.querySelectorAll(".app-grid > *")).toHaveLength(10);
  });

  it("opens an app full screen and goes back", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByText(new RegExp(`${yearsActive()} years making Google behave`))).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText(new RegExp(`${yearsActive()} years making Google behave`))).toBeNull();
  });

  it("opens an Astro tool from the Marketing popup as a full-screen frame", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Marketing" }));
    await user.click(screen.getByRole("button", { name: "Disclosure Check" }));
    expect(screen.getByTitle("Disclosure Language Checker").getAttribute("src")).toBe(
      "https://portfolio.faysalahmed.ca/tools/disclosure-check/",
    );
  });

  it("opens the Marketing folder as a popup and a marketing tool as a full-screen frame", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Marketing" }));
    const popup = screen.getByRole("dialog", { name: "Marketing" });
    expect(within(popup).getAllByRole("button")).toHaveLength(23);
    await user.click(within(popup).getByRole("button", { name: "CAC Payback" }));
    expect(screen.queryByRole("dialog", { name: "Marketing" })).toBeNull();
    expect(screen.getByTitle("CAC, Margin & Payback Modeler").getAttribute("src")).toBe(
      "https://portfolio.faysalahmed.ca/marketing/cac-payback-modeler.html",
    );
  });

  it("runs the terminal full screen", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" theme="light" onThemeChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Terminal" }));
    await user.type(screen.getByRole("textbox", { name: "Terminal command input" }), "whoami{Enter}");
    expect(screen.getByRole("log").textContent).toContain("convincing impression");
  });
});
