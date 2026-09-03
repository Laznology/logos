# Site settings design

## Purpose

Give administrators two global controls without adding per-user preference complexity:

- whether the public post graph is visible by default;
- whether new account registration is available.

The settings apply to anonymous readers and signed-in users on public post pages. They do not change post permissions or the graph data itself.

## Decisions

### Graph default

`graphEnabledByDefault` defaults to `true` to preserve current behavior. When false, the graph is not rendered automatically in the post detail sidebar, but the existing Graph action remains available and opens the graph on demand. The graph endpoint remains public and unchanged.

### Registration

`registrationEnabled` defaults to `true`. When false:

- the registration form is replaced by an unavailable state;
- the login page hides its Sign Up link;
- the sign-up API rejects direct requests with HTTP 403.

All enforcement is server-side; hiding links is only presentation.

### Persistence

Use a singleton `site_settings` SQLite table instead of environment variables, cookies, post metadata, or a generic key/value abstraction. The setting scope is global, and admins must be able to change it without deployment.

Schema:

- `id`: integer primary key, fixed value `1`;
- `graph_enabled_by_default`: integer boolean, not null, default `1`;
- `registration_enabled`: integer boolean, not null, default `1`;
- `updated_at`: timestamp, not null, default current epoch.

## Server contract

Add a public read endpoint returning only the two booleans:

- `GET /api/public/settings`

Add an admin-only read/write endpoint:

- `GET /api/admin/settings`
- `PUT /api/admin/settings`

The write handler uses `defineProtectedHandler(handler, ["admin"])`, validates both booleans, updates the singleton row, and returns the normalized values. Missing singleton data is initialized with defaults rather than producing a null setting.

The public post page fetches public settings and uses the graph flag only for initial rendering. It keeps the Graph button and modal behavior intact. The register page and login page fetch the registration flag. The sign-up handler reads the setting before creating a user and rejects disabled registration.

## Admin UI

Place a `Workspace settings` section inside the existing Account settings → Preferences tab. Render it only for an admin session:

- `Show graph by default` — switch;
- `Allow public registration` — switch.

Changes save through the admin settings endpoint with one explicit Save action. Show a pending state while saving and a toast for success or failure. Non-admin users keep the existing theme and sidebar preferences and never call the admin settings endpoint.

## States and accessibility

- Settings load: switches are disabled until values arrive.
- Save pending: Save is disabled and shows loading feedback.
- Save error: retain the edited values and show an inline error/toast.
- Registration disabled: explain that account creation is currently unavailable and provide a link back to Sign in.
- Both switches have visible labels and keyboard focus states.

## Testing

Add focused tests for these observable contracts:

1. default settings return graph enabled and registration enabled;
2. admin updates persist both settings;
3. non-admin update requests return 403;
4. public post detail hides the graph sidebar when the default is disabled but retains the Graph action;
5. disabled registration blocks the API and removes the public form/link;
6. enabled registration preserves the existing sign-up flow.

No new dependency or per-user settings model is required.
