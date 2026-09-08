import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'server-style-refs', 'caricatures');

export const STYLE_REF_BUFFERS: Record<string, Buffer> = {
  'style-refs/caricatures/carc7.webp': fs.readFileSync(path.join(dir, 'carc7.webp')),
  'style-refs/caricatures/carc8.jpg': fs.readFileSync(path.join(dir, 'carc8.jpg')),
  'style-refs/caricatures/carc9.jpg': fs.readFileSync(path.join(dir, 'carc9.jpg')),
  'style-refs/caricatures/carc10.jpg': fs.readFileSync(path.join(dir, 'carc10.jpg')),
  'style-refs/caricatures/carc11.png': fs.readFileSync(path.join(dir, 'carc11.png')),
  'style-refs/caricatures/carc12.jpg': fs.readFileSync(path.join(dir, 'carc12.jpg')),
  'style-refs/caricatures/carc12.png': fs.readFileSync(path.join(dir, 'carc12.png')),
  'style-refs/caricatures/carc13.jpg': fs.readFileSync(path.join(dir, 'carc13.jpg')),
  'style-refs/caricatures/carc13.png': fs.readFileSync(path.join(dir, 'carc13.png')),
  'style-refs/caricatures/carc14.webp': fs.readFileSync(path.join(dir, 'carc14.webp')),
  'style-refs/caricatures/carc15.jpg': fs.readFileSync(path.join(dir, 'carc15.jpg')),
  'style-refs/caricatures/carc16.jpg': fs.readFileSync(path.join(dir, 'carc16.jpg')),
  'style-refs/caricatures/carc17.jpg': fs.readFileSync(path.join(dir, 'carc17.jpg')),
  'style-refs/caricatures/carc18.jpg': fs.readFileSync(path.join(dir, 'carc18.jpg')),
  'style-refs/caricatures/carc19.webp': fs.readFileSync(path.join(dir, 'carc19.webp')),
  'style-refs/caricatures/carc20.jpg': fs.readFileSync(path.join(dir, 'carc20.jpg')),
  'style-refs/caricatures/carc21.jpg': fs.readFileSync(path.join(dir, 'carc21.jpg')),
  'style-refs/caricatures/carc22.jpg': fs.readFileSync(path.join(dir, 'carc22.jpg')),
  'style-refs/caricatures/mugface.jpg': fs.readFileSync(path.join(dir, 'mugface.jpg')),
  'style-refs/caricatures/mugface.png': fs.readFileSync(path.join(dir, 'mugface.png')),
};
