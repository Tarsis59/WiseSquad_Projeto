import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/api/generate", "/api/custom-agents", "/api/admin", "/configuracoes"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic realm=\"WiseSquad\"",
    },
  });
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const user = process.env.WISESQUAD_BASIC_AUTH_USER;
  const pass = process.env.WISESQUAD_BASIC_AUTH_PASS;
  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encodedCredentials = authHeader.replace("Basic ", "");
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
  const [providedUser, providedPass] = decodedCredentials.split(":");

  if (providedUser !== user || providedPass !== pass) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
