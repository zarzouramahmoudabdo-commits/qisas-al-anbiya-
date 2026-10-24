const esbuild = require('esbuild');
const path = require('path');

async function main() {
  const entry = path.resolve('tools/tts-bridge-entry.js');
  const outfile = path.resolve('www/tts-bridge.js');

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    outfile,
    logLevel: 'info'
  });

  console.log('نجح بناء جسر النطق:', outfile);
}

main().catch((error) => {
  console.error('فشل بناء جسر النطق:', error);
  process.exitCode = 1;
});
