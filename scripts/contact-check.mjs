import vm from "node:vm";
import ts from "typescript";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = ts.transpileModule(
  await readFile("app/api/contact/route.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
let calls = 0,
  fail = false;
const env = {};
const context = {
  exports: {},
  require: () => ({
    NextResponse: {
      json: (body, options = {}) => ({ body, status: options.status || 200 }),
    },
  }),
  process: { env },
  URL,
  AbortSignal,
  fetch: async () => {
    calls++;
    if (fail) throw Error("offline");
    return { ok: true };
  },
};
vm.runInNewContext(source, context);
const valid = {
  name: "Test visitor",
  email: "visitor@example.test",
  message: "A project question.",
  mode: "email",
};
const request = (data, origin = "https://portfolio.test") => ({
  headers: new Map([["origin", origin]]),
  nextUrl: new URL("https://portfolio.test/api/contact"),
  text: async () => JSON.stringify(data),
});
const cases = [];
async function check(name, data, status, origin) {
  const result = await context.exports.POST(request(data, origin));
  assert.equal(result.status, status, name);
  cases.push(name);
  console.log("✓", name);
}
await check(
  "Cross-origin requests rejected",
  valid,
  403,
  "https://elsewhere.test",
);
await check(
  "Invalid reply address rejected",
  { ...valid, email: "invalid" },
  400,
);
await check(
  "Oversized request rejected",
  { ...valid, message: "x".repeat(9000) },
  413,
);
await check("Honeypot rejected", { ...valid, website: "spam" }, 400);
await check(
  "Callback requires number and consent",
  { ...valid, mode: "call" },
  400,
);
await check("Unconfigured delivery reports unavailable", valid, 503);
assert.equal(calls, 0);
env.CONTACT_FORM_ENDPOINT = "https://delivery.example.test";
await check("Configured service acceptance reports success (mock)", valid, 200);
await check(
  "Callback accepted with consent (mock)",
  { ...valid, mode: "call", phone: "+1 555 555 0100", consent: true },
  200,
);
fail = true;
await check("Service failure reports delivery error", valid, 502);
assert.equal(calls, 3);
console.log(`${cases.length} contact checks pass; no external messages sent`);
