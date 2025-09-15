
# MultiCord

MultiCord is a multi‑account Discord client for Windows built on Electron. It provides isolated sessions per account and fast switching in a single desktop window.

![MultiCord Banner](https://raw.githubusercontent.com/Daziusm/Daziusm/refs/heads/main/Showcase.png)

## Features

- Multiple accounts with persistent, isolated sessions
- Quick account switching and automatic avatar extraction
- Optional support for Equicord and Vencord browser extensions
- Clean, responsive interface with compact account tabs
- Voice status indicators; context menu actions (rename, remove, clear session)
- WebAuthn/passkey prompts suppressed for smoother login

## Quick Start (Users)

Download an installer from Releases and run it:

- MultiCord (Equicord): `MultiCord-Equicord-Setup-x.y.z.exe`
- MultiCord (Vencord): `MultiCord-Vencord-Setup-x.y.z.exe`

## Quick Start (Developers)

```bash
git clone https://github.com/Daziusm/MultiCord.git
cd multicord
npm install

# (optional) download extensions used by the builds
npm run get-equicord-web
npm run get-vencord-web

# run with DevTools disabled by default
npm start
```

### Build

```bash
npm run build-equicord   # Equicord variant
npm run build-vencord    # Vencord variant
```
Outputs are placed in `dist/` as Windows NSIS installers.

## Scripts

```bash
npm start                 # Development run
npm run dev               # Development run with DevTools enabled
npm run pack              # Portable package
npm run pack-installer    # Portable + installer
npm run build-win         # Build (electron-builder)
```

## Technical Notes

- Electron 36.x, BrowserView per‑account architecture
- Session partitions: `persist:discord-{accountId}`
- IPC between main and renderer; Electron Store for persisted data

## Troubleshooting

- Discord won’t load → Clear session (right‑click account → Clear Session Data), then restart
- Avatars missing → Log in, then refresh the account
- Voice status not updating → Ensure you’re connected to a voice channel and refresh the account
- Installer problems → Run as Administrator or try the portable build

## Privacy

- Data is stored locally only
- No telemetry or data collection
- Accounts remain isolated from one another

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgments

Discord, Equicord, Vencord, Electron, and all contributors.

---

Repository: https://github.com/Daziusm/MultiCord

MultiCord is not affiliated with Discord Inc. “Discord” is a trademark of Discord Inc.
