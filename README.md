
# MultiCord

A multi-account Discord client built with Electron. Manage multiple accounts with isolated sessions and quick switching in a single desktop app.

MultiCord allows you to seamlessly switch between multiple Discord accounts in a single, elegant application. Perfect for managing personal, work, and community Discord accounts without the hassle of constant logging in and out.

![MultiCord Banner](https://raw.githubusercontent.com/Daziusm/Daziusm/refs/heads/main/Showcase.png)

## ✨ Features

### Multi-Account Management
- **Unlimited Accounts**: Add and manage multiple Discord accounts
- **Session Isolation**: Each account runs in its own session with persistent login
- **Quick Switching**: One-click account switching with visual indicators
- **Profile Pictures**: Automatic extraction and display of account avatars

### Interface
- **Resizable Sidebar**: Drag to resize from 90px to 400px width
- **Responsive Design**: Sidebar adapts to show icons only when narrow
- **Clean UI**: No menu bar clutter - just your Discord accounts
- **Voice Status**: Real-time voice chat indicators with speaker icons

### Advanced Features
- **Context Menus**: Right-click accounts for rename, remove, and session management
- **Dual Extension Support**: Built-in support for both Equicord and Vencord browser extensions
- **Auto-Updates**: Modern installer with update support
- **Persistent Sessions**: Stay logged in across application restarts
- **DevTools Access**: F12 for debugging and development

### Performance & Security
- **BrowserView Architecture**: Each account runs in isolated browser instances
- **WebAuthn Blocking**: Prevents annoying Windows Security prompts
- **Session Persistence**: Secure storage of login sessions
- **Memory Efficient**: Optimized for multiple concurrent Discord sessions

## 📥 Installation

### For Users (Recommended)
Choose your preferred Discord enhancement extension:

**🎨 MultiCord (Equicord)**
- Download: `MultiCord-Equicord-Setup-v1.0.0.exe` from releases
- Features: Equicord extension (fork of Vencord with additional features)
- Best for: Users who want the latest Discord enhancements

**🎭 MultiCord (Vencord)**  
- Download: `MultiCord-Vencord-Setup-v1.0.0.exe` from releases
- Features: Vencord extension (original Discord mod)
- Best for: Users who prefer the original Vencord experience

**Installation Steps:**
1. Download your preferred version from the releases
2. Run the installer and follow the setup wizard
3. Choose your installation path and shortcut preferences
4. Launch MultiCord from Start Menu or Desktop

### For Developers
```bash
# Clone the repository
git clone https://github.com/Daziusm/MultiCord.git
cd multicord

# Install dependencies
npm install

# Install browser extensions (optional)
npm run get-equicord-web    # For Equicord build
npm run get-vencord-web     # For Vencord build

# Run in development mode
npm run dev
```

## 🎮 Usage

### Adding Accounts
1. Click the **"+"** button in the sidebar
2. Enter a name for your account (e.g., "Work", "Gaming", "Community")
3. Click **"Add Account"**
4. The account will appear in the sidebar - click it to log in

### Managing Accounts
- **Switch Accounts**: Click any account in the sidebar
- **Rename Account**: Right-click → "Rename Account"
- **Remove Account**: Right-click → "Remove Account"
- **Clear Session**: Right-click → "Clear Session Data"

### Keyboard Shortcuts
- **F12**: Open DevTools for current account
- **Ctrl+R**: Refresh current account
- **Ctrl+Shift+R**: Refresh all accounts

## 🛠️ Development

### Project Structure
```
multicord/
├── src/
│   ├── main.js              # Electron main process
│   ├── renderer/            # UI and frontend logic
│   │   ├── index.html       # Main window HTML
│   │   ├── renderer.js      # Frontend JavaScript
│   │   └── styles.css       # Application styles
│   └── assets/              # Icons and images
├── extensions/              # Browser extensions (Equicord & Vencord)
├── dist/                    # Build outputs
└── build-installer.js       # Installer configuration
```

### Available Scripts
```bash
# Development
npm start                    # Run in development mode
npm run dev                 # Run with DevTools enabled

# Building
npm run pack               # Create portable version
npm run pack-installer     # Create installer
npm run build-win         # Build for Windows (electron-builder)

# Extension-specific builds
npm run build-equicord     # Build MultiCord with Equicord extension
npm run build-vencord      # Build MultiCord with Vencord extension
npm run build-both         # Build both versions

# Extensions
npm run get-equicord-web   # Download Equicord Web extension
npm run get-vencord-web    # Download Vencord Web extension
npm run get-tampermonkey   # Download Tampermonkey extension

# Icon Tools
node convert-icon.js       # Convert PNG to ICO format
```

### Technical Details

**Built With:**
- **Electron 36.4.0** - Cross-platform desktop framework
- **BrowserView API** - Isolated browser instances for accounts
- **Session Partitions** - Secure account separation
- **Electron Store** - Persistent configuration storage
- **Electron Winstaller** - Professional Windows installer

**Architecture:**
- Each Discord account runs in its own `BrowserView` with isolated sessions
- Session partitions use the format: `persist:discord-{accountId}`
- IPC communication between main and renderer processes
- Persistent storage for account data and user preferences

## Roadmap

- [ ] **Themes**: Dark/Light theme switching
- [ ] **Notifications**: Desktop notifications from all accounts
- [ ] **Quick Actions**: Keyboard shortcuts for common actions
- [ ] **Account Groups**: Organize accounts into categories
- [ ] **Export/Import**: Backup and restore account configurations
- [ ] **Linux Support**: AppImage distribution
- [ ] **macOS Support**: DMG distribution
- [ ] **Auto-Start**: Launch with Windows startup

## Troubleshooting

### Common Issues

**Discord won't load:**
- Clear session data: Right-click account → "Clear Session Data"
- Restart the application
- Check your internet connection

**Profile pictures not showing:**
- Profile pictures are extracted automatically after login
- Try refreshing the account: Right-click → "Reload Account"

**Voice status not updating:**
- Voice detection works in real-time
- Ensure you're in a voice channel in Discord
- Restart the account if needed

**Installation issues:**
- Run installer as Administrator if needed
- Disable antivirus temporarily during installation
- Use the portable version as alternative

### Getting Help

1. Check the [Issues](https://github.com/Daziusm/MultiCord/issues) page
2. Create a new issue with detailed information
3. Include your operating system and MultiCord version

## Privacy & Security

- **Local Storage Only**: All data stored locally on your device
- **No Data Collection**: MultiCord doesn't collect or transmit user data
- **Session Isolation**: Accounts are completely isolated from each other
- **Open Source**: Full source code available for audit

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Discord** - For the amazing platform
- **Equicord** - For the excellent Discord enhancement extension
- **Electron** - For making cross-platform development possible
- **Contributors** - Thanks to everyone who helps improve MultiCord

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

# Building
npm run pack               # Create portable version
npm run pack-installer     # Create installer
npm run build-win         # Build for Windows (electron-builder)

# Extensions
npm run get-equicord-web   # Download Equicord Web extension
npm run get-vencord-web    # Download Vencord Web extension
npm run get-tampermonkey   # Download Tampermonkey extension

# Icon Tools
```
node convert-icon.js       # Convert PNG to ICO format
```

### Technical Details

**Built With:**
- **Electron 36.4.0** - Cross-platform desktop framework
- **BrowserView API** - Isolated browser instances for accounts
- **Session Partitions** - Secure account separation
- **Electron Store** - Persistent configuration storage
- **Electron Winstaller** - Professional Windows installer

**Architecture:**
- Each Discord account runs in its own `BrowserView` with isolated sessions
- Session partitions use the format: `persist:discord-{accountId}`
- IPC communication between main and renderer processes
- Persistent storage for account data and user preferences

## 🎯 Roadmap

- [ ] **Themes**: Dark/Light theme switching
- [ ] **Notifications**: Desktop notifications from all accounts
- [ ] **Quick Actions**: Keyboard shortcuts for common actions
- [ ] **Account Groups**: Organize accounts into categories
- [ ] **Export/Import**: Backup and restore account configurations
- [ ] **Linux Support**: AppImage distribution
- [ ] **macOS Support**: DMG distribution
- [ ] **Auto-Start**: Launch with Windows startup

## 🐛 Troubleshooting

### Common Issues

**Discord won't load:**
- Clear session data: Right-click account → "Clear Session Data"
- Restart the application
- Check your internet connection

**Profile pictures not showing:**
- Profile pictures are extracted automatically after login
- Try refreshing the account: Right-click → "Reload Account"

**Voice status not updating:**
- Voice detection works in real-time
- Ensure you're in a voice channel in Discord
- Restart the account if needed

**Installation issues:**
- Run installer as Administrator if needed
- Disable antivirus temporarily during installation
- Use the portable version as alternative

### Getting Help

1. Check the [Issues](https://github.com/Daziusm/MultiCord/issues) page
2. Create a new issue with detailed information
3. Include your operating system and MultiCord version

## 🔒 Privacy & Security

- **Local Storage Only**: All data stored locally on your device
- **No Data Collection**: MultiCord doesn't collect or transmit user data
- **Session Isolation**: Accounts are completely isolated from each other
- **Open Source**: Full source code available for audit

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Discord** - For the amazing platform
- **Equicord** - For the excellent Discord enhancement extension
- **Electron** - For making cross-platform development possible
- **Contributors** - Thanks to everyone who helps improve MultiCord

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 🌐 GitHub Repository

**Repository**: [https://github.com/Daziusm/MultiCord](https://github.com/Daziusm/MultiCord)

### 📦 Releases
- **MultiCord (Equicord)**: Latest version with Equicord extension
- **MultiCord (Vencord)**: Latest version with Vencord extension
- **Source Code**: Fully open source and available for contribution

### 🔄 Updating GitHub
```bash
npm run update-github  # Commit and push all changes to GitHub
```

---

Made for the Discord community / synant

*MultiCord is not affiliated with Discord Inc. Discord is a trademark of Discord Inc.*
