import fs from 'fs';

const fileStr = fs.readFileSync('src/components/BannerHeader.tsx', 'utf-8');
const lines = fileStr.split('\n');

const stateIndex = lines.findIndex(l => l.includes('const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);'));
if (stateIndex !== -1) lines.splice(stateIndex, 1);

const refIndex = lines.findIndex(l => l.includes('const moreMenuRef = useRef<HTMLDivElement>(null);'));
if (refIndex !== -1) lines.splice(refIndex, 1);

const effectStart = lines.findIndex(l => l.includes('// Fecha o dropdown "Mais" ao clicar fora'));
const effectEnd = lines.findIndex((l, i) => i > effectStart && l.includes('}, [isMoreMenuOpen]);'));
if (effectStart !== -1 && effectEnd !== -1) {
  lines.splice(effectStart, effectEnd - effectStart + 1);
}

fs.writeFileSync('src/components/BannerHeader.tsx', lines.join('\n'));
console.log('Removed states and effect');
