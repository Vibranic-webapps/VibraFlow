import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Pages that must stay reachable when logged out.
const PUBLIC_PAGES = ["/login", "/signup"];

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

    // Auth endpoints must always be reachable (that's how you log in).
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // Other API routes enforce auth themselves via readSession() (returns 401).
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    const isPublicPage = PUBLIC_PAGES.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
    );

    // Logged out + private page -> send to login.
    if (!hasSession && !isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Already has a session but sitting on login/signup -> send home.
    if (hasSession && isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
