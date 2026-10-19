# Google Drive setup

The museum reads `museum-drive-config.json` at startup. Drive settings are public browser configuration; never put an OAuth client secret or other private credential in this file.

## Google Cloud

1. Create or select a Google Cloud project and enable the Google Drive API.
2. Configure the OAuth consent screen. Add each administrator as a test user while the app is in testing mode.
3. Create an OAuth client ID for a Web application. Add these authorized JavaScript origins:
   - `http://127.0.0.1:8000`
   - `http://localhost:8000` if you also use that address
   - The HTTPS origin where the museum will be hosted
4. Create an API key, restrict it to the Drive API, and restrict its HTTP referrers to the local and hosted museum origins.

The app uses the Drive OAuth scope to verify folder edit permission and write museum data. Google may show an unverified-app warning for an app that has not completed Google verification. Keep the app in testing and add only trusted editor accounts as test users, or complete Google's verification before broad OAuth use.

## Drive folder

1. Create a folder in Google Drive and copy its folder ID from the folder URL.
2. Share the folder with **Anyone with the link — Viewer** so visitors can read its contents.
3. Separately share the folder with each museum editor's Google account as **Editor**.
4. Fill in `clientId`, `apiKey`, and `folderId` in `museum-drive-config.json`.

The API key is visible to visitors, so its HTTP-referrer and API restrictions are important. The OAuth client ID is also public; do not add a client secret to browser code.

## Using the museum

- Visitors load the newest `museum-data.json` from the configured Drive folder. If there is no Drive copy yet, the app starts with the local `museum-data.json`; the first save creates the Drive copy.
- Opening **Quản lý** prompts the administrator to sign in. Editing is blocked unless that Google account can edit the configured Drive folder.
- Text changes are saved to Drive automatically. **Lưu ngay** uploads immediately.
- Selecting an image uploads it to that folder, grants public viewer access to the image, updates the current exhibit, and saves the updated museum data.
- The visitor site must be served over HTTP(S); direct `file://` use cannot read the Drive config.
