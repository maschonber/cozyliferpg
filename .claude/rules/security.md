# Security Requirements

## Authentication

**All endpoints require authentication unless explicitly public:**

- Use `authenticateToken` middleware on protected routes
- Public endpoints: login, health check only
- Never expose user data without authentication

**Token handling:**

- JWT tokens with reasonable expiry
- Tokens stored securely (httpOnly cookies preferred)
- Validate tokens on every request

## Authorization

**Users access only their own data:**

- Extract user ID from authenticated token
- Filter all queries by user ID
- Never trust client-provided user IDs

**Validate ownership:**

```typescript
// Always verify the resource belongs to the user
const player = await getPlayer(userId);
if (!player) return unauthorized();
```

## Input Validation

**Validate all input at the boundary:**

- Request body parameters
- URL parameters
- Query strings

**Never trust client input:**

- Sanitize before use
- Validate types and ranges
- Reject unexpected fields

## Data Protection

**Sensitive data handling:**

- Hash passwords with bcrypt (10+ rounds)
- Never log passwords or tokens
- Never return passwords in responses

**Database security:**

- Use parameterized queries (no string concatenation)
- Limit query results
- Validate IDs before queries

## Error Responses

**Errors must not leak information:**

- Generic messages to clients
- Detailed logs server-side only
- No stack traces in production responses

## OWASP Top 10 Awareness

**Actively prevent:**

- SQL Injection (parameterized queries)
- XSS (sanitize output)
- CSRF (token validation)
- Broken authentication (proper session handling)
- Sensitive data exposure (encryption, access control)

When in doubt, apply the principle of least privilege.
