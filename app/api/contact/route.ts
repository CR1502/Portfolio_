import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Please send the form from this website." },
      { status: 403 },
    );
  const raw = await request.text();
  if (raw.length > 8192)
    return NextResponse.json(
      { error: "Please shorten your message." },
      { status: 413 },
    );
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "The request could not be read." },
      { status: 400 },
    );
  }
  if (!data || typeof data !== "object")
    return NextResponse.json(
      { error: "Please complete the form." },
      { status: 400 },
    );
  const value = (key: string, max: number) =>
    typeof data[key] === "string"
      ? (data[key] as string).trim().slice(0, max)
      : "";
  const name = value("name", 100),
    email = value("email", 254),
    phone = value("phone", 50),
    message = value("message", 3000),
    mode = value("mode", 10);
  if (
    value("website", 200) ||
    !name ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !message ||
    !["email", "call"].includes(mode) ||
    (mode === "call" &&
      (phone.replace(/\D/g, "").length < 7 || data.consent !== true))
  )
    return NextResponse.json(
      { error: "Check your name, reply email, message, and callback details." },
      { status: 400 },
    );
  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint)
    return NextResponse.json(
      {
        error:
          "Message delivery is not connected yet. Please contact me on LinkedIn.",
      },
      { status: 503 },
    );
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("Invalid configuration");
    const result = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        message,
        phone: mode === "call" ? phone : undefined,
        subject:
          mode === "call" ? "Portfolio callback request" : "Portfolio message",
        _replyto: email,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) throw new Error("Delivery unavailable");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "The message could not be delivered. Your text is still here; please try again later.",
      },
      { status: 502 },
    );
  }
}
