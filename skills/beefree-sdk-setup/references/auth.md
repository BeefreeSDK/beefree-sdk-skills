# Authorization

Source: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/authorization-process-in-detail>
and <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/how-the-uid-parameter-works>.

## Request

```http
POST /loginV2 HTTP/1.1
Host: auth.getbee.io
Accept: application/json
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "uid": "demo-user"
}
```

Only `Content-Type: application/json` is accepted.
Form encoding returns HTTP 415 with code 5001.

## Response

```json
{
  "access_token": "...",
  "v2": true
}
```

Pass the whole object to the builder.
With the loader script: `BeePlugin.create(tokenObject, config, callback)`.
With the npm package: `new BeefreeSDK(tokenObject)`.
The npm wrapper rejects a token object without `access_token` with the message "Malformed or undefined token".

## Where the call runs

Server side.
The docs say: "Do not put your Beefree SDK credentials in client-side code."
The host backend exposes its own endpoint, reads the credentials from the environment, calls `loginV2`, and forwards the response body unchanged.
The frontend calls only that endpoint.

The npm package still exposes `UNSAFE_getToken(clientId, clientSecret, uid)`.
The prefix was added in v9.0.0 to mark it as suitable for quick tests only.

## uid rules

- A string. Pass `"12345"`, not `12345`.
- Letters `a-z` and `A-Z`, digits, `_` and `-`. Anything else returns HTTP 400 with code 5005.
- One uid normally maps to one customer account of the host application. Sub-users of that account share the uid.
- Every distinct uid counts as a unique user for billing within the billing period.
- The uid scopes the default file storage: files uploaded under one uid are not visible under another.
- Must not be personal data.
- The same uid in a production application and in a development application counts twice.

## Token lifetime

| Fact                                       | Value                        |
| ------------------------------------------ | ---------------------------: |
| Access token validity                      |                    5 minutes |
| Automatic refresh window without new login |                     12 hours |
| Expected 401 during automatic refresh      | yes, part of the normal flow |

After 12 hours the host application must obtain a new token and inject it with `instance.updateToken(tokenObject)`.
Best practice: refresh before expiration, around the 11 hour mark.

## Token contents

The `access_token` is a JWT.
Its payload (second segment, base64url) has a few claims in clear text:

| Claim            | Example          | Meaning                                                                   |
|------------------|------------------|---------------------------------------------------------------------------|
| `plan`           | `beeplugin_gold` | Plan of the application, internal name, see [plans.md](plans.md)          |
| `product_handle` | `nl`             | Application type: `nl` Email, `page` Page, `pub` Popup, `fm` File Manager |
| `plugin_version` | `v...`           | Builder version served to this application                                |
| `bee`            | encrypted string | Account and uid data, encrypted, not readable by the host                 |
| `exp`, `iat`     | unix timestamps  | Expiry and issue time                                                     |

No `Source:` link for this section: Beefree does not document the payload, the format was observed and may change.
`scripts/check-credentials.sh` reads `plan` and `product_handle` from it and falls back to asking the developer when they are missing.
Never log the token or the decoded payload.

## Error codes from loginV2

| Code | HTTP | Meaning                                                   | Fix                                                       |
| ---: | ---: | --------------------------------------------------------- | --------------------------------------------------------- |
| 5001 |  415 | Unsupported media type                                    | Send `Content-Type: application/json`                     |
| 5002 |  401 | Unable to authenticate with provided credentials          | Check Client ID and Client Secret, check application type |
| 5003 |  403 | Application is disabled                                   | Contact Beefree support                                   |
| 5005 |  400 | Invalid UID                                               | Use a string with letters, digits, `_`, `-` only          |

Error body shape:

```json
{ "code": 5002, "message": "Unable to authenticate with provided credentials.", "status_code": 401 }
```

## Error codes delivered through onError

| Code | Meaning                              | Action                                                                                   |
| ---: | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| 5101 | Expired token cannot be refreshed    | Get a new token from the backend, call `instance.updateToken(token)`                     |
| 5102 | Expired token must be refreshed      | Get a new token, create a new builder instance, start it with `error.template`           |

```javascript
onError: function (error) {
  switch (error.code) {
    case 5101:
      fetchTokenFromBackend().then(token => bee.updateToken(token))
      break
    case 5102:
      // recreate the builder with error.template so the user's work is kept
      break
    default:
      console.error('Beefree SDK error', error)
  }
}
```

## Application types

An application in the Developer Console is one of: Email Builder, Page Builder, Popup Builder, File Manager.
Credentials belong to one application, so they belong to one type.
`loginV2` accepts the credentials of every type; the token then starts the builder of that type.
Credentials of a File Manager application start the File Manager, and `start()` is called without a template, see [file-manager.md](file-manager.md).
Development applications (paid plans) are child applications with their own credentials.
Source: <https://docs.beefree.io/beefree-sdk/getting-started/readme/create-an-application>.

A development application has the same type as its parent: an Email Builder application can only have Email Builder children, not a File Manager child.
Confirmed in the Developer Console on 2026-10-01; the docs do not state it.
So a development application is a way to test a higher plan, never a way to get another type.
Credentials of the wrong type need a new application of the right type, created from the Developer Console application list.
