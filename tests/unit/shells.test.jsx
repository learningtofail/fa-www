import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopShell from "../../src/components/DesktopShell.jsx";
import MobileShell from "../../src/components/MobileShell.jsx";

/** Dock buttons share accessible names with desktop icons, so scope queries to the dock. */
const dockButton = (container, name) => within(container.querySelector(".gnome-dock")).getByRole("button", { name });

const windowTitles = () => screen.queryAllByRole("dialog").map((w) => w.getAttribute("aria-label"));

describe("DesktopShell", () => {
  it("opens with about, contact and status windows", () => {
    render(<DesktopShell lastDeploy="2026-10-04" />);
    expect(windowTitles().sort()).toEqual(["about.txt", "contact.txt", "status.txt"]);
    expect(screen.getByText("last deploy: 2026-10-04")).toBeTruthy();
  });

  it("shows four desktop icons and five dock buttons", () => {
    const { container } = render(<DesktopShell lastDeploy="x" />);
    expect(container.querySelectorAll(".desktop-icon")).toHaveLength(4);
    expect(container.querySelectorAll(".gnome-dock .dock-icon-btn")).toHaveLength(5);
  });

  it("closes and minimizes windows with the titlebar buttons", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    expect(windowTitles()).not.toContain("about.txt");
    await user.click(screen.getByRole("button", { name: "Minimize contact.txt" }));
    expect(windowTitles()).not.toContain("contact.txt");
  });

  it("restores a closed window from the dock", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    await user.click(dockButton(container, "About"));
    expect(windowTitles()).toContain("about.txt");
  });

  it("opens a desktop icon with Enter, which stands in for double-click", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Close about.txt" }));
    const icon = screen.getAllByRole("button", { name: "About" }).find((b) => b.classList.contains("desktop-icon"));
    icon.focus();
    await user.keyboard("{Enter}");
    expect(windowTitles()).toContain("about.txt");
  });

  it("opens a tool in an iframe window from the Tools folder", async () => {
    const user = userEvent.setup();
    const { container } = render(<DesktopShell lastDeploy="x" />);
    await user.click(dockButton(container, "Tools"));
    const folder = screen.getByRole("dialog", { name: "Tools" });
    await user.click(within(folder).getByRole("button", { name: "UTM Governance Auditor" }));
    const frame = screen.getAllByTitle("UTM Governance Auditor").find((el) => el.tagName === "IFRAME");
    expect(frame.getAttribute("src")).toBe("https://portfolio.faysalahmed.ca/tools/utm-auditor/");
  });

  it("closes the topmost window on Escape", () => {
    render(<DesktopShell lastDeploy="x" />);
    const before = windowTitles().length;
    fireEvent.keyDown(window, { key: "Escape" });
    expect(windowTitles()).toHaveLength(before - 1);
  });

  it("tiles open windows from Activities without losing any", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Activities" }));
    expect(windowTitles()).toHaveLength(3);
  });
});

// Known defect (review D4). Passes while the bug exists, fails once Escape ignores text inputs.
describe("DesktopShell known defects (D4)", () => {
  it.fails("keeps the terminal open when Escape is pressed inside its input", async () => {
    const user = userEvent.setup();
    render(<DesktopShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Terminal" }));
    const input = screen.getByRole("textbox", { name: "Terminal command input" });
    input.focus();
    await user.keyboard("{Escape}");
    expect(windowTitles()).toContain("terminal");
  });
});

describe("MobileShell", () => {
  it("shows all five apps on the home grid", () => {
    render(<MobileShell lastDeploy="x" />);
    for (const label of ["About", "Contact", "Now", "Tools", "Terminal"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("opens an app full screen and goes back", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByText(/22 years making Google behave/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByText(/22 years making Google behave/)).toBeNull();
  });

  it("opens the Tools folder as a popup and a tool as a full-screen frame", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Tools" }));
    await user.click(screen.getByRole("button", { name: "GTM Container Auditor" }));
    expect(screen.getByTitle("GTM Container Auditor").getAttribute("src")).toBe(
      "https://portfolio.faysalahmed.ca/tools/gtm-auditor/",
    );
  });

  it("runs the terminal full screen", async () => {
    const user = userEvent.setup();
    render(<MobileShell lastDeploy="x" />);
    await user.click(screen.getByRole("button", { name: "Terminal" }));
    await user.type(screen.getByRole("textbox", { name: "Terminal command input" }), "whoami{Enter}");
    expect(screen.getByRole("log").textContent).toContain("convincing impression");
  });
});
