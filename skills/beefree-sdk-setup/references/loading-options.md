# Loading the builder: loader script or npm package

Source: <https://github.com/BeefreeSDK/beefree-sdk-npm-official> and
<https://docs.beefree.io/beefree-sdk/getting-started/readme/installation>.

Both routes end with the same builder.
Pick by whether the project has a bundler.

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

## Which one for which case

| Situation                                  | Choice        |
| ------------------------------------------ | ------------- |
| Empty folder, fastest demo                 | Loader script |
| Static HTML page, no build step            | Loader script |
| App with Vite, webpack, Next.js, Angular CLI | npm package |
| TypeScript types wanted                    | npm package   |
