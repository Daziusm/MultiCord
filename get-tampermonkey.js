const fs = require('fs');
const path = require('path');
const https = require('https');

// Tampermonkey extension ID from Chrome Web Store
const TAMPERMONKEY_ID = 'dhdgffkkebhmkfjojejmpbldmpobfkfo';
const EXTENSIONS_DIR = path.join(__dirname, 'extensions');
const TAMPERMONKEY_DIR = path.join(EXTENSIONS_DIR, 'tampermonkey');

console.log('🔌 Tampermonkey Extension Downloader for MultiCord');
console.log('='.repeat(50));

// Create extensions directory
if (!fs.existsSync(EXTENSIONS_DIR)) {
    fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
}

console.log(`📁 Extensions directory: ${EXTENSIONS_DIR}`);
console.log(`🎯 Target directory: ${TAMPERMONKEY_DIR}`);

console.log('\n⚠️  MANUAL INSTALLATION REQUIRED');
console.log('Unfortunately, Chrome extensions cannot be automatically downloaded due to Chrome Web Store restrictions.');
console.log('\nPLEASE FOLLOW THESE STEPS:');
console.log('\n1. Download Tampermonkey extension manually:');
console.log('   - Visit: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo');
console.log('   - OR download from: https://www.tampermonkey.net/');
console.log('\n2. Extract the extension:');
console.log('   - If you have a .crx file, rename it to .zip and extract');
console.log('   - If downloaded from tampermonkey.net, extract the .zip');
console.log(`\n3. Place extracted files in: ${TAMPERMONKEY_DIR}`);
console.log('\n4. The directory structure should look like:');
console.log('   extensions/tampermonkey/');
console.log('   ├── manifest.json');
console.log('   ├── background.js');
console.log('   └── (other extension files)');

console.log('\n📝 ALTERNATIVE: Use CRX Extractor');
console.log('1. Install "CRX Extractor/Downloader" extension in Chrome');
console.log('2. Go to Tampermonkey in Chrome Web Store');
console.log('3. Use CRX Extractor to download the .crx file');
console.log('4. Extract the .crx file to the tampermonkey directory');

console.log('\n✅ AFTER INSTALLATION:');
console.log('1. Run MultiCord: npm run dev');
console.log('2. Tampermonkey should load automatically');
console.log('3. Install Vencord.user.js in Tampermonkey as usual');
console.log('4. Vencord will work normally in Discord!');

console.log('\n🚀 This approach will be much more reliable than our custom injection!'); 