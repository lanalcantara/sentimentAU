const fs = require('fs');
const path = require('path');

function searchFiles(dir, text) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next')) {
        searchFiles(fullPath, text);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(text.toLowerCase())) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

searchFiles(path.join(__dirname, '..', 'app'), 'compartilhando');
searchFiles(path.join(__dirname, '..', 'components'), 'compartilhando');
