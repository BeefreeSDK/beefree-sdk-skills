---
name: beefree-sdk-setup
license: MIT
description: Set up Beefree SDK (the embeddable email, page and popup builder) in a project, from an empty folder to a running local demo or into an existing web app. Covers loginV2 authorization, the token endpoint, loading the builder, the minimal beeConfig, the save round trip, the standalone File Manager application, and which plan the credentials are on. Use when the user mentions Beefree SDK, @beefree.io/sdk, BeePlugin, loginV2, client_id and client_secret for Beefree, wants to embed a drag-and-drop email builder or the Beefree File Manager, or asks whether a Beefree SDK feature is in their plan.
compatibility: Needs bash, curl and Node.js 20.6 or newer for the credentials check and the local demo. jq is optional.
metadata:
  author: Beefree SDK
  version: "0.3.1"
  last-verified: "2026-10-01"
  docs: https://docs.beefree.io/beefree-sdk
---

# Beefree SDK setup

Get a developer from Beefree SDK credentials to a builder that renders in the browser and returns JSON plus HTML on save.
With File Manager credentials, the goal is a File Manager where uploaded files are still there after a reload.
The skill is framework-neutral.
Framework-specific integration (React, Vue, Angular) is out of scope here.

## Prerequisites

Confirm these before writing code.

1. A Beefree SDK developer account and an application.
   If the user has none, send them to <https://developers.beefree.io/signup?from=skill>.
   The `from=skill` parameter tells Beefree that the signup came through this skill; keep it in the link.
   Account and application creation are manual and outside this skill.
2. The application's **Client ID** and **Client Secret**.
   They are on the application details page of the Developer Console (<https://developers.beefree.io/apps/>).
3. The application type.
   Credentials are bound to one application type: Email Builder, Page Builder, Popup Builder or File Manager.
   This skill covers **Email Builder** and **File Manager**.
   Page Builder and Popup Builder are not covered yet: say so, and point to <https://docs.beefree.io/beefree-sdk>.
   The type is read from the token by `scripts/check-credentials.sh`, so there is no need to ask it up front.
   When the type is not the one the user wants, say which type the credentials are for and that they need the credentials of an application of the wanted type.
   That is a new application in the Developer Console, created by the user.
   Never suggest a development (child) application for this: it always has the same type as its parent.
4. Node.js 20.6 or newer for the local demo (`node --env-file` is used).
   An existing app keeps its own runtime.

Never ask the user to paste the Client Secret into the chat.
Ask them to put it in a `.env` file or in an environment variable.

## Step 1: ask two questions

Ask what the request does not already answer, before generating anything.
When the user has named the target or the authorization mode, do not ask it again.

**Question 1, target.**
"Do you want a standalone demo in a new folder, or should I add Beefree SDK to an existing app?"
Default suggestion: the standalone demo.
It is the fastest path to a working builder.

**Question 2, authorization mode.**
Present both options and let the user choose.
Never pick option A silently.
When the request already names Option A, state the risk below in one sentence and go on.

- **Option A, client-side credentials (quick test only).**
  The Client ID and Client Secret go into a browser file that calls the Beefree authorization endpoint directly.
  State the risk in these words: "Anyone who can open this page or its source can read your Client Secret and use your Beefree SDK quota.
  While the demo server runs, any website open in the same browser can load the credential file too.
  Beefree's documentation says: do not put your Beefree SDK credentials in client-side code.
  Keep this file on your machine only.
  Do not commit it, deploy it, or share it."
- **Option B, small backend token endpoint (mirrors production).**
  A tiny server reads the credentials from the environment, calls the authorization endpoint, and forwards the token to the browser.
  Recommend this one.
  It is the same flow the user will ship.

## Step 2A: standalone demo in a new folder

Ready-made files live in `assets/demo/`.
Copy them instead of rewriting them.

1. Copy `assets/demo/` into the target folder.
   Keep the layout: `server.js`, `package.json`, `.env.example`, `.gitignore`, `README.md`, `public/`, `auth/`.
2. Pick the auth variant and copy it to `public/auth.js`:
   - Option B: `cp auth/proxy.js public/auth.js`
   - Option A: `cp auth/client-side.js public/auth.js`, then tell the user to replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` inside `public/auth.js` themselves.
     Add `public/auth.js` to `.gitignore` in this mode.
3. `cp .env.example .env` in both modes, because `npm start` loads that file and fails when it is missing.
   Option B: tell the user to fill `BEEFREE_CLIENT_ID` and `BEEFREE_CLIENT_SECRET` in `.env`.
   Option A: leave the placeholders, the server only warns about them.
4. Run `scripts/check-credentials.sh .env` from this skill before starting the server.
   It validates the credentials and prints the plan and the application type read from the token, never the secret.
   Report both to the user, see [Plan check](#plan-check).
   If the type is not the one the user asked for (for example Email Builder credentials for a File Manager), stop here, see prerequisite 3.
5. Start: `npm start` (runs `node --env-file=.env server.js`).
   Option A can also open `public/index.html` straight from the file system, no server needed.
6. Open <http://localhost:3000>.
   With File Manager credentials the page reads the type from the token and opens `file-manager.html` on its own.

The demo has no npm dependencies.
It loads the builder with the Beefree loader script and fetches a sample template at run time.
The default is `m-bee`; open `index.html?template=<name>` to start with another one, see [Sample templates](references/config-and-callbacks.md#sample-templates) for the names.
Do not ask the user which template to use: the sample is a stand-in for their own JSON.
A File Manager takes no template.
It stores files in Beefree SDK storage by default.
Tell the user they can switch to an existing application's storage, their own AWS S3 bucket or, on paid plans, their own file system in the Developer Console; the demo needs no change for that.
See [file-manager.md](references/file-manager.md#storage).
See [loading-options.md](references/loading-options.md) for why the demo does not use the npm package.

## Step 2B: existing app

Stay framework-neutral: describe what to add, then adapt to the stack you find in the repo.

1. **Token endpoint in the user's backend** (Option B) or a client-side token call (Option A, with the warning above).
   Contract of the endpoint: `POST /api/beefree/token`, body `{ "uid": "<string>" }`, response is the unmodified body returned by Beefree, that is `{ "access_token": "...", "v2": true }`.
   Read the credentials from environment variables.
   Use `assets/demo/server.js` as the reference implementation and port the `handleToken` function to the user's language and framework.
2. **Builder loading in the frontend.**
   Two ways, see [loading-options.md](references/loading-options.md):
   - npm package `@beefree.io/sdk` when the app has a bundler (Vite, webpack, Next.js, and so on).
   - the loader script `https://app-rsrc.getbee.io/plugin/v2/BeePlugin.js` when it does not.
3. **A container element** with an explicit height, for example `<div id="beefree-sdk-container" style="height: 800px"></div>`.
   The builder fills the container. A zero-height container shows nothing.
4. **A minimal config** with `container` and an `onSave` callback, see [config-and-callbacks.md](references/config-and-callbacks.md).
5. **Start with a template**: fetch `https://rsrc.getbee.io/api/templates/m-bee` or use the user's own template JSON.
   Other sample names (`newsletter`, `one-column`, `promo`, `base-*`) are listed in [config-and-callbacks.md](references/config-and-callbacks.md#sample-templates).
6. **Check the plan** with `scripts/check-credentials.sh` once the credentials are in place, see [Plan check](#plan-check).

**File Manager application.**
The token endpoint and the loading are the same.
What changes, details in [file-manager.md](references/file-manager.md):

- `start()` with no template: `instance.start()` with the loader script, `bee.startFileManager(beeConfig)` with the npm package.
- No `onSave`: there is no design to save. Keep `onError` and the token refresh.
- Add `onFilePickerInsert` and `onFilePickerCancel` only when the app opens the File Manager to pick a file; each one adds a button (Insert, X).
- Storage is set per application in the Developer Console, not in `beeConfig`. Beefree SDK storage is the default.

## Plan check

Beefree SDK features are gated by plan: Free, Essentials, Core, Superpowers, Enterprise.
Configuration for a feature outside the plan may be ignored or have no visible effect.
Check the plan before proposing or configuring any feature beyond the basic builder.

1. Run `scripts/check-credentials.sh path/to/.env`.
   On success it prints a line like `Plan: Core (tier 30, token value 'beeplugin_silver')` and the application type.
   The plan is read from the token, so it needs no extra credentials.
2. Report what the token says.
   Ask the user to confirm only when the plan could not be read, is unknown, or is below what the requested feature needs.
   The plan belongs to the application whose credentials are in `.env`; the user may have other applications on other plans.
   When the script cannot read the plan, ask the user which plan they are on.
3. Look the feature up in [plans.md](references/plans.md) before configuring it.
   The table lists only the features these skills touch; for any other feature read the pricing page linked at the top of that file.
   If the plan includes it, go ahead.
   If not, say so and offer the two paths:
   - **Test it in a development application.** On paid plans the user can create a development (child) application, of the same type as its parent, in the Developer Console, open its details and click **CHANGE PLAN** to a higher plan for testing.
     This is free of charge, does not change the production subscription, and features tested this way cannot ship to production without the matching plan.
   - **Upgrade** the production application.
   On Free there is no development application, so only the upgrade applies.

The check is advisory.
Beefree enforces entitlements server side, the skill only avoids configuring what will not work.

## Core facts

Authorization, full details in [auth.md](references/auth.md):

- Endpoint: `POST https://auth.getbee.io/loginV2` with header `Content-Type: application/json`.
- Body: `{ "client_id": "...", "client_secret": "...", "uid": "..." }`.
- Response: `{ "access_token": "...", "v2": true }`.
  Pass this whole object to the builder, not only the string.
- `uid` is a string of letters, digits, `_` and `-`.
  It identifies one customer account of the host app, counts toward billing, and must not contain personal data.
  Use `demo-user` in the demo.
- The token is a JWT whose payload carries `plan` and `product_handle` in clear text, see [auth.md](references/auth.md) and [plans.md](references/plans.md).
- The token expires after 5 minutes and is refreshed automatically for 12 hours.
  After that the builder emits `onError` with code 5101 (call `updateToken` with a fresh token) or 5102 (recreate the builder with the template in the error payload).

Builder, full details in [config-and-callbacks.md](references/config-and-callbacks.md):

- Loader script: `BeePlugin.create(token, beeConfig, instance => instance.start(template))`.
- npm package: `const bee = new BeefreeSDK(token); await bee.start(beeConfig, template)`.
- `container` is the only required config key.
- `onSave(jsonFile, htmlFile, ampHtml, templateVersion, language)` receives the template JSON as a string and the rendered HTML.
  `instance.save()` triggers it.

## Step 3: verify

The round trip is the acceptance test.
Run through it with the user.

Email Builder:

1. The page loads with no console error and the builder renders inside the container with the sample template.
2. Click **Save** in the page toolbar.
3. The JSON and the HTML panels fill up, and the HTML preview shows the rendered email.

File Manager:

1. <http://localhost:3000> moves to `file-manager.html`, and the status line says the File Manager is ready.
2. Upload an image.
3. Reload the page: the image is still there, because files belong to the `uid`.

If any step fails, use [troubleshooting.md](references/troubleshooting.md).
The most common causes are wrong credentials (HTTP 401, code 5002), credentials of a Page or Popup application, a container without height, and a feature outside the plan.

## Security rules

- Credentials live in environment variables or in a local `.env` file listed in `.gitignore`.
- The token endpoint forwards only the Beefree response body. It never returns the Client Secret.
- Log the HTTP status and the Beefree error code, never the request body sent to the authorization endpoint.
- In Option A, the credential file is local-only and ignored by git.

## References

- [auth.md](references/auth.md): authorization call, uid rules, token lifetime, error codes.
- [plans.md](references/plans.md): plans, availability of the features these skills touch, development applications for testing higher plans.
- [config-and-callbacks.md](references/config-and-callbacks.md): minimal config, callbacks, instance methods.
- [file-manager.md](references/file-manager.md): File Manager application, picker callbacks, storage options, upload limits.
- [loading-options.md](references/loading-options.md): loader script versus npm package.
- [troubleshooting.md](references/troubleshooting.md): symptoms and fixes.
- Official docs: <https://docs.beefree.io/beefree-sdk>.
  Installation and fundamentals: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation>.
