import {CATALOG_URL, UPLOAD_URL, parseCatalog, validRelease, validateUsername, parseBoolean, makePackage, buildQmod, compareVersions} from './generator.js';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const state = {releases: [], release: null, loading: false, building: false, cover: null, lastResult: null, objectUrl: null};
let requestedVersion = params.get('version');
$('username').value = params.get('usr') || '';
$('full-crash').checked = parseBoolean(params.get('fc'));
$('include-logs').checked = parseBoolean(params.get('log'));

function options() {return {username: $('username').value, release: state.release, fullCrash: $('full-crash').checked, log: $('include-logs').checked};}
function message(id, text, isError = false) {
  const element = $(id); element.textContent = text; element.hidden = !text; element.classList.toggle('error', isError);
}
function checkUsername() {
  const error = validateUsername($('username').value);
  message('username-error', error);
  $('username').setAttribute('aria-invalid', String(!!error));
  return !error;
}
function updatePreview() {
  const input = options();
  $('preview-game').textContent = input.release?.gameVersion.split('_')[0] || 'Choose a version';
  $('preview-loader').textContent = input.release?.modloader || '—';
  $('preview-reporter').textContent = input.release ? `v${input.release.version}` : '—';
  $('preview-username').textContent = input.username || '—';
  const error = validateUsername(input.username);
  $('package-readiness').textContent = !input.release ? 'Loading versions…' : error ? (input.username ? 'Check your username' : 'Add your username to get started') : 'Configured and ready to generate';
  $('config-preview').textContent = JSON.stringify({Enabled: true, FullCrash: input.fullCrash, Log: input.log, UserId: input.username, Url: UPLOAD_URL}, null, 2);
  $('download-button').disabled = !input.release || state.loading || state.building;
  $('copy-setup').disabled = state.loading || state.building || !input.release;
}
async function fetchWithTimeout(url, timeout = 9000) {
  const response = await fetch(url, {signal: AbortSignal.timeout(timeout)});
  if (!response.ok) throw new Error(`Could not load ${new URL(url, location.href).hostname} (HTTP ${response.status}).`);
  return response;
}
async function loadCatalog() {
  if (state.loading || state.building) return;
  state.loading = true; $('game-version').disabled = true; updatePreview();
 message('catalog-warning', '');
  const previous = state.release?.gameVersion || requestedVersion;
  try {
    let releases, warning = '';
    try {
      releases = parseCatalog(await (await fetchWithTimeout(CATALOG_URL)).json());

    } catch {
      const snapshot = await (await fetchWithTimeout('./catalog.json')).json();
      releases = snapshot.releases.filter(validRelease).sort((a, b) => compareVersions(b.gameVersion, a.gameVersion));
      if (!releases.length) throw new Error('The saved version catalog is empty.');

      warning = `The live catalog is unavailable. Using a saved list from ${snapshot.fetchedAt}; newer releases may be missing. Reload the page to try again.`;
    }
    state.releases = releases;
    const match = releases.find(item => item.gameVersion === previous || item.gameVersion.split('_')[0] === previous);
    state.release = match || releases[0];
    if (previous && !match) warning += `${warning ? ' ' : ''}Version ${previous.slice(0, 60)} isn’t in this catalog. Choose the version installed on your headset.`;
    requestedVersion = null;
    const select = $('game-version'); select.replaceChildren();
    for (const release of releases) {
      const option = document.createElement('option'); option.value = release.gameVersion;
      option.textContent = `${release.gameVersion.split('_')[0]}${release.gameVersion.includes('_') ? ' · build ' + release.gameVersion.split('_')[1] : ''}`;
      select.append(option);
    }
    select.value = state.release.gameVersion; message('catalog-warning', warning);
  } catch {

    message('catalog-warning', state.releases.length ? 'Could not load updated versions. Your previous selection is still available.' : 'Could not load live or saved versions. Check your connection and reload the page to try again.');
  } finally {
    state.loading = false; $('game-version').disabled = !state.releases.length; updatePreview();
  }
}

async function getCover() {
  if (!state.cover) state.cover = new Uint8Array(await (await fetchWithTimeout('./cover.png')).arrayBuffer());
  return state.cover;
}
function download(bytes, filename) {
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(new Blob([bytes], {type: 'application/qmod'}));
  const anchor = document.createElement('a'); anchor.href = state.objectUrl; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
}
async function copyText(text, statusId) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text); message(statusId, 'Link copied.');
  } catch {
    message(statusId, 'Clipboard unavailable. Copy the link below:');
    const field = document.createElement('input'); field.type = 'text'; field.readOnly = true; field.value = text;
    field.setAttribute('aria-label', 'Link to copy'); field.style.cssText = 'width:100%;margin-top:8px;padding:8px;font-size:11px';
    $(statusId).append(field); field.focus(); field.select();
  }
}
$('generator-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.building || state.loading) return;
  if (!checkUsername()) {$('username').focus(); return;}
  if (!state.release) {message('generation-status', 'Choose a supported game version first.', true); return;}
  const settings = options();
  state.building = true; updatePreview();
  const label = $('download-button').querySelector('span'); label.textContent = 'Building your package…';
  message('generation-status', 'Packing your configuration…');
  try {
    if (!window.JSZip) throw new Error('The ZIP library could not be loaded. Reload the page and try again.');
    const result = await buildQmod(settings, await getCover(), window.JSZip);
    download(result.bytes, result.filename); state.lastResult = result;
    $('download-result').hidden = false;
    $('result-filename').textContent = result.filename;
    $('reports-link').href = result.reportsUrl;
    message('report-copy-status', '');
    message('generation-status', `Package generated (${(result.bytes.byteLength / 1024).toFixed(1)} KB). Your download should begin now. You can download it again if needed.`);
    $('download-result').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center'});
  } catch (error) {
    message('generation-status', error.message || 'The package could not be generated. Please try again.', true);
  } finally {
    state.building = false; label.textContent = 'Download QMOD'; updatePreview();
  }
});
$('username').addEventListener('input', () => {if ($('username').getAttribute('aria-invalid') === 'true') checkUsername(); updatePreview(); message('copy-status', '');});
$('username').addEventListener('blur', () => {if ($('username').value) checkUsername();});
for (const id of ['full-crash', 'include-logs']) $(id).addEventListener('change', () => {updatePreview(); message('copy-status', '');});
$('game-version').addEventListener('change', () => {state.release = state.releases.find(item => item.gameVersion === $('game-version').value); updatePreview(); message('copy-status', '');});
$('copy-setup').addEventListener('click', () => {
  if (!checkUsername()) {$('username').focus(); return;}
  const url = new URL(location.href); url.search = ''; url.hash = '';
  const settings = options();
  url.searchParams.set('usr', settings.username); url.searchParams.set('version', settings.release.gameVersion);
  url.searchParams.set('fc', String(settings.fullCrash)); url.searchParams.set('log', String(settings.log));
  copyText(url.href, 'copy-status');
});
$('copy-reports').addEventListener('click', () => {if (state.lastResult) copyText(state.lastResult.reportsUrl, 'report-copy-status');});
window.addEventListener('pagehide', () => {if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);});
updatePreview(); loadCatalog();
