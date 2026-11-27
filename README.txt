Crash Reporter Setup - local/static export

Files
  index.html       Page markup
  style.css        Styles
  app.js           Browser interface, version loading and download handling
  generator.js     QMOD generation and validation
  catalog.json     Saved version list used if the live feed is unavailable
  cover.png        Artwork included in generated QMODs
  favicon.svg      Browser icon
  vendor/          JSZip and its license

No build step, npm install, backend, database, or Sites account is needed.
JavaScript uses standard ES modules. All shipped assets are local.

RUN LOCALLY
Open a terminal in this folder and run (requires Python):
  python -m http.server 8080 --bind 127.0.0.1
Then visit http://127.0.0.1:8080
Use a local HTTP server rather than double-clicking index.html: file:// restricts
ES modules and fetching the catalog/cover. Stop the server with Ctrl+C.

CLOUDFLARE PAGES
1. Open Workers & Pages in your Cloudflare dashboard and create a Pages project
   using Direct Upload (drag and drop).
2. Upload this folder or the supplied ZIP. index.html must be at the upload root.
   No framework/build command is needed. Test the assigned *.pages.dev URL first.
3. In that Pages project, open Custom domains > Set up a domain and enter
   crgen.frozenalex.com.
4. Follow the DNS instructions. The crgen CNAME should point to the exact
   *.pages.dev hostname Cloudflare assigns, replacing its existing hosting record.
   Add the hostname to Pages before changing DNS; a CNAME alone is insufficient.
5. If the hostname is reported as already assigned to another Cloudflare service,
   detach its current Sites custom-domain binding as part of the migration, then
   complete the Pages association. Keep the existing site until Pages is tested.

Hosting static assets is free on Pages, including unlimited static asset requests.
Domain registration/renewal remains separate. This export requires no Functions.
Direct Upload projects cannot be switched to Git integration; choose Git integration
at project creation instead if you want automatic deployments from a repository.

EXTERNAL SERVICES
Version updates: https://mods.bsquest.xyz/mods.json
Installed CrashReporter upload URL: https://analyze.aeternal.dev/api/upload
Reports viewer: https://analyze.aeternal.dev/crashes/?userId=YOUR_USERNAME
Generating a QMOD happens in the browser; this website does not upload crash data.
The installed mod uploads reports. Those services are not included in this export.
The saved catalog allows generation when the live catalog cannot be reached.

Source: Site version 7, commit f678f95f26afe71e73884987f86113d0aef5ce1d.
Export changes: app.mjs/generator.mjs renamed to .js and references updated.
The hosted site and DNS were not changed.

Cloudflare documentation:
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/pages/configuration/custom-domains/
https://developers.cloudflare.com/pages/functions/pricing/
