const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function convertIcon() {
  try {
    console.log('Converting PNG to ICO...');
    
    const pngPath = path.join(__dirname, 'src', 'assets', 'icon.png');
    const icoPath = path.join(__dirname, 'src', 'assets', 'icon.ico');
    
    if (!fs.existsSync(pngPath)) {
      console.error('❌ PNG icon not found at:', pngPath);
      return;
    }
    
    const icoBuffer = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log('✅ ICO icon created successfully at:', icoPath);
  } catch (error) {
    console.error('❌ Error converting icon:', error);
  }
}

convertIcon(); 