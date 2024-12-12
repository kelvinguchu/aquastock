import fs from 'fs';
import path from 'path';

const logoPath = path.join(process.cwd(), 'public', 'logo.png');
const base64Logo = fs.readFileSync(logoPath, { encoding: 'base64' });