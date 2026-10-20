# Beefree SDK demo

A minimal local setup: a Node.js server with a token endpoint, and a page that loads the Beefree SDK builder and shows the JSON and HTML returned on save.
The page reads the application type from the token: Email Builder, Page Builder and Popup Builder start with a sample of their type, a File Manager application opens the File Manager instead.
No npm dependencies.

## Run

1. Pick the authorization mode by copying one file to `public/auth.js`:
   - `cp auth/proxy.js public/auth.js` uses the token endpoint in `server.js` (recommended).
   - `cp auth/client-side.js public/auth.js` calls Beefree directly from the browser with credentials in the file. Local tests only.
2. `cp .env.example .env`. In proxy mode fill in `BEEFREE_CLIENT_ID` and `BEEFREE_CLIENT_SECRET`; in client-side mode leave the placeholders.
3. `npm start` (Node.js 20.6 or newer), then open <http://localhost:3000>.
   The server listens on `127.0.0.1` only. Set `HOST=0.0.0.0` in `.env` to reach it from another device.
4. Click **Save** in the top bar. The JSON, the HTML and a rendered preview appear below the builder.

Page Builder application: the builder starts with the `shopping-app` sample page.
Popup Builder application: the builder starts with the `Welcome-Back` sample popup at 500px, and the HTML panel shows a snippet to embed in your own popup, not a full page.
Both samples come from [BeefreeSDK/beefree-sdk-assets-templates](https://github.com/BeefreeSDK/beefree-sdk-assets-templates), pinned to one commit.

File Manager application: step 3 opens `file-manager.html` on its own.
Upload a file, then reload the page: the file is still there.
Files go to Beefree SDK storage by default; another storage is picked in the Developer Console, with no change to the demo.

## Not for production

The demo shows that the integration works; it isn't production code.
If you copy parts of it into your app, here's what your app still needs:

- **Who gets a token.** `POST /api/beefree/token` answers anyone who can reach it, which is why the server listens on `127.0.0.1` only. Put it behind your app's login.
- **The `uid` comes from the server.** The demo takes it from the request body and uses `demo-user` for everyone. Derive it from the signed-in account on the server, since every distinct `uid` is billed and decides whose files and saved rows a user sees.
- **Saving the design.** `onSave` only fills the panels here. Store the template JSON in your database; the HTML can be regenerated from the JSON, but not the other way around.
- **Rate limiting** on the token endpoint, so a loop or a bot can't use up your Beefree SDK quota.
- **The `startOrigin` tag.** `public/app.js` and `public/file-manager.js` send `startOrigin: '[skill] beefree-sdk-setup'` in the builder config, so Beefree can count builders started from this demo. It carries no personal data. Remove those two lines when you copy the config into your app.
- **Real hosting and real templates.** HTTPS and your app's own server instead of this file server, and your own templates instead of the samples fetched at run time.

## Files

| File                       | Role                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.js`                | Static server plus `POST /api/beefree/token`                                                                                                         |
| `public/index.html`        | Page layout: toolbar, builder container, output panels                                                                                               |
| `public/app.js`            | Loads a sample of the application's type (Email `?template=<name>`, default `m-bee`), creates the builder, wires `onSave`; sends File Manager credentials to `file-manager.html` |
| `public/file-manager.html` | File Manager page: status line and a full-height container                                                                                           |
| `public/file-manager.js`   | Starts the File Manager with no template                                                                                                             |
| `public/token-claims.js`   | Reads the application type (`product_handle`) from the token                                                                                         |
| `public/auth.js`           | Your copy of one of the two `auth/` variants                                                                                                         |
| `auth/proxy.js`            | `getBeefreeToken()` calling the local token endpoint                                                                                                 |
| `auth/client-side.js`      | `getBeefreeToken()` calling `auth.getbee.io` directly, insecure                                                                                      |

## Docs

- Installation and fundamentals: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation?from=skill>
- Authorization process: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/authorization-process-in-detail?from=skill>
- Page Builder: <https://docs.beefree.io/beefree-sdk/visual-builders/page-builder?from=skill>
- Popup Builder: <https://docs.beefree.io/beefree-sdk/visual-builders/popup-builder?from=skill>
- File Manager: <https://docs.beefree.io/beefree-sdk/file-manager/file-manager-application-overview?from=skill>
