import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const output = fs.createWriteStream(path.join(process.cwd(), 'public', 'src-completo.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  console.log('src-completo.zip created successfully! Total bytes: ' + archive.pointer());
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);
archive.directory('src/', 'src');
archive.file('package.json', { name: 'package.json' });
archive.finalize();
