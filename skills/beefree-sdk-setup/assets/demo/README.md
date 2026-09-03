# Beefree SDK demo

A minimal local setup: a Node.js server with a token endpoint, and a page that loads the Beefree SDK builder and shows the JSON and HTML returned on save.
No npm dependencies.

## Run

1. Pick the authorization mode by copying one file to `public/auth.js`:
   - `cp auth/proxy.js public/auth.js` uses the token endpoint in `server.js` (recommended).
   - `cp auth/client-side.js public/auth.js` calls Beefree directly from the browser with credentials in the file. Local tests only.
2. `cp .env.example .env`. In proxy mode fill in `BEEFREE_CLIENT_ID` and `BEEFREE_CLIENT_SECRET`; in client-side mode leave the placeholders.
3. `npm start` (Node.js 20.6 or newer), then open <http://localhost:3000>.
   The server listens on `127.0.0.1` only. Set `HOST=0.0.0.0` in `.env` to reach it from another device.
4. Click **Save** in the top bar. The JSON, the HTML and a rendered preview appear below the builder.

## Files

| File                   | Role                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `server.js`            | Static server plus `POST /api/beefree/token`                         |
| `public/index.html`    | Page layout: toolbar, builder container, output panels               |
| `public/app.js`        | Loads the template (`?template=<name>`, default `m-bee`), creates the builder, wires `onSave` |
| `public/auth.js`       | Your copy of one of the two `auth/` variants                         |
| `auth/proxy.js`        | `getBeefreeToken()` calling the local token endpoint                 |
| `auth/client-side.js`  | `getBeefreeToken()` calling `auth.getbee.io` directly, insecure      |

## Docs

- Installation and fundamentals: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation>
- Authorization process: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/authorization-process-in-detail>
