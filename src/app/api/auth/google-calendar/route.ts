import { NextResponse } from "next/server";
import { getOAuth2Client, getAuthUrl } from "@/lib/google-calendar";

export function GET() {
  const oauth2Client = getOAuth2Client();
  const url = getAuthUrl(oauth2Client);
  return NextResponse.redirect(url);
}
