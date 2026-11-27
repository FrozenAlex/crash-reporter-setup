export const CATALOG_URL = 'https://mods.bsquest.xyz/mods.json';
export const UPLOAD_URL = 'https://analyze.aeternal.dev/api/upload';
export const CONFIG_PATH = 'sdcard/ModData/com.beatgames.beatsaber/Configs/CrashReporter.json';

export function compareVersions(a, b) {
  const split = value => String(value).split(/[._-]/);
  const aa = split(a), bb = split(b);
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    const x = aa[i] ?? '0', y = bb[i] ?? '0';
    const d = /^\d+$/.test(x) && /^\d+$/.test(y) ? Number(x) - Number(y) : x.localeCompare(y);
    if (d) return d;
  }
  return 0;
}

export function validRelease(release) {
  if (!release || !/^\d+\.\d+\.\d+(?:_\d+)?$/.test(release.gameVersion)) return false;
  if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(release.version)) return false;
  if (!['Scotland2', 'QuestLoader'].includes(release.modloader)) return false;
  try {
    const url = new URL(release.download);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname.endsWith('.qmod');
  } catch { return false; }
}

export function parseCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) throw new Error('The version catalog has an unexpected format.');
  const releases = [];
  for (const [gameVersion, mods] of Object.entries(catalog)) {
    if (!Array.isArray(mods)) continue;
    const matches = mods.filter(mod => mod && mod.id === 'crashreporter').map(mod => ({
      gameVersion, version: mod.version, modloader: mod.modloader || 'QuestLoader', download: mod.download
    })).filter(validRelease).sort((a, b) => compareVersions(b.version, a.version));
    if (matches.length) releases.push(matches[0]);
  }
  if (!releases.length) throw new Error('No compatible CrashReporter releases were found.');
  return releases.sort((a, b) => compareVersions(b.gameVersion, a.gameVersion));
}

export function validateUsername(value) {
  if (!value) return 'Enter a username to label your crash reports.';
  if (!/^[A-Za-z0-9_]+$/.test(value)) return 'Use only letters, numbers, and underscores.';
  if (value.length > 64) return 'Keep your username to 64 characters or fewer.';
  return '';
}

export function parseBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === '') return fallback;
  if (/^(false|0|no|off)$/i.test(value)) return false;
  if (/^(true|1|yes|on)$/i.test(value)) return true;
  return fallback;
}

export function makePackage({username, release, fullCrash = true, log = true, date = new Date()}) {
  const error = validateUsername(username);
  if (error) throw new Error(error);
  if (!validRelease(release)) throw new Error('Choose a supported game version.');
  if (typeof fullCrash !== 'boolean' || typeof log !== 'boolean') throw new Error('Report settings must be true or false.');
  const config = {Enabled: true, FullCrash: fullCrash, Log: log, UserId: username, Url: UPLOAD_URL};
  const manifest = {
    _QPVersion: '0.1.1', name: 'CrashReporter AutoConfig', id: 'cr_gen', author: 'Crash Reporter Setup',
    version: `${date.getFullYear() % 100}.${date.getMonth() + 1}.${date.getDate()}`,
    packageId: 'com.beatgames.beatsaber', packageVersion: release.gameVersion,
    description: `Automatic CrashReporter configuration for ${username}. Generated with Crash Reporter Setup.`,
    coverImage: 'cover.png', modloader: release.modloader,
    dependencies: [{version: release.version, id: 'crashreporter', downloadIfMissing: release.download}],
    fileCopies: [{name: 'CrashReporter.json', destination: CONFIG_PATH}], copyExtensions: []
  };
  return {config, manifest, filename: `CrashReporterAutoConfig_${release.gameVersion.split('_')[0]}_${username}.qmod`,
    reportsUrl: `https://analyze.aeternal.dev/crashes/?userId=${encodeURIComponent(username)}`};
}

export async function buildQmod(options, cover, Zip) {
  if (!cover || !cover.byteLength) throw new Error('The package artwork could not be loaded. Please retry.');
  const result = makePackage(options);
  const zip = new Zip();
  zip.file('mod.json', JSON.stringify(result.manifest, null, 2));
  zip.file('CrashReporter.json', JSON.stringify(result.config, null, 2));
  zip.file('cover.png', cover);
  const bytes = await zip.generateAsync({type: 'uint8array', compression: 'DEFLATE', compressionOptions: {level: 6}});
  return {...result, bytes};
}
