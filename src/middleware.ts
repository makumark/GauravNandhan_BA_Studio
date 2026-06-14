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
  // - /api/auth (NextAuth endpoints)
  // - /api/healthcheck (external health checks)
  // - /share/[id] and /api/share/[id] (public sharing)
  // - /_next (Next.js internal routing)
  // - /favicon.ico and other static assets
  matcher: [
    "/((?!login|api/auth|api/healthcheck|share|api/share|_next/static|_next/image|favicon.ico|$).*)",
  ],
};
