import fs from 'fs';
import path from 'path';

function fixEncodingInString(str: string): string {
  // Common double-encoded UTF-8 in Portuguese
  const multiCharMap: [RegExp, string][] = [
    [/Ã§Ãµes/g, 'ções'],
    [/Ã§Ã£o/g, 'ção'],
    [/Ã§Ãµ/g, 'ções'],
    [/Ã§Ã£/g, 'ção'],
    [/Ã§/g, 'ç'],
    [/Ã£/g, 'ã'],
    [/Ã¡/g, 'á'],
    [/Ã©/g, 'é'],
    [/Ã­/g, 'í'],
    [/Ã³/g, 'ó'],
    [/Ãº/g, 'ú'],
    [/Ã¢/g, 'â'],
    [/Ãª/g, 'ê'],
    [/Ã´/g, 'ô'],
    [/Ã€/g, 'À'],
    [/Ã /g, 'À'],
    [/Ã‰/g, 'É'],
    [/Ã“/g, 'Ó'],
    [/Ãš/g, 'Ú'],
    [/Ãƒ/g, 'Ã'],
    [/Ã•/g, 'Õ'],
    [/Ã‡/g, 'Ç'],
    [/Âª/g, 'ª'],
    [/Âº/g, 'º'],
    [/Â«/g, '«'],
    [/Â»/g, '»'],
    [/Â°/g, '°'],
    [/â€¢/g, '•'],
    [/â€“/g, '–'],
    [/â€”/g, '—'],
    [/â€œ/g, '“'],
    [/â€/g, '”'],
    [/â€™/g, '’'],
    [/â€˜/g, '‘'],
    [/âœ“/g, '✓'],
    [/âœ”/g, '✔'],
    [/âœ¨/g, '✨'],
    [/âš ï¸/g, '⚠️'],
    [/ðŸ“Š/g, '📊'],
    [/ðŸ‘©â€/g, '👩‍🏫'],
    [/ðŸ‘©/g, '👩'],
    [/ðŸ’§/g, '💧'],
    [/ðŸŒ³/g, '🌳'],
    [/ðŸ ƒ/g, '🍃'],
    [/ðŸŒ¸/g, '🌸'],
    [/ðŸ Ž/g, '🍎'],
    [/ðŸªµ/g, '🪵'],
    [/ðŸŒŸ/g, '🌟'],
    [/ðŸ¤ /g, '🤗'],
    [/ðŸ’Ž/g, '💎'],
    [/ðŸ”—/g, '🔗'],
    [/ðŸ“…/g, '📅'],
    [/ðŸš€/g, '🚀'],
    [/ðŸ“±/g, '📱'],
    [/ðŸ’¬/g, '💬'],
    [/ðŸ”’/g, '🔒'],
    [/ðŸ”‘/g, '🔑'],
    [/ðŸ“‹/g, '📋'],
    [/ðŸ“„/g, '📄'],
    [/ðŸŽ“/g, '🎓'],
    [/ðŸ’ª/g, '💪'],
    [/ðŸŒˆ/g, '🌈'],
    [/ðŸ‘ /g, '👏'],
    [/ðŸ™ /g, '🙏'],
    [/ðŸŽ¨/g, '🎨'],
    [/ðŸŽµ/g, '🎵'],
    [/ðŸ ½/g, '🍽️'],
    [/ðŸ ³/g, '🍼'],
    [/ðŸ›Œ/g, '🛌'],
    [/ðŸ˜Š/g, '😊'],
    [/ðŸ˜€/g, '😀'],
    [/ðŸ˜ /g, '😍'],
    [/ðŸ” /g, '🔍'],
    [/ðŸ§¡/g, '🧡'],
    [/ðŸ’™/g, '💙'],
    [/ðŸ’œ/g, '💜'],
    [/ðŸ’š/g, '💚'],
    [/ðŸ’•/g, '💕'],
    [/â­/g, '⭐'],
    [/Â /g, ' '],
    [/Â/g, '']
  ];

  let res = str;
  for (const [regex, replacement] of multiCharMap) {
    res = res.replace(regex, replacement);
  }

  // Remove any remaining stray corrupted sequences like ðŸ... or â€...
  res = res.replace(/ðŸ[^\s<>"'`\\{}()[\]]+/g, '');
  res = res.replace(/â[^\s<>"'`\\{}()[\]]+/g, '');

  return res;
}

function processDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        processDirectory(fullPath);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.html') || entry.name.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fixed = fixEncodingInString(content);
      if (fixed !== content) {
        fs.writeFileSync(fullPath, fixed, 'utf8');
        console.log(`Cleaned encoding in: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(process.cwd(), 'src'));
processDirectory(path.join(process.cwd(), 'public'));

console.log('All files processed and fixed!');
