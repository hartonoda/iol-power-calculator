# IOL Power Calculator

TODO
- i calcoli che si devono fare sono nella lista in sezione iol sferica, torica, post lc, serve fare calcolo automatico e residuo
- nel CSO mancava astigmatismo totalle con asse

Standalone desktop app for IOL power evaluation during cataract surgery planning. Built with **Electron**, **Vue 3**, **Vite**, and **SQLite** (`better-sqlite3`), following the same stack as [operation-eye](https://github.com/hartonoda-git/operation-eye) (SmartIOL).

Inspired by the legacy FileMaker **0 valutazione.exe** workflow: patient list, per-eye evaluation, biometry, keratometry, and multi-formula IOL power recording.

## Features

- Patient registry (name, date of birth, gender)
- IOL evaluations per eye (OD/OS) with date
- BCDVA, keratometry (auto-calculated K mean, cylinder, K2 axis), biometry (AL, ACD, LT)
- IOL power tables: spherical (EVO 2.0, Hoffer QST, Kane, PEARL-DGS), toric, post-LVC
- IOL model catalog with custom models
- SQLite database beside the executable (with AppData backup)
- Print via system dialog

## Requirements

- Node.js 18+
- Windows (primary target; Electron also supports macOS/Linux builds)

## Development

```bash
npm install
npm start
```

## Build installer (Windows)

```bash
npm run make
```

Output appears under `out/make/` (Squirrel installer) and `out/IOL Power Calculator-win32-x64v{version}.zip` (portable folder, same workflow as SmartIOL).

For another computer, prefer the **portable zip**: unzip anywhere and run `IOL Power Calculator.exe`. The Squirrel `Setup.exe` also works, but some PCs block unsigned installers.

If startup fails, check `%APPDATA%/IOL Power Calculator/startup-error.log`.

## Versioning

The app version (`vX.Y.Z` in the sidebar) comes from `package.json`. A pre-commit hook bumps the patch number on every commit. Hooks are installed automatically via `npm install` (`prepare` script). To skip a bump once, use `SKIP_VERSION_BUMP=1 git commit`.

## Database

- Primary: `iol_evaluations.sqlite` next to the `.exe` (when writable)
- Backup: `%APPDATA%/IOL Power Calculator/database/iol_evaluations.sqlite`

## License

MIT
