import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';

async function generateIcons() {
  const officialLogo = path.join(process.cwd(), 'src', 'assets', 'images', 'logo_anjinho_1783694710360.jpg');
  const primeLogo = path.join(process.cwd(), 'src', 'assets', 'images', 'anjo_cuidador_logo_1782183418700.jpg');
  const anjoCuidadorLogo = path.join(process.cwd(), 'src', 'assets', 'images', 'anjo_cuidador_logo_1780288291165.png');
  const alternateLogo = path.join(process.cwd(), 'src', 'assets', 'images', 'logo_1782137520407.jpg');
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const publicDir = path.join(process.cwd(), 'public');

  let sourcePath = logoPath;
  if (fs.existsSync(officialLogo)) {
    console.log(`✨ Found official heart-baby-tree logo at: ${officialLogo}`);
    sourcePath = officialLogo;
  } else if (fs.existsSync(primeLogo)) {
    console.log(`✨ Found prime high-fidelity Anjo Cuidador logo at: ${primeLogo}`);
    sourcePath = primeLogo;
  } else if (fs.existsSync(anjoCuidadorLogo)) {
    console.log(`✨ Found high-fidelity Anjo Cuidador logo at: ${anjoCuidadorLogo}`);
    sourcePath = anjoCuidadorLogo;
  } else if (fs.existsSync(alternateLogo)) {
    console.log(`✨ Found alternate generated logo at: ${alternateLogo}`);
    sourcePath = alternateLogo;
  } else if (!fs.existsSync(logoPath)) {
    console.warn('⚠️ No source image found. Skipping auto icon generation.');
    return;
  }

  console.log(`⚡ Reading source image from: ${sourcePath}`);

  try {
    // Load source image
    const image = await Jimp.read(sourcePath);

    // Save as public/logo.png (force PNG format write)
    console.log('Writing public/logo.png...');
    const logoPngBuffer = await image.getBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'logo.png'), logoPngBuffer);

    // 1. icon-192x192.png
    console.log('Generating icon-192x192.png...');
    const icon192 = image.clone().resize({ w: 192, h: 192 });
    const icon192Buffer = await icon192.getBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192Buffer);
    fs.writeFileSync(path.join(publicDir, 'logo-192.png'), icon192Buffer); // sync logo-192.png as well!

    // 2. icon-512x512.png
    console.log('Generating icon-512x512.png...');
    const icon512 = image.clone().resize({ w: 512, h: 512 });
    const icon512Buffer = await icon512.getBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512Buffer);
    fs.writeFileSync(path.join(publicDir, 'logo-512.png'), icon512Buffer); // sync logo-512.png as well!

    // 3. apple-touch-icon.png
    console.log('Generating apple-touch-icon.png...');
    const appleTouch = image.clone().resize({ w: 180, h: 180 });
    const appleTouchBuffer = await appleTouch.getBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer);

    // 4. favicon.ico (write PNG buffer to favicon.ico)
    console.log('Generating favicon.ico...');
    const favicon = image.clone().resize({ w: 48, h: 48 });
    const faviconBuffer = await favicon.getBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);

    console.log('✅ All icons generated successfully in /public!');
  } catch (error) {
    console.error('❌ Failed to generate icons:', error);
  }
}

generateIcons();
