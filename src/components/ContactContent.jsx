import { useState } from "react";
import "../styles/form.css";

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

  return (
    <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", lineHeight: "var(--line-height-body)" }}>
      <p
        style={{
          fontFamily: "var(--font-terminal)",
          color: "var(--content-text-muted)",
          margin: "0 0 0.75rem",
        }}
      >
        faysal@desktop:~$ cat contact.txt
      </p>
      <p>
        The direct line: <a href="mailto:contactfaysal@gmail.com">contactfaysal@gmail.com</a>
        <br />
        The professional line:{" "}
        <a href="https://linkedin.com/in/faysalahmed" target="_blank" rel="noreferrer">
          linkedin.com/in/faysalahmed
        </a>
      </p>

      {status === "sent" ? (
        <p className="gtk-status-success">Sent. Thanks — I'll get back to you.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: "0.75rem" }}>
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
          <input
            className="gtk-field"
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={onChange}
            required
          />
          <input
            className="gtk-field"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
          />
          <textarea
            className="gtk-field"
            name="message"
            placeholder="Message"
            value={form.message}
            onChange={onChange}
            required
            rows={3}
          />
          <button className="gtk-btn-primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send a message"}
          </button>
          {status === "error" && (
            <p className="gtk-status-error">Send failed — try again, or email directly.</p>
          )}
        </form>
      )}
    </div>
  );
}
