const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'app/page.tsx',
  'app/perfil/[id]/page.tsx',
  'components/layout/sidebar.tsx',
  'components/layout/mobile-nav.tsx',
  'components/dashboard/stats-grid.tsx'
];

const replacements = [
  { regex: /bg-\[#1e2a4a\]/g, replacement: 'bg-foreground' }, // Foreground is sometimes used as dark background in this design? Actually wait, var(--foreground) is text. Usually background is `bg-background`. Let's map it safely.
  { regex: /bg-\[#f8fafc\]/g, replacement: 'bg-muted' },
  { regex: /bg-white/g, replacement: 'bg-card' },
  { regex: /text-\[#1e2a4a\]/g, replacement: 'text-foreground' },
  { regex: /text-\[#6a7a9a\]/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[#4a5568\]/g, replacement: 'text-muted-foreground' },
  { regex: /border-\[#eaeef5\](\/[0-9]+)?/g, replacement: 'border-border' },
  { regex: /border-slate-100/g, replacement: 'border-border' },
  { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-700/g, replacement: 'text-foreground' },
  { regex: /bg-slate-50/g, replacement: 'bg-muted' }
];

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated colors in ${file}`);
    }
  }
});
