# File Manager

Source: <https://docs.beefree.io/beefree-sdk/file-manager/file-manager-application-overview>
and <https://docs.beefree.io/beefree-sdk/server-side-configurations/server-side-options/storage-options>.

## What it is

A File Manager application starts the Beefree file manager on its own, without a builder.
End users upload, browse and organize images and other files.
Authorization is the same `loginV2` call as for the builders; the credentials of a File Manager application return a token that starts the File Manager.
The token payload carries `product_handle: "fm"`, see [auth.md](auth.md).
Files belong to the `uid`: the same `uid` sees the same files in every session.

## Starting it

Same `create` as a builder, then `start()` with no template.

```javascript
const beeConfig = {
  container: 'beefree-sdk-container', // required, needs an explicit height
  language: 'en-US',
  onError: function (error) {
    console.error('Beefree SDK error', error)
  }
}

BeePlugin.create(tokenObject, beeConfig, function (instance) {
  instance.start()
})
```

npm package: `bee.startFileManager(beeConfig)` instead of `bee.start(beeConfig, template)`.
Observed in `BeefreeSDK/beefree-sdk-npm-official` `src/index.ts` on 2026-10-01: `startFileManager` calls `instance.start(options)`, with no template.

Builder callbacks such as `onSave`, `onSend` and `onAutoSave` do not apply: there is no design to save.
`onError`, `onWarning` and token refresh with `updateToken` work as in [auth.md](auth.md).

## Config keys

Observed in the `IBeeConfigFileManager` type of `BeefreeSDK/beefree-sdk-npm-official` (`src/types/bee.ts`) on 2026-10-01:
`container`, `uid`, `customCss`, `addOns`, `customHeaders`, `contentDialog`, `customAssetsOptions`, `onFilePickerInsert`, `onFilePickerCancel`.
The type lists no template and no save callbacks.

## Insert and X buttons

Two callbacks turn the File Manager into a picker for the host app.
Each one adds a button only when it is defined.

| Callback             | Arguments | Adds          | Fires when                                                     |
| -------------------- | --------- | ------------- | -------------------------------------------------------------- |
| `onFilePickerInsert` | `(data)`  | Insert button | The user clicks Insert; `data` holds the file metadata and URL |
| `onFilePickerCancel` | none      | X button      | The user closes the picker                                     |

A standalone asset library leaves both out.
Define them when the host app opens the File Manager to let the user choose a file for its own form.

## Storage

Storage is configured per application in the Developer Console, not in `beeConfig`.

| Option                  | Notes                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Beefree SDK storage     | Default. AWS S3 plus CloudFront, hosted by Beefree                                                                        |
| An existing application | The two applications share one storage; development and production apps cannot be linked                                  |
| Your own AWS S3 bucket  | Beefree stores and delivers files from the developer's bucket                                                             |
| Your own file system    | Paid plans only. Beefree calls the developer's File System Provider API, server to server, so it needs a public HTTPS URL |

Beefree SDK storage charges nothing for storage and for the first 5 TB of delivery traffic per 30-day period, then $0.01 per GB.

## Upload limits

Source: <https://docs.beefree.io/beefree-sdk/file-manager/file-manager-application-overview/file-extensions-and-groups>.

- New applications accept images, videos and PDFs.
  Paid plans can allow more groups (office, text, zip, fonts, and so on) in the **Privacy & Security** section of the Developer Console.
- Default maximum file size: 20 MB.
- Images wider than 1920 px are resized to 1920 px on upload, which can change colors and drop GIF frames.
- HEIC files are not supported.
  Harmful types (exe, msi, bat, iso, jar, apk, SVG with JavaScript, HTML with redirects) are always rejected.

## Server side

The Content Services API has File Manager endpoints that list, search, create, upload, move and delete a user's files and folders without opening the File Manager.
Source: <https://docs.beefree.io/beefree-sdk/apis/content-services-api/file-manager>.
