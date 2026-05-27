# IOL Power Calculator

Standalone desktop app for IOL power evaluation during cataract surgery planning. Built with **Electron**, **Vue 3**, **Vite**, and **SQLite** (`better-sqlite3`), following the same stack as [operation-eye](https://github.com/hartonoda-git/operation-eye) (SmartIOL).

Inspired by the legacy FileMaker **0 valutazione.exe** workflow: patient list, per-eye evaluation, biometry, keratometry, and multi-formula IOL power recording.

## Features

- Patient registry (name, date of birth, gender)
- IOL evaluations per eye (OD/OS) with date
- BCDVA, keratometry (auto-calculated K mean, cylinder, K2 axis), biometry (AL, ACD, LT)
- IOL power tables: spherical (EVO 2.0, Hoffer QST, Kane, PEARL-DGS), toric, post-LVC
- Built-in **SRK-II** estimate and mean of entered spherical formulas
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

Output appears under `out/make/`.

## Database

- Primary: `iol_evaluations.sqlite` next to the `.exe` (when writable)
- Backup: `%APPDATA%/IOL Power Calculator/database/iol_evaluations.sqlite`

## Notes

- Modern formulas (EVO, Kane, etc.) are entered manually from external calculators, as in SmartIOL. SRK-II is provided as a quick reference only—not a substitute for validated clinical formulas.

## License

MIT
