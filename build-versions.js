const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️ MultiCord Build System');
console.log('='.repeat(40));

const buildType = process.argv[2];

if (!buildType || !['equicord', 'vencord'].includes(buildType)) {
  console.log('Usage: node build-versions.js [equicord|vencord]');
  console.log('');
  console.log('Examples:');
  console.log('  node build-versions.js equicord  # Build MultiCord with Equicord');
  console.log('  node build-versions.js vencord   # Build MultiCord with Vencord');
  process.exit(1);
}

console.log(`🎯 Building MultiCord with ${buildType.toUpperCase()} support...`);

// Read current package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update package.json for the specific build
const originalName = packageJson.name;
const originalProductName = packageJson.build.productName;

if (buildType === 'equicord') {
  packageJson.name = 'multicord-equicord';
  packageJson.build.productName = 'MultiCord (Equicord)';
  packageJson.build.nsis.artifactName = 'MultiCord-Equicord-Setup-${version}.exe';
  packageJson.build.portable.artifactName = 'MultiCord-Equicord-Portable-${version}.exe';
} else if (buildType === 'vencord') {
  packageJson.name = 'multicord-vencord';
  packageJson.build.productName = 'MultiCord (Vencord)';
  packageJson.build.nsis.artifactName = 'MultiCord-Vencord-Setup-${version}.exe';
  packageJson.build.portable.artifactName = 'MultiCord-Vencord-Portable-${version}.exe';
}

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log(`📝 Updated package.json for ${buildType} build`);
console.log(`   Product Name: ${packageJson.build.productName}`);
console.log(`   Installer: ${packageJson.build.nsis.artifactName}`);

try {
  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build-win', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log(`📦 Output: dist/${packageJson.build.nsis.artifactName.replace('${version}', packageJson.version)}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Restore original package.json
  packageJson.name = originalName;
  packageJson.build.productName = originalProductName;
  packageJson.build.nsis.artifactName = 'MultiCord-Setup-${version}.exe';
  packageJson.build.portable.artifactName = 'MultiCord-Setup.exe';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('🔄 Restored original package.json');
}

console.log('🎉 Build process completed!');
