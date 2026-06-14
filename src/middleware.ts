import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect all routes except:
  // - / (landing page)
  // - /login (our custom sign-in page)
  // - /api (all API endpoints - they protect themselves internally)
  // - /share/[id] (public sharing)
  // - /_next (Next.js internal routing)
  // - /favicon.ico and other static assets
  matcher: [
    "/((?!login|api|share|_next/static|_next/image|favicon.ico|$).*)",
  ],
};
