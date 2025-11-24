import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {

  // Get IP address
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Get all headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Log request details
  console.log("=== Incoming Request ===");
  console.log(`IP Address: ${ip}`);
  console.log(`Method: ${request.method}`);
  console.log(`URL: ${request.url}`);
  console.log(`Headers:`, JSON.stringify(headers, null, 2));
  console.log("========================\n");

  // Continue with the request
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
