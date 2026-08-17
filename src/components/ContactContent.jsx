import { useState } from "react";

// Matches the /contact endpoint spec'd in Phase 3 (claude/phase-3-shared-foundations.md).
const CONTACT_ENDPOINT = "https://contact-api.jrflab.dev/contact";

export default function ContactContent() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("sent");
    } catch (err) {
      console.error("contact form send failed:", err);
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.4rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "0.85rem",
    fontFamily: "inherit",
    marginBottom: "0.6rem",
  };

  return (
    <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "0.85rem", lineHeight: 1.6 }}>
      <p style={{ color: "#6b6b6b", margin: "0 0 0.75rem" }}>faysal@desktop:~$ cat contact.txt</p>
      <p style={{ fontFamily: "system-ui, sans-serif" }}>
        The direct line: <a href="mailto:contactfaysal@gmail.com">contactfaysal@gmail.com</a>
        <br />
        The professional line:{" "}
        <a href="https://linkedin.com/in/faysalahmed" target="_blank" rel="noreferrer">
          linkedin.com/in/faysalahmed
        </a>
      </p>

      {status === "sent" ? (
        <p style={{ fontFamily: "system-ui, sans-serif", color: "#2a8a4a" }}>
          Sent. Thanks — I'll get back to you.
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ fontFamily: "system-ui, sans-serif", marginTop: "0.75rem" }}>
          {/* Honeypot — hidden from real visitors via CSS, bots often fill it anyway */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={onChange}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
            aria-hidden="true"
          />
          <input type="text" name="name" placeholder="Name" value={form.name} onChange={onChange} required style={inputStyle} />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required style={inputStyle} />
          <textarea
            name="message"
            placeholder="Message"
            value={form.message}
            onChange={onChange}
            required
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              padding: "0.4rem 1rem",
              background: "#2b2b2b",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: status === "sending" ? "default" : "pointer",
              opacity: status === "sending" ? 0.6 : 1,
            }}
          >
            {status === "sending" ? "Sending..." : "Send a message"}
          </button>
          {status === "error" && (
            <p style={{ color: "#b00020", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Send failed — try again, or email directly.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
