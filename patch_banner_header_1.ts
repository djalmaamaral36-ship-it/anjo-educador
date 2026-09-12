import fs from 'fs';

const fileStr = fs.readFileSync('src/components/BannerHeader.tsx', 'utf-8');
const lines = fileStr.split('\n');

// Find moreMenuItems
const startIndex = lines.findIndex(l => l.includes('const moreMenuItems = ['));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === '];');

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex - 1, endIndex - startIndex + 3);
  fs.writeFileSync('src/components/BannerHeader.tsx', lines.join('\n'));
  console.log('Removed moreMenuItems');
}
