## 2024-05-18 - Missing Admin Authorization on Debug Endpoint
**Vulnerability:** Debug endpoint `/api/debug-wp` exposed WordPress API interaction capabilities to any authenticated user, instead of restricting it to administrators.
**Learning:** `getSession()` only verifies that a token exists and is valid, not that the user has specific privileges. Session objects do not always contain up-to-date role information.
**Prevention:** Use `getCurrentUser()` from `@/lib/user-util` to retrieve the user's current database state and explicitly check `user.role === 'ADMIN'` for sensitive endpoints.

## 2024-05-27 - Static Parameterized Queries Prevent SQL Injection
**Vulnerability:** Dynamic SQL String Concatenation. Appending raw SQL string fragments based on conditionally present inputs (`query += whereClause`) creates structural variability that can sometimes bypass basic parameterization logic or introduce execution path flaws, leading to SQL injection.
**Learning:** Even when inputs are bound as parameters (`@search`), the surrounding SQL template itself should be fully static. Modifying the query's structure on the fly breaks the contract of a predictable prepared statement.
**Prevention:** Instead of conditionally building the SQL string in JavaScript, embed the conditional logic natively inside a static SQL template. For example, use a boolean bypass check within the `WHERE` clause: `WHERE (@search = '%%' OR column LIKE @search)`. Always wrap grouped `OR` conditions in parentheses to ensure safe evaluation against future `AND` conditions. Always ensure variable fallback mapping defaults (e.g., `undefined` evaluating to literal `"undefined"`) are strictly typed to safe defaults like `'%%'`.
