# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> SaaS Security & Tenant Isolation Protocols >> API Endpoint Security (BOLA/IDOR Prevention) >> Unauthenticated users should receive 401 Unauthorized when accessing private project APIs
- Location: tests\e2e\security.spec.ts:8:9

# Error details

```
Error: apiRequestContext.put: connect ECONNREFUSED ::1:3000
Call log:
  - → PUT http://localhost:3000/api/projects/cm0abc123
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 30

```