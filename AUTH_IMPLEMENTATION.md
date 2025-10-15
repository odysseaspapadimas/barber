# Authentication Implementation with tRPC & Better Auth

## Overview
This document describes the authentication implementation using tRPC mutations with Better Auth and TanStack Query.

## Architecture

### Server-Side (src/server/auth.ts)
- **login mutation**: Uses `auth.api.signInEmail()` with request headers
- **logout mutation**: Uses `auth.api.signOut()` with request headers  
- **getSession query**: Uses `auth.api.getSession()` to retrieve current session

### Client-Side
- **Login** (`src/routes/admin/login.tsx`): Uses `trpc.auth.login.useMutation()`
- **Logout** (`src/routes/admin/index.tsx`): Uses `trpc.auth.logout.useMutation()`

## How It Works

### Cookie Handling
Better Auth's `reactStartCookies` plugin only works with `authClient` direct calls. For tRPC mutations, we pass Set-Cookie headers through tRPC's response:

1. **Better Auth API returns Response with Set-Cookie headers**
   - `auth.api.signInEmail({ ..., asResponse: true })` returns full Response
   - `auth.api.signOut({ ..., asResponse: true })` returns full Response

2. **Pass Headers Through tRPC Context**
  - Extract `Set-Cookie` header from Better Auth response
  - Add to `ctx.responseHeaders` (provided in tRPC context)
  - tRPC's `responseMeta` function merges these headers into the final response

IMPORTANT: For the Set-Cookie headers to actually be merged into the HTTP response and reach the browser, the tRPC client must use a non-streaming link (for example `httpBatchLink`). Using a streaming transport such as `httpBatchStreamLink` can prevent header merges from being applied, which will stop cookies from being set in the browser. See "Troubleshooting" below for details.

3. **How It Works**
   - tRPC handler extracts Set-Cookie from Better Auth response
   - Adds to `ctx.responseHeaders` Headers object
   - `fetchRequestHandler` with `responseMeta` merges headers into HTTP response
   - Browser receives Set-Cookie headers and stores cookies automatically

### Request Flow

#### Login:
```
Client (login.tsx)
  → trpc.auth.login.mutate({ email, password })
    → Server (auth.ts tRPC handler)
      → auth.api.signInEmail({ body, headers, asResponse: true })
        → Returns Response with Set-Cookie headers
      → Extract Set-Cookie header
      → Add to ctx.responseHeaders
    → Server (api.trpc.$.tsx)
      → fetchRequestHandler with responseMeta
      → Merges ctx.responseHeaders into HTTP response
      → Response sent to client with Set-Cookie headers
    → Browser stores cookies
    → Client redirects to /admin
```

Note: This end-to-end behavior depends on the tRPC client transport. If your client is configured with a streaming link the Set-Cookie headers added in `responseMeta` may not be applied to the final HTTP response.

#### Protected Routes:
```
Client makes request to protected tRPC procedure
  → Browser automatically includes HttpOnly cookie
    → Server (init.ts protectedProcedure middleware)
      → auth.api.getSession({ headers: ctx.request.headers })
        → Reads session from cookie
      → If valid: proceed, if not: throw UNAUTHORIZED
```

#### Logout:
```
Client (admin/index.tsx)
  → trpc.auth.logout.mutate()
    → Server (auth.ts)
      → auth.api.signOut({ headers })
        → reactStartCookies plugin clears cookies automatically
      → Response sent to client
    → Client redirects to /admin/login
```

## Key Files

### Server
- `src/lib/auth.ts` - Better Auth configuration with reactStartCookies plugin
- `src/server/auth.ts` - tRPC auth router (login, logout, getSession)
- `src/integrations/trpc/init.ts` - protectedProcedure middleware

Optional/Helpful files:
- `AUTH_IMPLEMENTATION.md` - this document (keeps a record of the final approach and troubleshooting steps)

### Client
- `src/routes/admin/login.tsx` - Login page using tRPC mutation
- `src/routes/admin/index.tsx` - Admin dashboard with logout
- `src/routes/admin/route.tsx` - Route protection with beforeLoad

## Why This Approach?

### ✅ Advantages
1. **Type-safe**: Full TypeScript type safety from client to server
2. **Automatic cookie handling**: No manual cookie manipulation
3. **Consistent API**: All operations go through tRPC
4. **Easy testing**: Can test auth flows with tRPC server-side callers
5. **Better DX**: TanStack Query provides loading states, error handling, caching

### 🔄 Compared to Direct authClient Usage
- **authClient** (Better Auth client): Direct cookie handling, works but bypasses tRPC
- **tRPC mutations** (our approach): Type-safe, consistent with rest of API, automatic cookie handling via server-side `auth.api` calls

Important runtime detail: the header propagation trick relies on the tRPC HTTP entrypoint being able to merge headers returned by `responseMeta`. Some transports (particularly streaming transports) won't allow the same merging semantics, so prefer non-streaming links when your server needs to set or modify HTTP response headers.

## Testing

### Test Login
1. Navigate to `http://localhost:3001/admin/login`
2. Enter password
3. Submit form
4. Should redirect to `/admin` with cookies set

### Test Protected Route
1. After login, navigate to `/admin`
2. Should see admin dashboard
3. Session cookie is automatically included in all requests

### Test Logout
1. Click "Logout" button in admin dashboard
2. Should redirect to `/admin/login`
3. Cookies should be cleared
4. Accessing `/admin` should redirect back to login

Smoke test recommendation:
- Add a small server-side test that calls the `trpc.auth.login` mutation (or the equivalent server helper) and asserts that the HTTP response includes a `Set-Cookie` header. This catches regressions where a transport or handler change prevents header merging.

## Security Features
- HttpOnly cookies (not accessible via JavaScript)
- 7-day session expiration
- Server-side session validation on every protected route
- Automatic cookie clearing on logout

## Implementation Details

### Why Manual Cookie Handling?

The `reactStartCookies` plugin from Better Auth only works in specific contexts:
- Direct `authClient.*` calls from client components
- Server component contexts where TanStack Start's server runtime is initialized
- NOT in tRPC procedures (they run in a different execution context)

The plugin code checks for `ctx._flag === "router"` which is set by TanStack Start's router context, not available in tRPC handlers.

### Cookie Parsing Implementation

The `parseSetCookieHeader()` function in `src/server/auth.ts`:
1. Splits multiple cookies from single Set-Cookie header
2. Extracts cookie name and value
3. Parses cookie attributes (Max-Age, HttpOnly, Secure, SameSite, Path, Domain)
4. Returns a Map<cookieName, cookieAttributes>

Note: The current implementation uses a header-propagation approach (passing the exact Set-Cookie header through `ctx.responseHeaders`) rather than calling framework helpers like `setCookie()` from inside tRPC procedures. That's because those helpers only work within certain TanStack Start server function contexts and are not available (or reliable) inside tRPC handlers.

### TanStack Start's setCookie()

Imported from `@tanstack/react-start/server`, it:
- Sets cookies in the response that will be sent to the client
- Accepts cookie options matching standard browser cookie attributes
- Works within TanStack Start server function execution context

## Next Steps
1. ✅ Disable public signup (`disableSignUp: true` in auth.ts)
2. Implement staff management with protected tRPC procedures
3. Add bookings management
4. Add service edit/delete functionality

Immediate follow-ups (recommended):
- Remove any leftover debug / console.log output in `src/server/auth.ts` used during development.
- Add the smoke test described above to your test suite or CI pipeline.
- Confirm `src/integrations/tanstack-query/root-provider.tsx` or equivalent client initialization uses `httpBatchLink` (or another non-streaming link) instead of a streaming link.

## Troubleshooting

### "Cannot find module '@tanstack/react-start/server'"
- Ensure `@tanstack/react-start` is installed
- Check the package exports in node_modules/@tanstack/react-start/package.json
- The `/server` export should be available

### Cookies not being set
- Check browser Network tab for Set-Cookie headers in response
- Verify `console.log` output in terminal shows cookies being parsed
- Ensure `returnHeaders: true` is passed to `auth.api.signInEmail()`
- Check cookie attributes match your domain/security requirements

- If Set-Cookie headers are present in your handler logs but not in the browser, verify the tRPC client transport: streaming links can prevent header merging. Switch to a non-streaming link such as `httpBatchLink` to allow `responseMeta` headers to be applied.
