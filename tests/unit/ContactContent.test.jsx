import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactContent from "../../src/components/ContactContent.jsx";

const ENDPOINT = "https://contact-api.jrflab.dev/contact";

async function fillAndSubmit(user) {
  await user.type(screen.getByPlaceholderText("Name"), "Ada");
  await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
  await user.type(screen.getByPlaceholderText("Message"), "Hello there");
  await user.click(screen.getByRole("button", { name: "Send a message" }));
}

describe("ContactContent", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the form as JSON, including the empty honeypot field", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ContactContent />);
    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText(/Sent\. Thanks/)).toBeTruthy());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello there",
      website: "",
    });
  });

  it("shows a visible error when the endpoint answers with a failure status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ContactContent />);
    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText(/Send failed/)).toBeTruthy());
    expect(/** @type {HTMLButtonElement} */ (screen.getByRole("button", { name: "Send a message" })).disabled).toBe(
      false,
    );
  });

  it("shows a visible error when the network request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ContactContent />);
    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText(/Send failed/)).toBeTruthy());
  });

  it("hides the honeypot from assistive technology", () => {
    const { container } = render(<ContactContent />);
    const honeypot = /** @type {HTMLInputElement} */ (container.querySelector('input[name="website"]'));
    expect(honeypot.getAttribute("aria-hidden")).toBe("true");
    expect(honeypot.tabIndex).toBe(-1);
  });
});

// Known defect (review D6). Passes while the bug exists, fails once labels are added.
describe("ContactContent known defects (D6)", () => {
  it.fails("gives every visible field an accessible label", () => {
    render(<ContactContent />);
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Message")).toBeTruthy();
  });
});
