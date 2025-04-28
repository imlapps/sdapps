import { routing } from "@/lib/routing";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const handleI18nRouting = createMiddleware(routing);

const localesRegExp = new RegExp(`^/(${routing.locales.join("|")})(/.*)?$`);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || localesRegExp.test(request.nextUrl.pathname)) {
    return handleI18nRouting(request);
  }

  return;
}
