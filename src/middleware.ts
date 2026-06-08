import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect all routes except:
  // - /login (our custom sign-in page)
  // - /api/auth (NextAuth endpoints)
  // - /api/healthcheck (external health checks)
  // - /_next (Next.js internal routing)
  // - /favicon.ico and other static assets
  matcher: [
    "/((?!login|api/auth|api/healthcheck|_next/static|_next/image|favicon.ico).*)",
  ],
};
