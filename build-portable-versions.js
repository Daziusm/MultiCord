const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ MultiCord Portable Build System');
console.log('='.repeat(40));

const buildType = process.argv[2];

if (!buildType || !['equicord', 'vencord', 'both'].includes(buildType)) {
  console.log('Usage: node build-portable-versions.js [equicord|vencord|both]');
  console.log('');
  console.log('Examples:');
  console.log('  node build-portable-versions.js equicord  # Build MultiCord with Equicord');
  console.log('  node build-portable-versions.js vencord   # Build MultiCord with Vencord');
  console.log('  node build-portable-versions.js both      # Build both versions');
  process.exit(1);
}

async function buildVersion(version) {
  console.log(`🎯 Building MultiCord with ${version.toUpperCase()} support...`);
  
  // Clean dist folder
  if (fs.existsSync('dist')) {
    console.log('🧹 Cleaning dist folder...');
    execSync('Remove-Item -Recurse -Force dist', { stdio: 'inherit' });
  }
  
  // Build portable version
  console.log('📦 Building portable version...');
  execSync('npm run pack', { stdio: 'inherit' });
  
  // Rename the output folder
  const sourceDir = 'dist/MultiCord-win32-x64';
  const targetDir = `dist/MultiCord-${version.charAt(0).toUpperCase() + version.slice(1)}-Portable`;
  
  if (fs.existsSync(sourceDir)) {
    fs.renameSync(sourceDir, targetDir);
    console.log(`✅ Created: ${targetDir}`);
    console.log(`   Executable: ${targetDir}/MultiCord.exe`);
  }
}

if (buildType === 'both') {
  // Build Equicord version
  await buildVersion('equicord');
  
  // Build Vencord version  
  await buildVersion('vencord');
  
  console.log('🎉 Both versions built successfully!');
  console.log('');
  console.log('📦 Output:');
  console.log('   dist/MultiCord-Equicord-Portable/');
  console.log('   dist/MultiCord-Vencord-Portable/');
} else {
  await buildVersion(buildType);
  console.log('🎉 Build completed successfully!');
}

