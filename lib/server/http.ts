import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireOrigin(req: Request) {
  const expected = process.env.APP_URL;
  const origin = req.headers.get("origin");
  if (!expected || origin !== new URL(expected).origin)
    throw new HttpError(403, "Please reload this page before trying again.");
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 65536)
    throw new HttpError(413, "Request too large");
  const text = await req.text();
  if (text.length > 65536) throw new HttpError(413, "Request too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid request");
  }
}
export async function endpoint(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof HttpError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    console.error("Request failed", e instanceof Error ? e.name : "Unknown");
    return NextResponse.json(
      {
        error:
          "This service is temporarily unavailable. Your changes have not been confirmed. Please try again.",
      },
      { status: 503 },
    );
  }
}
