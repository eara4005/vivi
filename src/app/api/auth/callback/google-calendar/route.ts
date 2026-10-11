import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }

  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  const accessToken = tokens.access_token as string;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>認証完了</title></head>
<body>
<script>
  sessionStorage.setItem("google_access_token", ${JSON.stringify(accessToken)});
  location.href = "/calendar";
</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
