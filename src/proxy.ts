import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/signup", "/pro-register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const returnPath = `${pathname}${request.nextUrl.search}`;
  const token = request.cookies.get("lhf-access-token")?.value;
  const rawRole = request.cookies.get("lhf-auth-role")?.value;

  const isAuthenticated = Boolean(token);
  const isPro = rawRole === "pro" || rawRole === "professional";
  const isHomeowner = rawRole === "homeowner" || rawRole === "home_owner";

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isHomeownerRoute = pathname === "/account" || pathname.startsWith("/account/");
  const isProRoute = pathname === "/pro" || pathname.startsWith("/pro/");

  // Protected Homeowner Routes
  if (isHomeownerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", returnPath);
      return NextResponse.redirect(loginUrl);
    }
    if (isPro) {
      return NextResponse.redirect(new URL("/pro", request.url));
    }
  }

  // Protected Pro Routes
  if (isProRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", returnPath);
      return NextResponse.redirect(loginUrl);
    }
    if (isHomeowner) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Auth pages (login, signup) - redirect already logged in users
  if (isAuthRoute && isAuthenticated && rawRole) {
    const target = isPro ? "/pro" : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/pro",
    "/pro/:path*",
    "/login",
    "/signup",
    "/pro-register",
  ],
};
