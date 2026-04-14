# DVNA Security Hardening Project (Option A)

## Project Title And Overview
This project secures the Damn Vulnerable NodeJS Application (DVNA) by implementing and validating five core security improvements across authentication, authorization, input handling, and session management.

- Option: `A` (existing vulnerable project hardening)
- Original source repository: `https://github.com/appsecco/dvna`
- Local project: `DVNA (Node.js + Express + MySQL)`
- Primary objective: mitigate real, exploitable vulnerabilities while preserving core app behavior.

## Features And Security Objectives
Core application features used in validation:
- User registration/login/logout
- Profile update
- User search
- Product listing/search/edit
- Password reset flow
- Ping utility input processing

Security objectives implemented:
- SR-1: Prevent SQL injection in user search.
- SR-2: Prevent command injection in ping endpoint.
- SR-3: Enforce authorization on profile edit/update path.
- SR-4: Replace predictable password reset token design.
- SR-5: Harden session and authentication cookie configuration.

## Project Structure
- `core/` - application business logic and security-sensitive handlers.
  - `core/appHandler.js` - user search, ping, profile edit, product handlers.
  - `core/authHandler.js` - auth guards, forgot/reset password logic.
- `routes/` - route-to-handler mappings.
- `models/` - Sequelize models (`User`, `Product`).
- `views/` - EJS templates.
- `config/` - server/database configuration.
- `server.js` - Express app bootstrap and session middleware configuration.
- `vars.env` - environment variables for local setup.

## Setup And Installation Instructions
1. Clone the repository and enter project directory.
2. Configure environment variables in `vars.env`.
3. Install dependencies:
   - `npm install`
4. Start the application:
   - `npm run start:9091`
5. Open in browser:
   - `http://127.0.0.1:9091` (or configured port)

Important environment values:
- `MYSQL_USER`, `MYSQL_DATABASE`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`
- `SESSION_SECRET` (required for stable secure session secret)

## Usage Guidelines
Typical flow to use the app:
1. Register a user (or log in with an existing account).
2. Access learning and application pages after login.
3. Use features such as user search, profile update, ping, and products.
4. Use forgot/reset password flow through `/forgotpw` and `/resetpw`.

## Security Improvements

### Security Requirement Status
| ID | Requirement | Target File(s) | Status |
|---|---|---|---|
| SR-1 | Prevent SQL Injection in user search | `core/appHandler.js` | Completed |
| SR-2 | Prevent Command Injection in ping | `core/appHandler.js` | Completed |
| SR-3 | Enforce access control on edit paths | `core/appHandler.js` | Completed |
| SR-4 | Replace weak reset token design | `core/authHandler.js` | Completed |
| SR-5 | Harden session/auth cookie config | `server.js` | Completed |

### SR-1: SQL Injection Mitigation
- Before: user search logic was injectable through crafted login input.
- Fix: search now uses ORM query with structured `where` clause.
- Outcome: input is treated as data, not executable SQL.

### SR-2: Command Injection Mitigation
- Before: ping command used shell command concatenation with user input.
- Fix: strict hostname/IP validation + `execFile` with argument list (no shell parsing).
- Outcome: metacharacter command chaining is blocked.

### SR-3: Authorization Enforcement (IDOR Fix)
- Before: profile update trusted hidden client field `id` and allowed cross-user modification.
- Fix: server enforces identity with `req.user.id`; tampered IDs are blocked (`403`).
- Outcome: users can only edit their own profile/password.

### SR-4: Secure Password Reset Token Design
- Before: reset token was predictable (`md5(login)`).
- Fix: random one-time token generation, token hashing, expiry window, timing-safe validation, post-use invalidation.
- Outcome: reset links cannot be forged from username knowledge.

### SR-5: Session And Cookie Hardening
- Before: hardcoded secret, `resave: true`, `saveUninitialized: true`, insecure cookie config.
- Fix: env-based secret, `resave: false`, `saveUninitialized: false`, `httpOnly`, `sameSite: 'lax'`, production-only `secure`, production proxy trust.
- Outcome: stronger session handling and reduced cookie/session exposure.

## Additional Vulnerability Added

### Plain Password Storage Vulnerability
- Vulnerability introduced: passwords were intentionally stored in plaintext in the database (no hashing).
- Why this is a vulnerability:
  - If the database is leaked, attacker gets user passwords immediately.
  - Users often reuse passwords, increasing cross-account compromise risk.
  - Plaintext passwords violate secure authentication storage best practices.

## Testing Process
Functional security testing was performed for all implemented controls.

### SR-1 Test
- Test case: submit `' OR '1'='1` in user search.
- Expected/observed after fix: `User not found`; no unintended match.

### SR-2 Test
- Test case: submit `127.0.0.1 && whoami` in ping form.
- Expected/observed after fix: invalid address error; no injected command output.
- Positive control: valid host (`127.0.0.1`/`localhost`) returns normal ping output.

### SR-3 Test
- Test case: tamper hidden profile `id` in browser DevTools and submit update.
- Expected/observed after fix: request blocked (`403`/unauthorized); target user unchanged.
- Positive control: self-profile update succeeds.

### SR-4 Test
- Test case 1: use valid generated reset link once.
- Expected/observed: password reset succeeds.
- Test case 2: reuse same link.
- Expected/observed: invalid reset token.
- Test case 3: try old forged token pattern (`md5(login)`).
- Expected/observed: invalid reset token.

### SR-5 Test
- Test case: inspect session cookie in browser after login.
- Expected/observed in local HTTP:
  - cookie name `dvna.sid`
  - `HttpOnly` present
  - `SameSite=Lax` present
  - `Secure` absent in local HTTP (expected)
- Production expectation (`NODE_ENV=production` + HTTPS): `Secure` flag present.

## Contributions And References
Contributions in this hardening project:
- Implemented SR-1 to SR-5 security remediations in app code.
- Documented vulnerability behavior, mitigation approach, and verification flow.
- Added environment-based session secret configuration.

References:
- Original DVNA repository: `https://github.com/appsecco/dvna`
- OWASP guidance categories used in implementation and testing focus:
  - Injection
  - Broken Access Control
  - Identification and Authentication Failures
  - Security Misconfiguration
