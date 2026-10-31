"use client";
import { FormEvent, useState } from "react";
export default function ContactForm({ enabled }: { enabled: boolean }) {
  const [mode, setMode] = useState<"email" | "call">("email"),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    setBusy(true);
    setStatus("Sending your request…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          mode,
          consent: data.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to send right now.");
      setStatus(
        mode === "call"
          ? "Your callback request was sent."
          : "Your message was sent.",
      );
      form.reset();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to send right now. Your text has been kept.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="contact-form" onSubmit={send}>
      <fieldset className="contact-mode">
        <legend>Get in touch</legend>
        <div>
          {(["email", "call"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setStatus("");
              }}
            >
              {value === "email" ? "Send a message" : "Request a call"}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="contact-fields">
        <label>
          Your name
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          Reply email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        {mode === "call" && (
          <label className="form-wide">
            Your phone number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              minLength={7}
              maxLength={50}
              required
            />
          </label>
        )}
        <label className="form-wide">
          {mode === "call"
            ? "What would you like to discuss? Include a good time to call."
            : "Your message"}
          <textarea name="message" rows={4} required maxLength={3000} />
        </label>
      </div>
      <div className="form-honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {mode === "call" && (
        <label className="callback-consent">
          <input name="consent" type="checkbox" required />
          You can call me about this request.
        </label>
      )}
      {!enabled && (
        <p className="form-notice">
          The form is being connected. In the meantime, you can reach me on
          LinkedIn.
        </p>
      )}
      <button
        className="button primary"
        type="submit"
        disabled={busy || !enabled}
      >
        {busy
          ? "Sending…"
          : mode === "call"
            ? "Request a callback ↗"
            : "Send message ↗"}
      </button>
      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
