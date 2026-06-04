## 2024-05-18 - Prevent Credential Leakage in Logs
**Vulnerability:** Usernames were being logged in plaintext during failed login attempts.
**Learning:** If a user accidentally pastes their password into the username field, logging the raw username string writes the password in plaintext to the database logs.
**Prevention:** Avoid interpolating raw, potentially sensitive user inputs (like usernames, which can contain typos that expose credentials) directly into security or system logs. Use generic failure messages instead.
