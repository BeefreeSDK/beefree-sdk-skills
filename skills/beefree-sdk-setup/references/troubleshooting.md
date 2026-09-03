# Troubleshooting

| Symptom                                                                            | Likely cause                                                                            | Fix                                                                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Token endpoint returns 401, body code 5002                                         | Wrong Client ID or Client Secret                                                        | Copy both again from the application details page in the Developer Console                                |
| Token OK but the builder is not the Email Builder, or fails on the sample template | Credentials of a Page, Popup or File Manager application (`loginV2` accepts every type) | Check the type printed by `check-credentials.sh`; use an Email Builder application or adapt the demo      |
| Token endpoint returns 400, code 5005                                              | Invalid `uid`                                                                           | Use a string with letters, digits, `_` and `-` only                                                       |
| Token endpoint returns 415, code 5001                                              | Wrong content type                                                                      | Send `Content-Type: application/json` and a JSON body                                                     |
| Token endpoint returns 403, code 5003                                              | Application disabled                                                                    | Contact Beefree support                                                                                   |
| Server prints "missing BEEFREE_CLIENT_ID"                                          | `.env` missing or not loaded                                                            | `cp .env.example .env`, fill it, start with `npm start` so `--env-file=.env` is applied                   |
| `node: .env: not found` on `npm start`                                             | `.env` file missing                                                                     | `cp .env.example .env` (also in client-side mode, placeholders are fine there)                            |
| `node: bad option: --env-file`                                                     | Node older than 20.6                                                                    | Upgrade Node, or export the two variables in the shell and run `node server.js`                           |
| Page loads, container stays empty, no error                                        | Container has no height                                                                 | Give the container an explicit height, for example `height: 800px` or a flex layout                       |
| `BeePlugin is not defined`                                                         | Loader script not loaded, or app code ran before it                                     | Keep the loader `<script>` before the app script, check network access to `app-rsrc.getbee.io`            |
| "Malformed or undefined token" from the npm wrapper                                | A string was passed instead of the response object                                      | Pass the whole `{ access_token, v2 }` object                                                              |
| Builder loads, then goes blank after a long session                                | Token refresh window (12 hours) expired                                                 | Handle `onError` codes 5101 and 5102, see `auth.md`                                                       |
| 401 requests visible in the network tab while it works                             | Normal automatic token refresh                                                          | Nothing to do                                                                                             |
| Save clicked, nothing happens                                                      | `onSave` missing from the config, or instance not started                               | Add `onSave`, make sure `start(template)` completed                                                       |
| Template loads with broken images                                                  | Template JSON from the assets repo with `repository_path`                               | Use `https://rsrc.getbee.io/api/templates/m-bee` or replace the placeholder                               |
| Feature set in `beeConfig` is ignored or its UI does not appear                    | Plan below the feature's minimum plan                                                   | Run `scripts/check-credentials.sh`, compare with `plans.md`, test in a development application or upgrade |
| CORS error calling `auth.getbee.io` from the browser                               | Client-side mode from an unusual origin                                                 | Switch to the backend token endpoint (Option B)                                                           |

Debug helpers in the config:

```javascript
debug: { all: true, inspectJson: true }
```

Docs: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/configuration-parameters/debugging-the-beefree-sdk-editor>.
Error reference: <https://docs.beefree.io/beefree-sdk/resources/error-management>.
