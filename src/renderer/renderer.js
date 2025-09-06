const { ipcRenderer } = require('electron');

class MultiCordApp {
    constructor() {
        this.accounts = [];
        this.currentAccountId = null;
        this.contextMenuVisible = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupIpcListeners();
        await this.loadAccounts();
        this.renderAccounts();
        this.selectFirstAccount();

        // Initialize profile scale from localStorage
        const savedScale = localStorage.getItem('profileScale') || '1.0';
        this.updateProfileScale(parseFloat(savedScale));

        // Session test button moved to settings modal
    }

    setupEventListeners() {
        // Add account button
        document.getElementById('addAccountBtn').addEventListener('click', () => {
            this.showAddAccountModal();
        });

        // Modal close events
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideAddAccountModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddAccountModal();
        });

        // Save account button
        document.getElementById('saveAccountBtn').addEventListener('click', () => {
            this.addAccount();
        });

        // Modal background click to close
        document.getElementById('addAccountModal').addEventListener('click', (e) => {
            if (e.target.id === 'addAccountModal') {
                this.hideAddAccountModal();
            }
        });

        // Context menu events - only hide if clicking outside context menu and it's currently visible
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            // Only hide if the context menu is currently visible and the click is outside it
            if (contextMenu.classList.contains('show') && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        document.getElementById('renameAccount').addEventListener('click', () => {
            this.renameAccount();
        });

        document.getElementById('removeAccount').addEventListener('click', () => {
            this.removeAccount();
        });

        document.getElementById('clearSession').addEventListener('click', () => {
            this.clearSession();
        });

        document.getElementById('openDevTools').addEventListener('click', () => {
            this.openDevTools();
            this.hideContextMenu();
        });

        document.getElementById('refreshAccount').addEventListener('click', () => {
            this.refreshCurrentAccount();
            this.hideContextMenu();
        });

        // Settings button functionality
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Settings modal close events
        document.getElementById('settingsModalClose').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // Settings modal background click to close
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettingsModal();
            }
        });

        // Settings modal button events
        document.getElementById('testSessionsBtn').addEventListener('click', async () => {
            await this.testSessionPersistence();
        });

        document.getElementById('openMainDevToolsBtn').addEventListener('click', () => {
            this.openMainDevTools();
        });

        document.getElementById('clearAllSessionsBtn').addEventListener('click', () => {
            this.clearAllSessions();
        });

        document.getElementById('reloadAllAccountsBtn').addEventListener('click', () => {
            this.reloadAllAccounts();
        });

        // Profile scale control
        const profileScaleRange = document.getElementById('profileScaleRange');
        const scaleValue = document.getElementById('scaleValue');
        
        // Load saved scale from localStorage
        const savedScale = localStorage.getItem('profileScale') || '1.0';
        profileScaleRange.value = savedScale;
        this.updateProfileScale(parseFloat(savedScale));
        
        profileScaleRange.addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.updateProfileScale(scale);
            scaleValue.textContent = Math.round(scale * 100) + '%';
            // Save to localStorage
            localStorage.setItem('profileScale', scale.toString());
        });

        // Sidebar resize functionality
        this.setupSidebarResize();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAddAccountModal();
                this.hideContextMenu();
                this.hideSettingsModal();
            }
            
            // F12 or Ctrl+Shift+I to open DevTools for current account
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                this.openDevTools();
            }
            
            // F5 or Ctrl+R to refresh current account
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.refreshCurrentAccount();
            }
        });
    }

    setupIpcListeners() {
        // Listen for BrowserView events from main process
        ipcRenderer.on('account-loading', (event, accountId) => {
            if (accountId === this.currentAccountId) {
                this.showLoadingScreen();
            }
        });

        ipcRenderer.on('account-loaded', (event, accountId) => {
            if (accountId === this.currentAccountId) {
                // Small delay to ensure Discord is fully ready
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 1000);
            }
        });

        ipcRenderer.on('account-ready', (event, accountId) => {
            if (accountId === this.currentAccountId) {
                this.hideLoadingScreen();
            }
        });

        ipcRenderer.on('account-error', (event, accountId, error) => {
            console.error(`Account ${accountId} error:`, error);
            if (accountId === this.currentAccountId) {
                this.hideLoadingScreen();
                // Show error message or retry
                setTimeout(() => {
                    this.reloadAccount(accountId);
                }, 3000);
            }
        });

        // Listen for profile picture updates
        ipcRenderer.on('profile-picture-updated', (event, accountId, profilePictureUrl) => {
            console.log(`🖼️ Profile picture updated for ${accountId}:`, profilePictureUrl);
            this.updateAccountProfilePicture(accountId, profilePictureUrl);
        });

        // Listen for voice status updates
        ipcRenderer.on('voice-status-updated', (event, accountId, voiceData) => {
            console.log(`🎤 Voice status updated for ${accountId}:`, voiceData);
            this.updateAccountVoiceStatus(accountId, voiceData);
        });
    }

    async loadAccounts() {
        try {
            this.accounts = await ipcRenderer.invoke('get-accounts');
        } catch (error) {
            console.error('Failed to load accounts:', error);
            this.accounts = [];
        }
    }

    renderAccounts() {
        const accountsList = document.getElementById('accountsList');
        accountsList.innerHTML = '';

        this.accounts.forEach((account, index) => {
            const accountElement = this.createAccountElement(account, index);
            accountsList.appendChild(accountElement);
        });
    }

    createAccountElement(account, index) {
        const accountDiv = document.createElement('div');
        accountDiv.className = `account-item ${account.active ? 'active' : ''}`;
        accountDiv.dataset.accountId = account.id;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'account-avatar';
        
        if (account.profilePicture) {
            const img = document.createElement('img');
            img.src = account.profilePicture;
            img.alt = account.name;
            avatarDiv.appendChild(img);
        } else {
            // Use first letter of account name as fallback
            avatarDiv.textContent = account.name.charAt(0).toUpperCase();
        }
        
        // Add voice indicator if in voice
        if (account.inVoice) {
            const voiceIndicator = document.createElement('div');
            voiceIndicator.className = 'voice-indicator';
            voiceIndicator.title = `In voice: ${account.voiceChannelName || 'Voice Channel'}`;
            avatarDiv.appendChild(voiceIndicator);
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'account-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'account-name';
        nameDiv.textContent = account.name;

        const statusDiv = document.createElement('div');
        statusDiv.className = 'account-status';
        statusDiv.textContent = 'Ready'; // Always show 'Ready', voice status is shown via overlay

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(statusDiv);

        accountDiv.appendChild(avatarDiv);
        accountDiv.appendChild(infoDiv);

        // Click event to select account
        accountDiv.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectAccount(account.id);
        });

        // Right-click context menu
        accountDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, account.id);
        });
        return accountDiv;
    }

    async selectAccount(accountId) {
        try {
            // Update active account in main process
            this.accounts = await ipcRenderer.invoke('set-active-account', accountId);
            this.currentAccountId = accountId;
            
            // Update UI
            this.renderAccounts();
            
            // Switch to BrowserView for this account
            await ipcRenderer.invoke('switch-account', accountId);
            
            // Force update bounds to ensure proper alignment
            setTimeout(() => {
                ipcRenderer.invoke('update-browser-view-bounds');
            }, 200);
            
            // Hide welcome screen
            document.getElementById('welcomeScreen').classList.add('hidden');
            
            // Show loading screen while switching
            this.showLoadingScreen();
            
        } catch (error) {
            console.error('Failed to select account:', error);
        }
    }

    selectFirstAccount() {
        if (this.accounts.length > 0) {
            const activeAccount = this.accounts.find(acc => acc.active);
            if (activeAccount) {
                this.selectAccount(activeAccount.id);
            } else {
                // Show welcome screen if no active account
                document.getElementById('welcomeScreen').classList.remove('hidden');
            }
        } else {
            document.getElementById('welcomeScreen').classList.remove('hidden');
        }
    }

    async reloadAccount(accountId) {
        try {
            await ipcRenderer.invoke('reload-account', accountId);
        } catch (error) {
            console.error('Failed to reload account:', error);
        }
    }

    async openDevTools() {
        try {
            const success = await ipcRenderer.invoke('open-devtools');
            if (success) {
                console.log('🛠️ DevTools opened for current account');
            } else {
                console.warn('⚠️ No active account to open DevTools for');
            }
        } catch (error) {
            console.error('Failed to open DevTools:', error);
        }
    }

    async refreshCurrentAccount() {
        try {
            const success = await ipcRenderer.invoke('refresh-current-account');
            if (success) {
                console.log('🔄 Current account refreshed');
            } else {
                console.warn('⚠️ No active account to refresh');
            }
        } catch (error) {
            console.error('Failed to refresh current account:', error);
        }
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    showAddAccountModal() {
        const modal = document.getElementById('addAccountModal');
        modal.classList.add('show');
        // Hide BrowserView to prevent overlap
        ipcRenderer.invoke('hide-browser-view');
        document.getElementById('accountName').focus();
    }

    hideAddAccountModal() {
        const modal = document.getElementById('addAccountModal');
        modal.classList.remove('show');
        // Show BrowserView again
        ipcRenderer.invoke('show-browser-view').then(() => {
            // Ensure proper bounds after showing
            setTimeout(() => {
                ipcRenderer.invoke('update-browser-view-bounds');
            }, 100);
        });
        document.getElementById('accountName').value = '';
    }

    async addAccount() {
        const accountName = document.getElementById('accountName').value.trim();
        
        if (!accountName) {
            alert('Please enter an account name');
            return;
        }

        try {
            this.accounts = await ipcRenderer.invoke('add-account', {
                name: accountName
            });
            
            this.renderAccounts();
            this.hideAddAccountModal();
            
            // Select the new account
            const newAccount = this.accounts[this.accounts.length - 1];
            this.selectAccount(newAccount.id);
            
        } catch (error) {
            console.error('Failed to add account:', error);
            alert('Failed to add account');
        }
    }

    showContextMenu(event, accountId) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.dataset.accountId = accountId;
        
        // Position context menu in sidebar area to avoid overlapping with Discord
        const sidebarWidth = 240;
        const menuWidth = 160;
        const menuHeight = 200; // approximate
        
        let left = event.pageX;
        let top = event.pageY;
        
        // Keep menu within sidebar if possible
        if (left + menuWidth > sidebarWidth) {
            left = Math.max(10, sidebarWidth - menuWidth - 10);
        }
        
        // Adjust top if menu would go off screen
        if (top + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 10;
        }
        
        contextMenu.style.left = left + 'px';
        contextMenu.style.top = top + 'px';
        contextMenu.classList.add('show');
        // Don't hide BrowserView - let context menu show in sidebar area
        this.contextMenuVisible = true;
    }

    hideContextMenu() {
        if (this.contextMenuVisible) {
            document.getElementById('contextMenu').classList.remove('show');
            // No need to show/hide BrowserView since we're not hiding it
            this.contextMenuVisible = false;
        }
    }

    async renameAccount() {
        const contextMenu = document.getElementById('contextMenu');
        const accountId = contextMenu.dataset.accountId;
        const account = this.accounts.find(acc => acc.id === accountId);
        
        if (!account) return;
        
        const newName = prompt('Enter new account name:', account.name);
        if (newName && newName.trim() && newName.trim() !== account.name) {
            try {
                this.accounts = await ipcRenderer.invoke('update-account', accountId, {
                    name: newName.trim()
                });
                this.renderAccounts();
            } catch (error) {
                console.error('Failed to rename account:', error);
                alert('Failed to rename account');
            }
        }
        
        this.hideContextMenu();
    }

    async removeAccount() {
        const contextMenu = document.getElementById('contextMenu');
        const accountId = contextMenu.dataset.accountId;
        const account = this.accounts.find(acc => acc.id === accountId);
        
        if (!account) return;
        
        const confirmed = confirm(`Are you sure you want to remove "${account.name}"? This will also clear all session data.`);
        if (confirmed) {
            try {
                this.accounts = await ipcRenderer.invoke('remove-account', accountId);
                this.renderAccounts();
                
                // If we removed the current account, select another one
                if (this.currentAccountId === accountId) {
                    this.currentAccountId = null;
                    this.selectFirstAccount();
                }
                
            } catch (error) {
                console.error('Failed to remove account:', error);
                alert('Failed to remove account');
            }
        }
        
        this.hideContextMenu();
    }

    async clearSession() {
        const contextMenu = document.getElementById('contextMenu');
        const accountId = contextMenu.dataset.accountId;
        const account = this.accounts.find(acc => acc.id === accountId);
        
        if (!account) return;
        
        const confirmed = confirm(`Clear session data for "${account.name}"? You will need to log in again.`);
        if (confirmed) {
            try {
                // Clear session data in main process
                await ipcRenderer.invoke('remove-account', accountId);
                this.accounts = await ipcRenderer.invoke('add-account', {
                    name: account.name,
                    profilePicture: account.profilePicture
                });
                
                this.renderAccounts();
                
                // If this was the current account, switch to it to reload
                if (this.currentAccountId === accountId) {
                    this.selectAccount(accountId);
                }
                
            } catch (error) {
                console.error('Failed to clear session:', error);
                alert('Failed to clear session');
            }
        }
        
        this.hideContextMenu();
    }

    // Settings Modal Methods
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
        // Hide BrowserView to prevent overlap
        ipcRenderer.invoke('hide-browser-view');
        this.updateSettingsInfo();
    }

    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        // Show BrowserView again
        ipcRenderer.invoke('show-browser-view').then(() => {
            // Ensure proper bounds after showing
            setTimeout(() => {
                ipcRenderer.invoke('update-browser-view-bounds');
            }, 100);
        });
    }

    async updateSettingsInfo() {
        try {
            // Update session count
            document.getElementById('sessionCount').textContent = this.accounts.length;
            
            // Test session persistence and update Vencord status
            const results = await ipcRenderer.invoke('test-session-persistence');
            const vencordWorking = results.some(r => r.cookieCount > 0);
            document.getElementById('vencordStatus').textContent = vencordWorking ? 'Working ✅' : 'No sessions ⚠️';
            
        } catch (error) {
            console.error('Failed to update settings info:', error);
            document.getElementById('vencordStatus').textContent = 'Error ❌';
        }
    }

    async testSessionPersistence() {
        try {
            console.log('🧪 Testing session persistence...');
            const results = await ipcRenderer.invoke('test-session-persistence');
            console.log('🧪 Session test results:', results);
            
            let message = 'Session Test Results:\n\n';
            results.forEach(result => {
                if (result.error) {
                    message += `❌ ${result.accountId}: Error - ${result.error}\n`;
                } else {
                    message += `${result.hasSessionData ? '✅' : '⚠️'} ${result.accountId}: ${result.cookieCount} cookies\n`;
                }
            });
            
            alert(message + '\nCheck console for detailed info');
            this.updateSettingsInfo();
            
        } catch (error) {
            console.error('Failed to test sessions:', error);
            alert('Failed to test session persistence');
        }
    }

    openMainDevTools() {
        // This opens DevTools for the main renderer window
        const { webContents } = require('electron').remote.getCurrentWindow();
        webContents.openDevTools();
        console.log('🛠️ Main window DevTools opened');
    }

    async clearAllSessions() {
        const confirmed = confirm('⚠️ Clear ALL session data for ALL accounts?\n\nThis will log out all accounts and you will need to log in again.');
        
        if (confirmed) {
            try {
                // Clear sessions for all accounts
                for (const account of this.accounts) {
                    await ipcRenderer.invoke('remove-account', account.id);
                    await ipcRenderer.invoke('add-account', {
                        name: account.name,
                        profilePicture: account.profilePicture
                    });
                }
                
                await this.loadAccounts();
                this.renderAccounts();
                this.selectFirstAccount();
                
                alert('✅ All sessions cleared successfully!');
                this.hideSettingsModal();
                
            } catch (error) {
                console.error('Failed to clear all sessions:', error);
                alert('❌ Failed to clear some sessions');
            }
        }
    }

    async reloadAllAccounts() {
        try {
            for (const account of this.accounts) {
                await ipcRenderer.invoke('reload-account', account.id);
            }
            console.log('🔄 All accounts reloaded');
            alert('✅ All accounts reloaded successfully!');
        } catch (error) {
            console.error('Failed to reload all accounts:', error);
            alert('❌ Failed to reload some accounts');
        }
    }

    // Update account profile picture
    updateAccountProfilePicture(accountId, profilePictureUrl) {
        // Update account data
        const account = this.accounts.find(acc => acc.id === accountId);
        if (account) {
            account.profilePicture = profilePictureUrl;
            
            // Update UI
            this.renderAccounts();
        }
    }

    // Listen for voice status updates
    updateAccountVoiceStatus(accountId, voiceData) {
        // Update account data
        const account = this.accounts.find(acc => acc.id === accountId);
        if (account) {
            account.inVoice = voiceData.inVoice;
            account.voiceChannelName = voiceData.channelName;
            
            // Update UI
            this.renderAccounts();
        }
    }

    // Profile scale control
    updateProfileScale(scale) {
        // Update CSS variable
        document.documentElement.style.setProperty('--profile-scale', scale.toString());
        
        // Update scale value display
        const scaleValue = document.getElementById('scaleValue');
        if (scaleValue) {
            scaleValue.textContent = Math.round(scale * 100) + '%';
        }
        
        console.log(`📏 Profile scale updated to: ${Math.round(scale * 100)}%`);
    }

    // Sidebar resize functionality
    setupSidebarResize() {
        const resizeHandle = document.getElementById('resizeHandle');
        const sidebar = document.getElementById('sidebar');
        const appContainer = document.querySelector('.app-container');
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        // Load saved width from localStorage
        const savedWidth = localStorage.getItem('sidebarWidth') || '240';
        this.updateSidebarWidth(parseInt(savedWidth));
        
        // Send initial width to main process
        setTimeout(() => {
            ipcRenderer.invoke('update-sidebar-width', parseInt(savedWidth));
        }, 100);
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            
            appContainer.classList.add('resizing');
            document.body.style.cursor = 'ew-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            
            // Constrain width between min and max
            const minWidth = 90; // Minimum resize limit
            const maxWidth = 400;
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            
            this.updateSidebarWidth(clampedWidth);
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                appContainer.classList.remove('resizing');
                document.body.style.cursor = '';
                
                // Save width to localStorage
                const currentWidth = sidebar.offsetWidth;
                localStorage.setItem('sidebarWidth', currentWidth.toString());
                
                // Update BrowserView bounds
                setTimeout(() => {
                    ipcRenderer.invoke('update-sidebar-width', currentWidth);
                }, 100);
                
                console.log(`📐 Sidebar resized to: ${currentWidth}px`);
            }
        });
        
        // Handle double-click to reset to default width
        resizeHandle.addEventListener('dblclick', () => {
            this.updateSidebarWidth(240);
            localStorage.setItem('sidebarWidth', '240');
            setTimeout(() => {
                ipcRenderer.invoke('update-sidebar-width', 240);
            }, 100);
        });
    }
    
    updateSidebarWidth(width) {
        document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
        
        // Add/remove narrow class based on width
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            if (width <= 120) {
                sidebar.classList.add('narrow');
            } else {
                sidebar.classList.remove('narrow');
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MultiCordApp();
}); 