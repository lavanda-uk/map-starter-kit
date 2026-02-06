import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Find all HTML files in dist/assets that contain script tags
const assetsDir = 'dist/assets';
const files = readdirSync(assetsDir);
const htmlFiles = files.filter(f => f.endsWith('.html')).map(f => join(assetsDir, f));

htmlFiles.forEach(file => {
  const content = readFileSync(file, 'utf-8');
  
  // Replace script tags that load .js files to include type="module"
  // Pattern: <script src="./filename.js"></script> -> <script type="module" src="./filename.js"></script>
  const fixed = content.replace(
    /<script src="\.\/([^"]+\.js)"><\/script>/g,
    '<script type="module" src="./$1"></script>'
  );
  
  if (content !== fixed) {
    writeFileSync(file, fixed, 'utf-8');
    console.log(`✅ Fixed ${file} to include type="module"`);
  }
});

console.log('✅ HTML files fixed!');
