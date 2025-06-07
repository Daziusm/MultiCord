const fs = require('fs');
const path = require('path');

// Vencord Web extension ID from Chrome Web Store
const VENCORD_WEB_ID = 'cbghhgpcnddeihccjmnadmkaejncjndb';
const EXTENSIONS_DIR = path.join(__dirname, 'extensions');
const VENCORD_WEB_DIR = path.join(EXTENSIONS_DIR, 'vencord-web');

console.log('🎯 Vencord Web Extension Downloader for MultiCord');
console.log('='.repeat(50));

// Create extensions directory
if (!fs.existsSync(EXTENSIONS_DIR)) {
    fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
}

console.log(`📁 Extensions directory: ${EXTENSIONS_DIR}`);
console.log(`🎯 Target directory: ${VENCORD_WEB_DIR}`);

console.log('\n⚠️  MANUAL INSTALLATION REQUIRED');
console.log('Chrome extensions cannot be automatically downloaded due to Chrome Web Store restrictions.');
console.log('\n🎯 VENCORD WEB EXTENSION SETUP:');
console.log('\n1. Download Vencord Web extension:');
console.log('   🔗 Visit: https://chromewebstore.google.com/detail/vencord-web/cbghhgpcnddeihccjmnadmkaejncjndb');
console.log('   📝 This is the OFFICIAL Vencord browser extension (much better than userscripts!)');

console.log('\n2. Get the extension files:');
console.log('   📥 OPTION A: Use CRX Extractor');
console.log('      - Install "CRX Extractor/Downloader" in Chrome');
console.log('      - Go to the Vencord Web extension page');
console.log('      - Use CRX Extractor to download the .crx file');
console.log('      - Rename .crx to .zip and extract');

console.log('\n   📥 OPTION B: Manual extraction from your Chrome');
console.log('      - Install Vencord Web in your regular Chrome browser');
console.log('      - Go to chrome://extensions/');
console.log('      - Enable Developer mode');
console.log('      - Find Vencord Web and copy its folder from:');
console.log('        %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\cbghhgpcnddeihccjmnadmkaejncjndb\\');

console.log(`\n3. Place files in: ${VENCORD_WEB_DIR}`);
console.log('\n4. Directory structure should look like:');
console.log('   extensions/vencord-web/');
console.log('   ├── manifest.json');
console.log('   ├── content.js (or similar)');
console.log('   └── (other extension files)');

console.log('\n✅ ADVANTAGES OF VENCORD WEB:');
console.log('   🎯 Purpose-built for Discord');
console.log('   🔄 Auto-updates through extension system');
console.log('   🛡️ More stable than userscripts');
console.log('   ⚡ Better performance');
console.log('   🎨 Full UI integration');

console.log('\n🚀 AFTER INSTALLATION:');
console.log('1. Run MultiCord: npm run dev');
console.log('2. Vencord Web will load automatically');
console.log('3. Full Vencord features work natively!');
console.log('4. No Tampermonkey or userscripts needed!');

console.log('\n💡 This is much better than our Tampermonkey approach!'); 