# Loading the builder: loader script or npm package

Source: <https://github.com/BeefreeSDK/beefree-sdk-npm-official>,
<https://docs.beefree.io/beefree-sdk/getting-started/readme/installation?from=skill> and
<https://docs.beefree.io/beefree-sdk/quickstart-guides?from=skill> (framework wrappers, read on 2026-10-16).

All routes end with the same builder.
Pick by whether the project has a bundler, and whether it is a React, Vue or Angular app.

## Option 1: loader script (no bundler)

```html
<script src="https://app-rsrc.getbee.io/plugin/v2/BeePlugin.js"></script>
<script>
  BeePlugin.create(tokenObject, beeConfig, function (instance) {
    instance.start(templateJson)
  })
</script>
```

- Defines the global `BeePlugin`.
- `https://app-rsrc.getbee.io/plugin/v2/BeePlugin.js` is the URL the current npm package loads internally.
  The older `https://app-rsrc.getbee.io/plugin/BeePlugin.js` also resolves and appears in older samples.
  Use the `v2` URL for new code.
- Link to the hosted file instead of copying it locally.
  Beefree shows scheduled maintenance notices only through the hosted loader.
- Used by the standalone demo in `assets/demo/`.

## Option 2: npm package (bundler required)

```bash
npm install @beefree.io/sdk
```

```javascript
import BeefreeSDK from '@beefree.io/sdk'

const bee = new BeefreeSDK(tokenObject)
await bee.start(beeConfig, templateJson)
```

- Package `@beefree.io/sdk`, Apache-2.0, TypeScript types included.
- The published build is CommonJS plus ES module and imports `load-script` and `fp-ts` as external dependencies.
  It does not run from a plain `<script type="module">` without a bundler.
  Vite, webpack, Rollup, Next.js and similar all work.
- The wrapper loads the same `BeePlugin.js` loader at run time, so the browser still reaches `app-rsrc.getbee.io`.
- The wrapper also exposes `UNSAFE_getToken(clientId, clientSecret, uid)`.
  Do not use it outside a local test.

## Option 3: framework wrapper (React, Vue, Angular)

Beefree publishes one official wrapper per framework.
The docs' quickstarts build on them, so use the wrapper rather than calling `@beefree.io/sdk` from a component.

| Framework                          | Package                             | Requires     | Quickstart                                                                                  |
| ---------------------------------- | ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| React (also Next.js, Remix, Vite)  | `@beefree.io/react-email-builder`   | React 17-19  | <https://docs.beefree.io/beefree-sdk/quickstart-guides/react-no-code-email-builder?from=skill>         |
| Vue (also Nuxt)                    | `@beefree.io/vue-email-builder`     | Vue 3.3+     | <https://docs.beefree.io/beefree-sdk/quickstart-guides/vue.js-no-code-email-builder?from=skill>        |
| Angular                            | `@beefree.io/angular-email-builder` | Angular 20+  | <https://docs.beefree.io/beefree-sdk/quickstart-guides/angular-no-code-email-builder?from=skill>       |

- All three are Apache-2.0 and ship TypeScript types.
  Versions on npm on 2026-10-16: React 1.0.4, Vue 1.1.1, Angular 1.1.3.
- Despite the `email-builder` name, each package README says it covers Email Builder, Page Builder, Popup Builder and File Manager applications.
  The application type still comes from the credentials.
- React and Vue export a `Builder` component and a `useBuilder` hook or composable (`save`, `preview` and config updates).
  Angular exports a standalone `BeefreeBuilder` component and a `BeefreeService`.
- Each takes the same token object (`{ access_token, v2 }`) and the same `beeConfig` as the other routes.
  Callbacks such as `onSave` and `onError` go in the config, or as component events.
- Each README fetches the token from `POST /api/beefree/token`, the same contract as the token endpoint in this skill.
  The backend part of this skill applies unchanged.
- Next.js: the builder runs only in the browser, so put it in a `'use client'` component (observed in the React package README, 2026-10-16).
- Angular below 20 is not supported by the wrapper: use the npm package (Option 2) there.
- React: `<Builder>` needs `useBuilder(config)` called with the same `container`.
  Without it the container stays empty and no error is shown (observed with 1.0.4, 2026-10-19).
- React StrictMode, on by default in Vite and Next.js development, mounts components twice.
  The React wrapper handles it: one builder ends up in the container (observed with 1.0.4, 2026-10-19), so keep StrictMode on.
  If you call `@beefree.io/sdk` directly from a React effect instead, the builder starts twice; start it once per container with a ref guard, and do not remove StrictMode to hide it.

## Which one for which case

| Situation                                              | Choice            |
| ------------------------------------------------------ | ----------------- |
| Empty folder, fastest demo                             | Loader script     |
| Static HTML page, no build step                        | Loader script     |
| React, Next.js, Vue, Nuxt, or Angular 20+ app          | Framework wrapper |
| Other app with a bundler (Vite, webpack), Angular <20  | npm package       |
| TypeScript types wanted, no framework                  | npm package       |
