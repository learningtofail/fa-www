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

// Review D6: labels, timeout, configurable endpoint, no inline style, no console output.
describe("ContactContent (D6)", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("gives every visible field a real <label>", () => {
    const { container } = render(<ContactContent />);
    for (const name of ["Name", "Email", "Message"]) {
      const field = screen.getByLabelText(name);
      const label = container.querySelector(`label[for="${field.id}"]`);
      expect(label?.textContent).toBe(name);
    }
  });

  it("styles the honeypot with a class, not an inline style", () => {
    const { container } = render(<ContactContent />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot.getAttribute("style")).toBeNull();
    expect(honeypot.classList.contains("contact-form__honeypot")).toBe(true);
  });

  it("aborts the request and shows the error after 10 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const seen = /** @type {{ signal?: AbortSignal }} */ ({});
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init) => {
        seen.signal = init.signal;
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        });
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ContactContent />);
    await fillAndSubmit(user);
    expect(seen.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(9_000);
    expect(seen.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(seen.signal?.aborted).toBe(true);
    await waitFor(() => expect(screen.getByText(/Send failed/)).toBeTruthy());
  });

  it("does not log to the console on failure", async () => {
    const error = vi.spyOn(console, "error");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));
    const user = userEvent.setup();
    render(<ContactContent />);
    await fillAndSubmit(user);
    await waitFor(() => expect(screen.getByText(/Send failed/)).toBeTruthy());
    expect(error).not.toHaveBeenCalled();
  });
});
