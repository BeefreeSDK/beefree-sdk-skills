---
name: beefree-sdk-setup
license: Apache-2.0
description: Set up Beefree SDK (the embeddable email, page and popup builder) in a project, from an empty folder to a running local demo or into an existing web app. Covers loginV2 authorization, the token endpoint, loading the builder, the minimal beeConfig, the save round trip for Email, Page and Popup Builder, the standalone File Manager application, which plan the credentials are on, and which official wrapper to use in a React, Vue or Angular app. Use when the user mentions Beefree SDK, @beefree.io/sdk, @beefree.io/react-email-builder, @beefree.io/vue-email-builder, @beefree.io/angular-email-builder, BeePlugin, loginV2, client_id and client_secret for Beefree, wants to embed a drag-and-drop email builder or the Beefree File Manager, or asks whether a Beefree SDK feature is in their plan.
compatibility: Needs bash, curl and Node.js 20.6 or newer for the credentials check and the local demo. jq is optional.
metadata:
  author: Beefree SDK
  version: "0.4.0"
  last-verified: "2026-10-01"
  docs: https://docs.beefree.io/beefree-sdk?from=skill
---

# Beefree SDK setup

Get a developer from Beefree SDK credentials to a builder (Email, Page or Popup) that renders in the browser and returns JSON plus HTML on save.
With File Manager credentials, the goal is a File Manager where uploaded files are still there after a reload.
The skill is framework-neutral.
For a React, Vue or Angular app it points to Beefree's official framework wrapper: this skill still gives the token endpoint, the credentials and plan check and the acceptance test, the wrapper gives the component.

## Before you start: where this runs

This skill works best in a coding agent that can write files in the user's project and run commands on their machine (`bash`, `node`, `curl`).
If you cannot do that here, for example in a chat app where files only exist in a sandbox, tell the user before Step 1 and let them choose:

- **Switch to a coding agent** (Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI and others) in their project folder.
  Suggest this one: the agent checks the credentials, starts the builder and fixes what fails, in the user's own project.
- **Continue here.**
  You produce the files as a download.
  The trade-off: nothing is run against their credentials or tested before they get it, and they run the credentials check, `npm start` and the [Step 3](#step-3-verify) round trip themselves.

Go on with whichever they pick.

## Prerequisites

Confirm these before writing code.

1. A Beefree SDK developer account and an application.
   If the user has none, send them to <https://developers.beefree.io/signup?from=skill>.
   The `from=skill` parameter tells Beefree that the visit came through this skill.
   Every Beefree link in these skills carries it: keep it when you show or open a link.
   Account and application creation are manual and outside this skill.
2. The application's **Client ID** and **Client Secret**.
   They are on the application details page of the Developer Console (<https://developers.beefree.io/apps/?from=skill>).
3. The application type.
   Credentials are bound to one application type: Email Builder, Page Builder, Popup Builder or File Manager.
   This skill covers all four.
   Page and Popup Builder work like Email Builder; the differences are in [page-and-popup.md](references/page-and-popup.md).
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
   The page reads the type from the token and starts the matching builder with a sample of that type.
   With File Manager credentials it opens `file-manager.html` on its own.

The ready-made demo is plain HTML and JavaScript.
When the user asks for a demo in a framework (for example "a Vue demo"), say so and offer both: this demo as is, or a new app of that framework, set up with its own tooling, then Step 2B with the framework wrapper.
Do not rewrite the demo in the framework.

The demo has no npm dependencies.
Its builder config carries `startOrigin: '[skill] beefree-sdk-setup'`, so Beefree can count builders started from this demo; it holds no personal data.
Say so if the user asks, and never add it to code you write in the user's own app (Step 2B).
It loads the builder with the Beefree loader script and fetches a sample template at run time.
For Email Builder the default is `m-bee`; open `index.html?template=<name>` to start with another one, see [Sample templates](references/config-and-callbacks.md#sample-templates) for the names.
Page Builder starts with `shopping-app` and Popup Builder with `Welcome-Back`, both from the Beefree templates repository, see [page-and-popup.md](references/page-and-popup.md#sample-templates).
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
   In the app, read `uid` from the signed-in user's session on the server, not from the request body; the demo does that only because it has no users.
   Put the endpoint behind the app's own login, so only signed-in users get a token.
   Use `assets/demo/server.js` as the reference implementation and port the `handleToken` function to the user's language and framework.
2. **Builder loading in the frontend.**
   Three ways, see [loading-options.md](references/loading-options.md):
   - the official framework wrapper in a React (including Next.js), Vue or Angular 20+ app: `@beefree.io/react-email-builder`, `@beefree.io/vue-email-builder` or `@beefree.io/angular-email-builder`.
     Follow the wrapper's quickstart for the component code.
     In React, call `useBuilder(config)` alongside `<Builder>` and keep StrictMode on, see [loading-options.md](references/loading-options.md#option-3-framework-wrapper-react-vue-angular).
     The token endpoint above, the plan check and the Step 3 round trip still apply.
   - npm package `@beefree.io/sdk` in any other app with a bundler (Vite, webpack, Angular below 20, and so on).
   - the loader script `https://app-rsrc.getbee.io/plugin/v2/BeePlugin.js` when it has no bundler.
3. **A container element** with an explicit height, for example `<div id="beefree-sdk-container" style="height: 800px"></div>`.
   The builder fills the container. A zero-height container shows nothing.
4. **A minimal config** with `container` and an `onSave` callback, see [config-and-callbacks.md](references/config-and-callbacks.md).
5. **Start with a template**: the user's own template JSON, or a sample of the application's type.
   Email Builder: fetch `https://rsrc.getbee.io/api/templates/m-bee`; other names (`newsletter`, `one-column`, `promo`, `base-*`) are listed in [config-and-callbacks.md](references/config-and-callbacks.md#sample-templates).
   Page and Popup Builder: the samples in [page-and-popup.md](references/page-and-popup.md#sample-templates).
6. **Check the plan** with `scripts/check-credentials.sh` once the credentials are in place, see [Plan check](#plan-check).

**Page Builder and Popup Builder applications.**
Everything above applies unchanged, with a template of the matching type.
For Popup, set the width in `beeConfig.workspace.popup.contentWidth`, because the template does not store it, and treat the `onSave` HTML as a snippet to embed in the app's popup, not a page.
Details in [page-and-popup.md](references/page-and-popup.md).

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

   On Free there is no development application, so offer a no-charge proof of concept (PoC) trial first and the upgrade second.
   Keep the link and the meaning of this message, and fit the wording to the conversation:
   "{Feature} is available on {Plan} and above, so it isn't included in the Free plan, but we'd love for you to try it. You can request a no-charge proof of concept (PoC) trial to get access while you build: <https://developers.beefree.io/talk-to-sales?from=skill>
   If you'd rather move to a paid plan now, you can upgrade the application in the Developer Console."
   `{Plan}` is the lowest plan that includes the feature, from the "Min plan" column of [plans.md](references/plans.md#feature-availability).

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

Page Builder and Popup Builder: the same three steps with the `shopping-app` page or the `Welcome-Back` popup.
For Popup the HTML panel is titled "HTML snippet to embed": the output is a fragment for the app's own popup, not a full page.

File Manager:

1. <http://localhost:3000> moves to `file-manager.html`, and the status line says the File Manager is ready.
2. Upload an image.
3. Reload the page: the image is still there, because files belong to the `uid`.

If any step fails, use [troubleshooting.md](references/troubleshooting.md).
The most common causes are wrong credentials (HTTP 401, code 5002), credentials of another application type than the user wanted, a container without height, and a feature outside the plan.

## Step 4: before you ship

The demo proves the integration works, but it isn't production code, and parts of it get copied into real apps.
Once the round trip passes, tell the user what their app still needs, briefly and once:

- **Who gets a token.** The demo's endpoint answers anyone who can reach it; in the app, put the token endpoint behind the app's own login.
- **The `uid` comes from the server.** Derive it from the signed-in account, not from the request body, since every distinct `uid` is billed and decides whose files and saved rows a user sees.
- **Saving the design.** Store the template JSON from `onSave` in the app's database; the HTML can be regenerated from the JSON, but not the other way around.
- **Rate limiting** on the token endpoint, so a loop or a bot can't use up the Beefree SDK quota.
- **Real hosting and real templates.** HTTPS and the app's own server instead of the demo's file server, and the app's own templates instead of the samples.

In Step 2B, apply the first two points while writing the code rather than listing them afterwards.

## Security rules

- Credentials live in environment variables or in a local `.env` file listed in `.gitignore`.
- The token endpoint forwards only the Beefree response body. It never returns the Client Secret.
- In a real app the token endpoint requires the app's login and takes `uid` from the server-side session.
- Log the HTTP status and the Beefree error code, never the request body sent to the authorization endpoint.
- In Option A, the credential file is local-only and ignored by git.

## References

- [auth.md](references/auth.md): authorization call, uid rules, token lifetime, error codes.
- [plans.md](references/plans.md): plans, availability of the features these skills touch, development applications for testing higher plans.
- [config-and-callbacks.md](references/config-and-callbacks.md): minimal config, callbacks, instance methods.
- [page-and-popup.md](references/page-and-popup.md): Page and Popup Builder differences, popup workspace settings, sample templates.
- [file-manager.md](references/file-manager.md): File Manager application, picker callbacks, storage options, upload limits.
- [loading-options.md](references/loading-options.md): loader script, npm package, or framework wrapper.
- [troubleshooting.md](references/troubleshooting.md): symptoms and fixes.
- Official docs: <https://docs.beefree.io/beefree-sdk?from=skill>.
  Installation and fundamentals: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation?from=skill>.
