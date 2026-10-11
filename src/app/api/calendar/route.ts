import { NextRequest, NextResponse } from "next/server";
import { listEvents } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get("x-google-access-token");
  if (!accessToken) {
    return NextResponse.json({ error: "Google access token required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const timeMin = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const timeMax = toParam
    ? new Date(toParam)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const events = await listEvents(accessToken, timeMin, timeMax);
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
