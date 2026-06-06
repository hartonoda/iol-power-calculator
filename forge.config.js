const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const iconBase = path.join(__dirname, 'src', 'assets', 'img', 'logo');

module.exports = {
  packagerConfig: {
    asar: true,
    prune: true,
    icon: iconBase,
    extraResource: [
      path.join(__dirname, 'src', 'config', 'ocularParameterRules.json'),
      path.join(__dirname, 'src', 'config', 'iolSuitabilityRules.json'),
    ],
    ignore: (file) => {
      if (!file) return false;
      const normalized = file.replaceAll('\\', '/').toLowerCase();
      if (normalized.includes('.sqlite') || normalized.endsWith('-wal') || normalized.endsWith('-shm')) {
        return true;
      }
      const keep = file.startsWith('/.vite') || file.startsWith('/node_modules');
      return !keep;
    },
  },
  rebuildConfig: {
    onlyModules: ['better-sqlite3'],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: `file://${path.join(__dirname, 'src', 'assets', 'img', 'logo.ico').replace(/\\/g, '/')}`,
        setupIcon: path.join(__dirname, 'src', 'assets', 'img', 'logo.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
