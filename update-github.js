const { execSync } = require('child_process');

console.log('🚀 MultiCord GitHub Update Script');
console.log('='.repeat(40));

try {
  // Check if we're in a git repository
  execSync('git status', { stdio: 'pipe' });
  
  console.log('📝 Adding all changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('💾 Committing changes...');
  const commitMessage = 'feat: Add dual extension support (Equicord & Vencord)\n\n- Added support for both Equicord and Vencord browser extensions\n- Created build system for separate Equicord and Vencord versions\n- Updated README with installation options for both versions\n- Added build scripts: build-equicord, build-vencord, build-both\n- Maintained backward compatibility with existing Vencord builds';
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  
  console.log('📤 Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('✅ Successfully updated GitHub repository!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Create releases for both versions:');
  console.log('   npm run build-equicord  # Creates MultiCord-Equicord-Setup.exe');
  console.log('   npm run build-vencord   # Creates MultiCord-Vencord-Setup.exe');
  console.log('2. Upload the built installers to GitHub releases');
  console.log('3. Update release notes to mention both versions');
  
} catch (error) {
  if (error.message.includes('not a git repository')) {
    console.log('❌ Not a git repository. Please run:');
    console.log('   git init');
    console.log('   git remote add origin https://github.com/Daziusm/MultiCord.git');
    console.log('   git add .');
    console.log('   git commit -m "Initial commit"');
    console.log('   git push -u origin main');
  } else {
    console.error('❌ Error:', error.message);
  }
}
