#!/usr/bin/env python3
"""Generate style catalog JS/TS from Funnyfy_Categories_Updated.xlsx."""
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET

XLSX = r'd:\Cursor\funnyfyapp resources\Funnyfy_Categories_Updated.xlsx'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def slug(s: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', s.lower().strip()).strip('-')
    return s[:50]


def parse_xlsx(path: str):
    with zipfile.ZipFile(path) as z:
        shared = []
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in root.findall('.//m:si', ns):
            shared.append(''.join((t.text or '') for t in si.findall('.//m:t', ns)))
        sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet.findall('.//m:sheetData/m:row', ns):
            vals = []
            for c in row.findall('m:c', ns):
                v = c.find('m:v', ns)
                if v is None:
                    vals.append('')
                elif c.get('t') == 's':
                    vals.append(shared[int(v.text)])
                else:
                    vals.append(v.text)
            if vals:
                rows.append(vals)

    current_cat = None
    catalog = []
    seen_ids = {}
    for row in rows[1:]:
        cat, style = (row + ['', ''])[:2]
        if cat:
            current_cat = cat.strip()
        style = style.strip()
        if not style or not current_cat:
            continue
        cat_id = slug(current_cat)
        style_id = slug(style)
        base = style_id
        n = 2
        while style_id in seen_ids:
            style_id = f'{base}-{n}'[:50]
            n += 1
        seen_ids[style_id] = True
        catalog.append({
            'id': style_id,
            'label': style,
            'categoryId': cat_id,
            'categoryLabel': current_cat,
        })

    cats = []
    seen_c = set()
    for item in catalog:
        if item['categoryId'] not in seen_c:
            seen_c.add(item['categoryId'])
            cats.append({'id': item['categoryId'], 'label': item['categoryLabel']})
    return cats, catalog


LEGACY_STYLES = [
    ('90s-cartoon', 'cartoons', '90s', 'Classic 90s animated cartoon style'),
    ('chibi', 'cartoons', 'Chibi', 'Cute, big-head chibi cartoon style'),
    ('neon', 'art', 'Neon', 'Vibrant neon cartoon style'),
    ('anime', 'anime-manga', 'Anime', 'Anime-style cartoon'),
    ('custom1', 'trending', 'Custom 1', 'Digital cartoon illustration'),
    ('custom2', 'trending', 'Custom 2', 'Stylized 3D cartoon — multiple faces'),
    ('3dclay', '3d-characters', '3D Clay', '3D Clay cartoon style'),
    ('oil-paint', 'paintings', 'Oil Paint', 'Oil-paint cartoon caricature style'),
    ('low-poly', 'art', 'Low-Poly Cartoon', 'Low-poly cartoon style'),
    ('water-color', 'paintings', 'Water Color', 'Water color cartoon caricature style'),
    ('pixar-like', '3d-characters', 'Pixar-like', 'Pixar-like cartoon style'),
    ('funko-pop', '3d-characters', 'Funko Pop', 'Funko Pop style'),
    ('neandc', 'fantasy-mythical', 'Neanderthal', 'Funny neanderthal cartoon'),
    ('neand3d', 'fantasy-mythical', 'Neanderthal 3D', 'Funny neanderthal 3D caricature'),
    ('handd', 'caricatures', 'Hand-Drawn', 'Hand-drawn editorial caricature'),
    ('superhero', 'video-games', 'Superhero', 'Superhero caricature'),
    ('villian', 'video-games', 'Super Villain', 'Super villain caricature'),
    ('cyborg', 'video-games', 'Cyborg', 'Cyborg cartoon caricature'),
]


def write_mobile(cats, catalog):
    lines = [
        '// Auto-generated from Funnyfy_Categories_Updated.xlsx',
        '',
        'export const STYLE_CATEGORIES = [',
        "  { id: 'all', label: 'All' },",
    ]
    for c in cats:
        lines.append(f"  {{ id: '{c['id']}', label: {json.dumps(c['label'])} }},")
    lines.append('];')
    lines.append('')
    lines.append('export const STYLE_CATALOG = [')
    for s in catalog:
        lines.append(
            f"  {{ id: {json.dumps(s['id'])}, label: {json.dumps(s['label'])}, "
            f"categoryId: {json.dumps(s['categoryId'])} }},"
        )
    lines.append('];')
    lines.append('')
    lines.append('export const CATEGORY_BY_STYLE_ID = {')
    for s in catalog:
        lines.append(f"  {json.dumps(s['id'])}: {json.dumps(s['categoryId'])},")
    catalog_ids = {s['id'] for s in catalog}
    for style_id, cat_id, _label, _desc in LEGACY_STYLES:
        if style_id not in catalog_ids:
            lines.append(f"  {json.dumps(style_id)}: {json.dumps(cat_id)},")
    lines.append('};')
    lines.append('')
    lines.append('/** Offline fallback — matches enabled legacy styles on the server */')
    lines.append('export const DEFAULT_ENABLED_STYLES = [')
    for style_id, cat_id, label, desc in LEGACY_STYLES:
        lines.append(
            f"  {{ id: {json.dumps(style_id)}, label: {json.dumps(label)}, "
            f"categoryId: {json.dumps(cat_id)}, description: {json.dumps(desc)} }},"
        )
    lines.append('];')
    lines.append('')
    lines.append("export const HERO_STYLE_IDS = ['anime', '90s-cartoon', 'modern-anime', 'chibi-cartoon'];")
    lines.append('')
    lines.append('export function getStyleCategory(styleId) {')
    lines.append('  return CATEGORY_BY_STYLE_ID[styleId] || null;')
    lines.append('}')
    lines.append('')
    lines.append('export function pickHeroStyle(styles) {')
    lines.append('  if (!Array.isArray(styles) || styles.length === 0) return null;')
    lines.append('  for (const id of HERO_STYLE_IDS) {')
    lines.append('    const found = styles.find((s) => s.id === id);')
    lines.append('    if (found) return found;')
    lines.append('  }')
    lines.append('  return styles[0];')
    lines.append('}')
    lines.append('')

    out = os.path.join(ROOT, 'apps', 'mobile', 'data', 'styleCatalog.js')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def write_api(cats, catalog):
    lines = [
        '// Auto-generated from Funnyfy_Categories_Updated.xlsx',
        '',
        'export interface StyleCatalogEntry {',
        '  id: string;',
        '  label: string;',
        '  categoryId: string;',
        '}',
        '',
        'export interface StyleCategory {',
        '  id: string;',
        '  label: string;',
        '}',
        '',
        'export const STYLE_CATEGORIES: StyleCategory[] = [',
    ]
    for c in cats:
        lines.append(f"  {{ id: '{c['id']}', label: {json.dumps(c['label'])} }},")
    lines.append('];')
    lines.append('')
    lines.append('export const STYLE_CATALOG: StyleCatalogEntry[] = [')
    for s in catalog:
        lines.append(
            f"  {{ id: {json.dumps(s['id'])}, label: {json.dumps(s['label'])}, "
            f"categoryId: {json.dumps(s['categoryId'])} }},"
        )
    lines.append('];')
    lines.append('')
    lines.append(f'export const CATALOG_STYLE_COUNT = {len(catalog)};')
    lines.append('')

    out = os.path.join(ROOT, 'api', '_utils', 'style-catalog.ts')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    cats, catalog = parse_xlsx(XLSX)
    write_mobile(cats, catalog)
    write_api(cats, catalog)
    print(f'Generated {len(cats)} categories, {len(catalog)} styles')
