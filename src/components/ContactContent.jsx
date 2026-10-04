import { useState } from "react";
import "../styles/content.css";
import "../styles/form.css";
import { PROFILE } from "../data/profile.js";
import { config } from "../lib/config.js";

/** Abort the request, and show the error state, if the API has not answered by then. */
const SUBMIT_TIMEOUT_MS = 10_000;

export default function ContactContent() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
    try {
      const res = await fetch(config.contactEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      // Network failure or timeout: the error state is the user-facing report.
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  };

  return (
    <div className="content">
      <p className="content__prompt">faysal@desktop:~$ cat contact.txt</p>
      <p>
        The direct line: <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
        <br />
        The professional line:{" "}
        <a href={PROFILE.linkedin.url} target="_blank" rel="noreferrer">
          {PROFILE.linkedin.label}
        </a>
      </p>

      {status === "sent" ? (
        <p className="gtk-status-success">Sent. Thanks — I&apos;ll get back to you.</p>
      ) : (
        <form className="contact-form" onSubmit={onSubmit}>
          {/* Honeypot — hidden from real visitors via CSS, bots often fill it anyway */}
          <input
            className="contact-form__honeypot"
            type="text"
            name="website"
            value={form.website}
            onChange={onChange}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <label className="gtk-label" htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            className="gtk-field"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Name"
            value={form.name}
            onChange={onChange}
            required
          />
          <label className="gtk-label" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            className="gtk-field"
            type="email"
            autoComplete="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
          />
          <label className="gtk-label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
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
          {status === "error" && <p className="gtk-status-error">Send failed — try again, or email directly.</p>}
        </form>
      )}
    </div>
  );
}
