# Rushr - Auth Rolled Back

This snapshot removes NextAuth/sign-in wiring and fixes PostCSS/Tailwind/TypeScript config so the app compiles cleanly in StackBlitz.

**Key changes**
- Converted `postcss.config` to CJS (`postcss.config.cjs`).
- Tailwind config in CJS (`tailwind.config.cjs`); content globs for `app` and `components`.
- Added `next-env.d.ts`.
- Safe `tsconfig.json` that excludes `app/api/auth/**` and does not include `.next/types`.
- Replaced imports from `next-auth` with lightweight shims in `lib/auth-shim.ts` and `lib/auth-server-shim.ts`.
- Disabled `middleware.ts` (renamed to `middleware.off.ts` if it existed).
- Minimal `app/layout.tsx` and `app/page.tsx` to verify the app loads.
- Preserved all non-auth files.

If your UI still references `/api/*` endpoints that you have not re-added, create stubs in `app/api/.../route.ts` as needed.

--------------------------
AS OF 8/20/2025
