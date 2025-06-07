const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store();

// Userscript injection removed - using Vencord Web extension instead

let mainWindow;
let accounts = [];
let browserViews = new Map();
let sessionMap = new Map(); // Store session objects for each account

// Default accounts structure
const defaultAccounts = [
  { id: 'account1', name: 'Account 1', profilePicture: null, active: true },
  { id: 'account2', name: 'Account 2', profilePicture: null, active: false },
  { id: 'account3', name: 'Account 3', profilePicture: null, active: false }
];

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000, // Reduced minimum width for better compatibility
    minHeight: 600, // Reduced minimum height
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    autoHideMenuBar: true, // Hide menu bar
    show: false
  });

  // Remove menu bar completely
  mainWindow.setMenuBarVisibility(false);

  // Load the main renderer
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window resize to update BrowserView bounds
  mainWindow.on('resize', () => {
    updateBrowserViewBounds();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Initialize session for a single account
async function initializeSessionForAccount(account) {
  const partition = `persist:discord-${account.id}`;
  const ses = session.fromPartition(partition);
  
  // Store session reference for consistent use
  sessionMap.set(account.id, ses);
  
  console.log(`🔐 Initializing persistent session for account: ${account.name} (${partition})`);
  console.log(`💾 Session data will be saved to: ${ses.getStoragePath()}`);
  
  // Configure session settings for better persistence
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log(`🔐 Permission request for ${account.name}: ${permission}`);
    
    // Auto-grant safe permissions that Discord needs
    if (['notifications', 'media', 'microphone', 'camera', 'clipboard-read', 'clipboard-write'].includes(permission)) {
      console.log(`✅ Granted ${permission} for ${account.name}`);
      callback(true);
    } 
    // Explicitly deny WebAuthn/FIDO2/Passkey related permissions to prevent annoying prompts
    else if (['publickey-credentials-get', 'publickey-credentials-create', 'webauthn', 'fido', 'u2f'].includes(permission)) {
      console.log(`[WEBAUTHN-BLOCK] Blocked WebAuthn/Passkey permission: ${permission} for ${account.name}`);
      callback(false);
    }
    else {
      console.log(`❌ Denied ${permission} for ${account.name}`);
      callback(false);
    }
  });
  
  // Configure session settings to mimic real browser
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    // Use the most common Chrome user agent
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Remove all Electron-specific headers
    delete details.requestHeaders['electron'];
    delete details.requestHeaders['Electron'];
    delete details.requestHeaders['X-Electron'];
    
    // Add browser-like headers that Discord expects
    if (details.url.includes('discord.com')) {
      details.requestHeaders['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      details.requestHeaders['sec-ch-ua-mobile'] = '?0';
      details.requestHeaders['sec-ch-ua-platform'] = '"Windows"';
      details.requestHeaders['sec-fetch-dest'] = 'document';
      details.requestHeaders['sec-fetch-mode'] = 'navigate';
      details.requestHeaders['sec-fetch-site'] = 'none';
      details.requestHeaders['sec-fetch-user'] = '?1';
      details.requestHeaders['upgrade-insecure-requests'] = '1';
    }
    
    callback({ requestHeaders: details.requestHeaders });
  });

  // Set up CSP bypass - this is crucial for Discord
  ses.webRequest.onHeadersReceived((details, callback) => {
    if (details.responseHeaders['content-security-policy']) {
      delete details.responseHeaders['content-security-policy'];
    }
    if (details.responseHeaders['content-security-policy-report-only']) {
      delete details.responseHeaders['content-security-policy-report-only'];
    }
    if (details.responseHeaders['x-frame-options']) {
      delete details.responseHeaders['x-frame-options'];
    }
    callback({ responseHeaders: details.responseHeaders });
  });
  
  // Set user agent for the session
  ses.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Configure session storage settings for better persistence
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    // Block WebAuthn/Passkey related permission checks
    if (permission === 'publickey-credentials-get' || permission === 'publickey-credentials-create') {
      console.log(`[WEBAUTHN-BLOCK] Blocked WebAuthn permission check: ${permission}`);
      return false;
    }
    return true; // Allow all other permission checks
  });
  ses.setCertificateVerifyProc((request, callback) => {
    callback(0); // Accept all certificates for Discord domains
  });
  
  // Force session data to be written to disk immediately
  ses.cookies.on('changed', () => {
    // Cookies changed, data will be auto-saved
  });
  
  // Ensure persistent storage is enabled
  await ses.clearHostResolverCache(); // Clear any cached DNS that might interfere
  
  console.log(`💾 Session persistent storage enabled for ${account.name}`);
  
  // Load extensions for this specific session
  await loadExtensionsForSession(ses);
  
  console.log(`✅ Session initialized for ${account.name}`);
}

// Initialize session partitions for each account
async function initializeSessions() {
  // Load browser extensions to default session first
  await loadBrowserExtensions();
  
  // Initialize each account's persistent session
  for (const account of accounts) {
    await initializeSessionForAccount(account);
  }
}

// Load browser extensions (Vencord Web, etc.)
async function loadBrowserExtensions() {
  try {
    console.log('🔌 Loading browser extensions...');
    
    // Path to extensions directory
    const extensionsDir = path.join(__dirname, '..', 'extensions');
    const vencordWebPath = path.join(extensionsDir, 'vencord-web');
    const tampermonkeyPath = path.join(extensionsDir, 'tampermonkey');
    
    // Priority 1: Try to load Vencord Web extension (preferred)
    if (fs.existsSync(vencordWebPath)) {
      try {
        await session.defaultSession.extensions.loadExtension(vencordWebPath, {
          allowFileAccess: true
        });
        console.log('✅ Vencord Web extension loaded successfully');
        return; // Success, no need to try other extensions
      } catch (error) {
        console.log('⚠️ Failed to load Vencord Web extension:', error.message);
      }
    } else {
      console.log('⚠️ Vencord Web extension not found at:', vencordWebPath);
      console.log('💡 Run: npm run get-vencord-web for instructions');
    }
    
    // Fallback: Try Tampermonkey if Vencord Web not available
    if (fs.existsSync(tampermonkeyPath)) {
      try {
        await session.defaultSession.extensions.loadExtension(tampermonkeyPath, {
          allowFileAccess: true
        });
        console.log('✅ Tampermonkey extension loaded successfully (fallback)');
      } catch (error) {
        console.log('⚠️ Failed to load Tampermonkey extension:', error.message);
      }
    }
    
  } catch (error) {
    console.log('⚠️ Extension loading failed:', error.message);
  }
}

// Load extensions for individual sessions
async function loadExtensionsForSession(ses) {
  try {
    const extensionsDir = path.join(__dirname, '..', 'extensions');
    const vencordWebPath = path.join(extensionsDir, 'vencord-web');
    const tampermonkeyPath = path.join(extensionsDir, 'tampermonkey');
    
    // Priority 1: Vencord Web
    if (fs.existsSync(vencordWebPath)) {
      try {
        await ses.extensions.loadExtension(vencordWebPath, {
          allowFileAccess: true
        });
        console.log('✅ Vencord Web loaded for session');
        return; // Success, no need for fallback
      } catch (error) {
        console.log('⚠️ Failed to load Vencord Web for session:', error.message);
        console.log('💡 This might be due to Discord version compatibility issues');
      }
    }
    
    // Fallback: Tampermonkey
    if (fs.existsSync(tampermonkeyPath)) {
      try {
        await ses.extensions.loadExtension(tampermonkeyPath, {
          allowFileAccess: true
        });
        console.log('✅ Tampermonkey loaded for session (fallback)');
      } catch (error) {
        console.log('⚠️ Failed to load Tampermonkey for session:', error.message);
      }
    }
  } catch (error) {
    console.log('⚠️ Session extension loading failed:', error.message);
  }
}

// Load accounts from storage or use defaults
async function loadAccounts() {
  accounts = store.get('accounts', defaultAccounts);
  await initializeSessions();
}

// Save accounts to storage
function saveAccounts() {
  store.set('accounts', accounts);
}

// Create BrowserView for account
function createBrowserView(accountId) {
  console.log(`🔧 Creating BrowserView for account: ${accountId}`);
  
  // Get the stored session for this account, or create new one if not exists
  let persistentSession = sessionMap.get(accountId);
  if (!persistentSession) {
    console.log(`⚠️ Session not found for ${accountId}, creating new one`);
    persistentSession = session.fromPartition(`persist:discord-${accountId}`);
    sessionMap.set(accountId, persistentSession);
  }
  
  console.log(`📁 Using session partition: persist:discord-${accountId}`);
  
  const view = new BrowserView({
    webPreferences: {
      session: persistentSession, // Use the stored session object
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      // Additional flags to make it more browser-like
      backgroundThrottling: false,
      enableWebSQL: false,
      images: true,
      javascript: true,
      plugins: true,
      webgl: true,
      // Disable features that might trigger security checks and passkey prompts
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'AutomationControlled,WebAuthentication,CredentialManager,PublicKeyCredential'
    }
  });

  // Configure the view
  view.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Handle view events
  view.webContents.on('dom-ready', () => {
    console.log(`Discord DOM ready for account ${accountId}`);
    mainWindow.webContents.send('account-ready', accountId);
    
    // Add error handling and anti-detection measures
    view.webContents.executeJavaScript(`
      // Catch and log React errors without breaking Discord
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('proxyLazy')) {
          console.warn('🔧 Vencord compatibility issue detected:', event.error.message);
          event.preventDefault(); // Prevent the error from breaking Discord
          return false;
        }
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('proxyLazy')) {
          console.warn('🔧 Vencord promise rejection handled:', event.reason.message);
          event.preventDefault();
        }
      });
      
      // Anti-detection measures to make Electron appear as regular Chrome
      try {
        // Hide automation indicators
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Override plugins to look more like a real browser
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5] // Fake plugins array
        });
        
        // Override languages to be more realistic
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        
        // DISABLE WEBAUTHN/PASSKEY APIs to prevent annoying security prompts
        if (navigator.credentials) {
          // Completely remove WebAuthn support
          Object.defineProperty(navigator, 'credentials', {
            get: () => undefined,
            configurable: false
          });
          console.log('[WEBAUTHN-BLOCK] navigator.credentials API disabled - no more security key prompts!');
        }
        
        // Disable PublicKeyCredential if it exists
        if (window.PublicKeyCredential) {
          window.PublicKeyCredential = undefined;
          console.log('[WEBAUTHN-BLOCK] PublicKeyCredential API disabled');
        }
        
        // Also disable the credential management API
        if (window.CredentialsContainer) {
          window.CredentialsContainer = undefined;
          console.log('[WEBAUTHN-BLOCK] CredentialsContainer API disabled');
        }
        
        console.log('[WEBAUTHN-BLOCK] All WebAuthn/Passkey APIs have been blocked!');
        
        // Hide Electron process info
        if (window.process) {
          delete window.process;
        }
        if (window.require) {
          delete window.require;
        }
        if (window.global) {
          delete window.global;
        }
        
        console.log('🛡️ Anti-detection measures applied');
      } catch (error) {
        console.warn('⚠️ Failed to apply some anti-detection measures:', error.message);
      }
    `).catch(err => {
      console.log('⚠️ Failed to inject browser compatibility code:', err.message);
    });
    
    // Open DevTools for BrowserView in development mode
    if (process.argv.includes('--dev')) {
      view.webContents.openDevTools();
    }
  });

  // Discord finished loading
  view.webContents.on('did-finish-load', () => {
    console.log(`Discord finished loading for account ${accountId}`);
    console.log(`🔌 Extensions should auto-inject userscripts`);
    mainWindow.webContents.send('account-loaded', accountId);
    
    // Extract profile picture after Discord loads
    setTimeout(() => {
      extractProfilePicture(view, accountId);
      // Start monitoring voice status
      startVoiceStatusMonitoring(view, accountId);
    }, 3000); // Wait 3 seconds for Discord to fully load user data
  });

  view.webContents.on('did-start-loading', () => {
    console.log(`Loading Discord for account ${accountId}`);
    mainWindow.webContents.send('account-loading', accountId);
  });

  view.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load Discord for account ${accountId}:`, errorCode, errorDescription);
    mainWindow.webContents.send('account-error', accountId, errorDescription);
  });

  // Handle new window requests
  view.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load Discord
  view.webContents.loadURL('https://discord.com/app');
  
  browserViews.set(accountId, view);
  return view;
}

// Extract profile picture from Discord
async function extractProfilePicture(view, accountId) {
  try {
    console.log(`🖼️ Extracting profile picture for account ${accountId}`);
    
    const userAvatarUrl = await view.webContents.executeJavaScript(`
      (function() {
        try {
          // Wait for Discord to load and user to be authenticated
          if (!window.webpackChunkdiscord_app) {
            console.log('Discord not fully loaded yet, will retry...');
            return null;
          }
          
          // Try multiple methods to get the user avatar
          let avatarUrl = null;
          
          // Method 1: Try to get from user panel avatar
          const userPanelAvatar = document.querySelector('[class*="avatar"][class*="wrapper"] img');
          if (userPanelAvatar && userPanelAvatar.src && !userPanelAvatar.src.includes('default')) {
            avatarUrl = userPanelAvatar.src;
            console.log('Found avatar via user panel:', avatarUrl);
            return avatarUrl;
          }
          
          // Method 2: Try to get from settings avatar
          const settingsAvatar = document.querySelector('[class*="avatar"][class*="large"] img, [class*="avatar"][class*="size"] img');
          if (settingsAvatar && settingsAvatar.src && !settingsAvatar.src.includes('default')) {
            avatarUrl = settingsAvatar.src;
            console.log('Found avatar via settings:', avatarUrl);
            return avatarUrl;
          }
          
          // Method 3: Try to find any Discord CDN avatar images
          const allImages = document.querySelectorAll('img[src*="cdn.discordapp.com/avatars"]');
          for (const img of allImages) {
            if (img.src && !img.src.includes('default') && img.src.includes('cdn.discordapp.com/avatars')) {
              avatarUrl = img.src;
              console.log('Found avatar via CDN search:', avatarUrl);
              return avatarUrl;
            }
          }
          
          // Method 4: Try Discord's internal webpack modules (more advanced)
          try {
            const webpackModules = window.webpackChunkdiscord_app;
            if (webpackModules) {
              // Try to find user store
              let userStore = null;
              for (const chunk of webpackModules) {
                if (chunk && chunk[1]) {
                  for (const moduleId in chunk[1]) {
                    const module = chunk[1][moduleId];
                    if (module && module.toString().includes('getCurrentUser') && module.toString().includes('getUser')) {
                      try {
                        const moduleExports = {};
                        module(moduleExports, {}, { n: (e) => e });
                        if (moduleExports.Z && moduleExports.Z.getCurrentUser) {
                          userStore = moduleExports.Z;
                          break;
                        }
                      } catch (e) {
                        // Ignore module execution errors
                      }
                    }
                  }
                  if (userStore) break;
                }
              }
              
              if (userStore) {
                const currentUser = userStore.getCurrentUser();
                if (currentUser && currentUser.avatar) {
                  avatarUrl = \`https://cdn.discordapp.com/avatars/\${currentUser.id}/\${currentUser.avatar}.png?size=128\`;
                  console.log('Found avatar via Discord API:', avatarUrl);
                  return avatarUrl;
                }
              }
            }
          } catch (e) {
            console.log('Failed to extract via webpack modules:', e.message);
          }
          
          console.log('No avatar found, user might not be logged in yet');
          return null;
        } catch (error) {
          console.log('Error extracting profile picture:', error.message);
          return null;
        }
      })();
    `);

    if (userAvatarUrl && userAvatarUrl !== 'null') {
      console.log(`✅ Found profile picture for ${accountId}: ${userAvatarUrl}`);
      
      // Update account data
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        account.profilePicture = userAvatarUrl;
        saveAccounts();
        
        // Send to renderer
        mainWindow.webContents.send('profile-picture-updated', accountId, userAvatarUrl);
        console.log(`📤 Sent profile picture update to renderer for ${accountId}`);
      }
    } else {
      console.log(`⚠️ No profile picture found for ${accountId}, user might not be logged in`);
      
      // Retry after a longer delay if Discord is still loading
      setTimeout(() => {
        extractProfilePicture(view, accountId);
      }, 10000); // Retry after 10 seconds
    }
  } catch (error) {
    console.error(`❌ Failed to extract profile picture for ${accountId}:`, error.message);
  }
}

// Monitor voice status for account
async function startVoiceStatusMonitoring(view, accountId) {
  try {
    console.log(`🎤 Starting voice status monitoring for ${accountId}`);
    
    // Check voice status initially
    checkVoiceStatus(view, accountId);
    
    // Set up periodic monitoring every 5 seconds
    const monitoringInterval = setInterval(() => {
      checkVoiceStatus(view, accountId);
    }, 5000);
    
    // Store interval for cleanup if needed
    view.voiceMonitoringInterval = monitoringInterval;
    
  } catch (error) {
    console.error(`❌ Failed to start voice monitoring for ${accountId}:`, error.message);
  }
}

// Check current voice status
async function checkVoiceStatus(view, accountId) {
  try {
    const voiceStatus = await view.webContents.executeJavaScript(`
      (function() {
        try {
          // Method 1: Check for active voice connection panel with connected state
          const voicePanel = document.querySelector('[class*="panels"] [class*="container"][class*="actionsContainer"]');
          if (voicePanel) {
            // Look for specific "Connected to" text or disconnect button
            const connectedText = voicePanel.querySelector('[class*="channel"], [class*="connection"]');
            const disconnectButton = document.querySelector('[aria-label*="Disconnect"], [aria-label*="Leave"]');
            
            if (connectedText && connectedText.textContent && connectedText.textContent.trim() !== '' && disconnectButton) {
              const channelName = connectedText.textContent.trim();
              return {
                inVoice: true,
                channelName: channelName,
                method: 'voice-panel-connected'
              };
            }
          }
          
          // Method 2: Check for voice connection with call controls visible
          const callContainer = document.querySelector('[class*="callContainer"], [class*="voiceCallWrapper"]');
          if (callContainer && callContainer.style.display !== 'none') {
            const channelName = document.querySelector('[class*="title"][class*="channel"]')?.textContent?.trim() || 'Voice Channel';
            return {
              inVoice: true,
              channelName: channelName,
              method: 'call-container'
            };
          }
          
          // Method 3: Check for "Leave Voice Channel" or "Disconnect" button
          const leaveButton = document.querySelector('button[aria-label*="Disconnect"], button[aria-label*="Leave Voice"], button[aria-label*="Leave voice"]');
          if (leaveButton) {
            const channelInfo = document.querySelector('[class*="channel"][class*="voice"] [class*="name"], [class*="title"][class*="voice"]');
            const channelName = channelInfo?.textContent?.trim() || 'Voice Channel';
            return {
              inVoice: true,
              channelName: channelName,
              method: 'leave-button'
            };
          }
          
          // Method 4: Check for voice connection status in bottom panel
          const bottomPanel = document.querySelector('[class*="panels"] [class*="container"]');
          if (bottomPanel) {
            const voiceInfo = bottomPanel.querySelector('[class*="connection"], [class*="rtcConnection"]');
            const muteButton = bottomPanel.querySelector('[aria-label*="Mute"], [aria-label*="Unmute"]');
            const deafenButton = bottomPanel.querySelector('[aria-label*="Deafen"], [aria-label*="Undeafen"]');
            
            // Only consider connected if we have voice info AND both control buttons are present
            if (voiceInfo && muteButton && deafenButton && voiceInfo.textContent && voiceInfo.textContent.trim() !== '') {
              const channelName = voiceInfo.textContent.trim();
              // Make sure it's not just "Voice Connected" or generic text
              if (!channelName.includes('Voice Connected') && channelName.length > 5) {
                return {
                  inVoice: true,
                  channelName: channelName,
                  method: 'bottom-panel-connection'
                };
              }
            }
          }
          
          // Method 5: Check for "Connected to" text specifically
          const allElements = Array.from(document.querySelectorAll('*'));
          const connectedToElement = allElements.find(el => 
            el.textContent && el.textContent.includes('Connected to') && 
            el.children.length === 0 // Only text nodes, not containers
          );
          if (connectedToElement) {
            const channelName = connectedToElement.textContent.replace('Connected to', '').trim();
            if (channelName && channelName.length > 0) {
              return {
                inVoice: true,
                channelName: channelName,
                method: 'connected-to-text'
              };
            }
          }
          
          return {
            inVoice: false,
            channelName: null,
            method: 'not-connected'
          };
          
        } catch (error) {
          console.warn('Voice status check error:', error.message);
          return {
            inVoice: false,
            channelName: null,
            method: 'error',
            error: error.message
          };
        }
      })();
    `);
    
    // Update account voice status if changed
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      const previousStatus = account.inVoice || false;
      account.inVoice = voiceStatus.inVoice;
      account.voiceChannelName = voiceStatus.channelName;
      
      // Only send update if status changed
      if (previousStatus !== voiceStatus.inVoice) {
        console.log(`🎤 Voice status changed for ${accountId}: ${voiceStatus.inVoice ? 'Connected' : 'Disconnected'} ${voiceStatus.channelName ? `to ${voiceStatus.channelName}` : ''} (method: ${voiceStatus.method})`);
        saveAccounts();
        
        // Send to renderer
        mainWindow.webContents.send('voice-status-updated', accountId, {
          inVoice: voiceStatus.inVoice,
          channelName: voiceStatus.channelName
        });
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to check voice status for ${accountId}:`, error.message);
  }
}

// Helper function to update BrowserView bounds
function updateBrowserViewBounds() {
  const currentView = getCurrentBrowserView();
  if (!currentView || !mainWindow) return;
  
  const contentBounds = mainWindow.getContentBounds();
  // Get sidebar width from renderer or use default
  const sidebarWidth = global.sidebarWidth || 240;
  const resizeHandleWidth = 4;
  
  currentView.setBounds({
    x: sidebarWidth + resizeHandleWidth,
    y: 0,
    width: contentBounds.width - sidebarWidth - resizeHandleWidth,
    height: contentBounds.height
  });
  
  console.log(`📐 Updated BrowserView bounds: x=${sidebarWidth + resizeHandleWidth}, y=0, width=${contentBounds.width - sidebarWidth - resizeHandleWidth}, height=${contentBounds.height}`);
}

// Get currently active BrowserView
function getCurrentBrowserView() {
  const activeBrowserView = mainWindow?.getBrowserView();
  return activeBrowserView;
}

// Switch to BrowserView for account
function switchToBrowserView(accountId) {
  if (!mainWindow) return;

  // Hide all other views
  browserViews.forEach((view, id) => {
    if (id !== accountId) {
      mainWindow.removeBrowserView(view);
    }
  });

  // Show or create the requested view
  let view = browserViews.get(accountId);
  if (!view) {
    view = createBrowserView(accountId);
  }

  mainWindow.setBrowserView(view);
  
  // Set proper bounds immediately and add a small delay to ensure it takes effect
  setTimeout(() => {
    updateBrowserViewBounds();
  }, 100);
  
  console.log(`🔄 Switched to BrowserView for account: ${accountId}`);
}

// IPC handlers
ipcMain.handle('get-accounts', () => {
  return accounts;
});

ipcMain.handle('set-active-account', (event, accountId) => {
  accounts.forEach(account => {
    account.active = account.id === accountId;
  });
  saveAccounts();
  return accounts;
});

ipcMain.handle('add-account', async (event, accountData) => {
  const newAccount = {
    id: `account${Date.now()}`,
    name: accountData.name || `Account ${accounts.length + 1}`,
    profilePicture: accountData.profilePicture || null,
    active: false
  };
  accounts.push(newAccount);
  saveAccounts();
  
  // Initialize session for the new account
  await initializeSessionForAccount(newAccount);
  
  return accounts;
});

ipcMain.handle('remove-account', (event, accountId) => {
  const index = accounts.findIndex(acc => acc.id === accountId);
  if (index > -1) {
    accounts.splice(index, 1);
    
    // Clear session data and remove from map
    const ses = sessionMap.get(accountId);
    if (ses) {
      ses.clearStorageData();
      sessionMap.delete(accountId);
    }
    
    // Remove BrowserView if exists
    const view = browserViews.get(accountId);
    if (view) {
      if (mainWindow) {
        mainWindow.removeBrowserView(view);
      }
      browserViews.delete(accountId);
    }
    
    saveAccounts();
  }
  return accounts;
});

ipcMain.handle('update-account', (event, accountId, accountData) => {
  const account = accounts.find(acc => acc.id === accountId);
  if (account) {
    Object.assign(account, accountData);
    saveAccounts();
  }
  return accounts;
});

ipcMain.handle('switch-account', (event, accountId) => {
  switchToBrowserView(accountId);
  return true;
});

ipcMain.handle('reload-account', (event, accountId) => {
  const view = browserViews.get(accountId);
  if (view) {
    view.webContents.reload();
  }
  return true;
});

// Userscript reloading removed - using Vencord Web extension instead

// Add IPC handler for opening DevTools on current BrowserView
ipcMain.handle('open-devtools', () => {
  const currentView = getCurrentBrowserView();
  if (currentView) {
    currentView.webContents.openDevTools();
    return true;
  }
  return false;
});

// Add IPC handler for refreshing current account
ipcMain.handle('refresh-current-account', () => {
  const currentView = getCurrentBrowserView();
  if (currentView) {
    currentView.webContents.reload();
    return true;
  }
  return false;
});

// Add IPC handler for testing session persistence
ipcMain.handle('test-session-persistence', async () => {
  console.log('🧪 Testing session persistence...');
  
  const results = [];
  for (const [accountId, ses] of sessionMap) {
    try {
      const cookies = await ses.cookies.get({ domain: 'discord.com' });
      const hasSessionCookies = cookies.length > 0;
      
      results.push({
        accountId,
        cookieCount: cookies.length,
        hasSessionData: hasSessionCookies,
        storagePath: ses.getStoragePath()
      });
      
      console.log(`🍪 ${accountId}: ${cookies.length} cookies stored`);
    } catch (error) {
      console.log(`❌ Error checking ${accountId}:`, error.message);
      results.push({ accountId, error: error.message });
    }
  }
  
  return results;
});

// Add IPC handlers for hiding/showing BrowserView to prevent modal overlap
ipcMain.handle('hide-browser-view', () => {
  if (mainWindow) {
    const currentView = getCurrentBrowserView();
    if (currentView) {
      mainWindow.removeBrowserView(currentView);
      return true;
    }
  }
  return false;
});

ipcMain.handle('show-browser-view', () => {
  if (mainWindow) {
    const currentAccountId = accounts.find(acc => acc.active)?.id;
    if (currentAccountId) {
      const view = browserViews.get(currentAccountId);
      if (view) {
        mainWindow.setBrowserView(view);
        updateBrowserViewBounds();
        return true;
      }
    }
  }
  return false;
});

// Add IPC handler for updating sidebar width
ipcMain.handle('update-sidebar-width', (event, width) => {
  global.sidebarWidth = width;
  updateBrowserViewBounds();
  return true;
});

// App event handlers
app.whenReady().then(async () => {
  await loadAccounts();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Ensure session data is saved before app quits
app.on('before-quit', async (event) => {
  console.log('💾 Saving session data before quit...');
  
  // Prevent immediate quit to allow session saving
  event.preventDefault();
  
  try {
    // Force save all session data
    const savePromises = [];
    for (const [accountId, ses] of sessionMap) {
      console.log(`💾 Flushing session data for ${accountId}`);
      // Force cookies to be written to disk
      savePromises.push(ses.cookies.flushStore());
    }
    
    // Wait for all sessions to save
    await Promise.all(savePromises);
    console.log('✅ All session data saved successfully');
    
    // Now actually quit
    app.exit(0);
  } catch (error) {
    console.error('❌ Error saving session data:', error);
    app.exit(0); // Quit anyway
  }
});

// Handle certificate errors (for Discord's SSL)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
}); 