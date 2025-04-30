import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware((_, req) => {
  if (req.nextUrl.pathname.match("__clerk")) {
    console.log("Path", req.nextUrl.pathname)

    const proxyHeaders = new Headers(req.headers);
    proxyHeaders.set(
      "Clerk-Proxy-Url",
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "",
    );
    proxyHeaders.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY || "");
    if ((req as any)?.ip) {
      proxyHeaders.set("X-Forwarded-For", (req as any).ip);
    } else {
      proxyHeaders.set(
        "X-Forwarded-For",
        req.headers.get("X-Forwarded-For") || "",
      );
    }

    const proxyUrl = new URL(req.url);
    proxyUrl.host = "frontend-api.clerk.dev";
    proxyUrl.port = "443";
    proxyUrl.protocol = "https";
    proxyUrl.pathname = proxyUrl.pathname.replace("/__clerk", "");

    console.log("Proxy URL", proxyUrl.toString())

    return NextResponse.rewrite(proxyUrl, {
      request: {
        headers: proxyHeaders,
      },
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes AND anything passed through the proxy
    "/(api|trpc|__clerk)(.*)",
  ],
};
