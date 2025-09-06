const electronInstaller = require('electron-winstaller');
const fs = require('fs');
const path = require('path');

async function buildInstaller() {
  console.log('🚀 Building Advanced Windows Installer...');
  
  try {
    // Check if icon exists
    const iconPath = './src/assets/icon.ico';
    const hasIcon = fs.existsSync(iconPath);
    
    console.log(`📦 Packaging MultiCord v1.0.0`);
    console.log(`🎨 Using icon: ${hasIcon ? '✅ Found' : '❌ Not found'}`);
    
    await electronInstaller.createWindowsInstaller({
      // Core settings
      appDirectory: './dist/MultiCord-win32-x64',
      outputDirectory: './dist/installer',
      authors: 'MultiCord Team',
      exe: 'MultiCord.exe',
      description: 'Multi-account Discord client - Switch between Discord accounts seamlessly',
      setupExe: 'MultiCord-Setup-v1.0.0.exe',
      
      // Icon settings
      setupIcon: hasIcon ? path.resolve(iconPath) : undefined,
      iconUrl: hasIcon ? `file://${path.resolve(iconPath)}` : undefined,
      
      // Installer behavior
      noMsi: true, // Only create .exe installer (faster, smaller)
      skipUpdateIcon: false,
      title: 'MultiCord Installation Wizard',
      version: '1.0.0',
      
      // Metadata for Windows
      metadata: {
        CompanyName: 'MultiCord',
        FileDescription: 'MultiCord - Multi-account Discord client',
        OriginalFilename: 'MultiCord-Setup-v1.0.0.exe',
        ProductName: 'MultiCord',
        InternalName: 'MultiCord',
        ProductVersion: '1.0.0',
        Copyright: '© 2025 MultiCord Team'
      }
    });
    
    console.log('');
    console.log('✅ Windows Installer created successfully!');
    console.log('📁 Location: dist/installer/MultiCord-Setup-v1.0.0.exe');
    console.log('');
    console.log('🎯 Installer Features:');
    console.log('   • Professional installation wizard');
    console.log('   • Automatic Start Menu shortcuts');
    console.log('   • Desktop shortcut option');
    console.log('   • Proper uninstaller');
    console.log('   • Windows registry integration');
    console.log('   • Auto-updater support');
    console.log('');
    console.log('📤 Ready for distribution!');
    
  } catch (error) {
    console.error('❌ Error creating installer:', error);
    console.log('💡 Try running: npm run pack-installer');
  }
}

buildInstaller(); 