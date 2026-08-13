import sharp from 'sharp';
import { query } from './db';
import {
  STICKER_SHEET_STYLE_ID,
  getStyleById,
} from './styles-config';

export const STICKER_PACK_MIN = 4;
export const STICKER_PACK_MAX = 9;
export const STICKER_SHEET_SIZES = [4, 9] as const;
export const STICKER_SIZE_PX = 512;
export const STICKER_MAX_BYTES = 100 * 1024;
export const TRAY_SIZE_PX = 96;
export const TRAY_MAX_BYTES = 50 * 1024;

export type StickerPackItemInput = {
  styleId: string;
  imageUrl: string;
};

export type StickerPackItem = {
  styleId: string;
  label: string;
  emoji: string;
  webpBase64: string;
  bytes: number;
};

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'funnyfy';
}

export function isStickerStyle(styleId: string): boolean {
  if (!styleId || styleId === STICKER_SHEET_STYLE_ID) return false;
  const style = getStyleById(styleId);
  return Boolean(style && style.categoryId === 'stickers');
}

export function stickerSheetGridForCount(count: number): { cols: number; rows: number } | null {
  if (count === 4) return { cols: 2, rows: 2 };
  if (count === 9) return { cols: 3, rows: 3 };
  return null;
}

export function normalizeStickerExpressionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => String(id || '').trim())
    .filter((id) => /^[a-z0-9-]+$/.test(id));
}

export function validateStickerSheetExpressions(ids: string[]): string | null {
  if (!stickerSheetGridForCount(ids.length)) {
    return 'Pick 4 or 9 sticker expressions for a pack.';
  }
  if (new Set(ids).size !== ids.length) {
    return 'Duplicate expressions cannot be added to a pack.';
  }
  for (const id of ids) {
    if (!isStickerStyle(id)) return `Invalid sticker style: ${id}`;
  }
  return null;
}

export async function ensureJobSheetExpressionsColumn(): Promise<void> {
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sheet_expressions TEXT`);
}

export async function splitStickerSheet(input: Buffer, count: number): Promise<Buffer[]> {
  const grid = stickerSheetGridForCount(count);
  if (!grid) throw new Error('STICKER_SHEET_INVALID_SIZE');

  const rotated = await sharp(input).rotate().png().toBuffer();
  const meta = await sharp(rotated).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error('STICKER_SHEET_INVALID_IMAGE');

  const side = Math.min(width, height);
  const left0 = Math.floor((width - side) / 2);
  const top0 = Math.floor((height - side) / 2);
  const square = await sharp(rotated)
    .extract({ left: left0, top: top0, width: side, height: side })
    .png()
    .toBuffer();

  const cell = Math.floor(side / grid.cols);
  const inset = Math.max(2, Math.round(cell * 0.04));
  const cells: Buffer[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const left = col * cell + inset;
      const top = row * cell + inset;
      const extractW = Math.max(1, Math.min(cell - inset * 2, side - left));
      const extractH = Math.max(1, Math.min(cell - inset * 2, side - top));
      cells.push(
        await sharp(square)
          .extract({ left, top, width: extractW, height: extractH })
          .png()
          .toBuffer(),
      );
    }
  }
  return cells;
}

export async function convertSheetCells(
  cells: Buffer[],
  expressionIds: string[],
): Promise<StickerPackItem[]> {
  const converted: StickerPackItem[] = [];
  for (let i = 0; i < expressionIds.length; i += 1) {
    const styleId = expressionIds[i];
    const style = getStyleById(styleId);
    if (!style || style.categoryId !== 'stickers') {
      throw new Error(`INVALID_STICKER_STYLE: ${styleId}`);
    }
    const webp = await encodeWebpWithinLimit(cells[i], STICKER_SIZE_PX, STICKER_MAX_BYTES);
    converted.push({
      styleId,
      label: style.label,
      emoji: stickerEmojiForStyle(styleId),
      webpBase64: webp.toString('base64'),
      bytes: webp.length,
    });
  }
  return converted;
}

export function stickerEmojiForStyle(styleId: string): string {
  const map: Record<string, string> = {
    angry: '😠',
    bored: '😐',
    celebrate: '🎉',
    confused: '😕',
    cool: '😎',
    crying: '😢',
    disgusted: '🤢',
    excited: '🤩',
    facepalm: '🤦',
    happy: '😊',
    laughing: '😂',
    love: '😍',
    'mind-blown': '🤯',
    'need-coffee': '☕',
    nervous: '😬',
    proud: '😌',
    sad: '😔',
    sarcastic: '😏',
    scared: '😨',
    shocked: '😱',
    skeptical: '🤨',
    sleepy: '😴',
    smirk: '😏',
    sorry: '🙏',
    surprised: '😮',
    thinking: '🤔',
    'thumbs-down': '👎',
    'thumbs-up': '👍',
    wink: '😉',
  };
  return map[styleId] || '🙂';
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download sticker image (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function encodeWebpWithinLimit(
  input: Buffer,
  size: number,
  maxBytes: number,
  qualities = [82, 70, 58, 46, 34, 24],
): Promise<Buffer> {
  let last: Buffer | null = null;
  for (const quality of qualities) {
    const encoded = await sharp(input)
      .rotate()
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality, alphaQuality: Math.min(100, quality + 10), effort: 6 })
      .toBuffer();
    last = encoded;
    if (encoded.length <= maxBytes) return encoded;
  }
  if (!last) throw new Error('Failed to encode WebP sticker');
  return last;
}

export async function convertStickerItems(
  items: StickerPackItemInput[],
): Promise<StickerPackItem[]> {
  const converted: StickerPackItem[] = [];
  for (const item of items) {
    const style = getStyleById(item.styleId);
    if (!style || style.categoryId !== 'stickers') {
      throw new Error(`INVALID_STICKER_STYLE: ${item.styleId}`);
    }
    const source = await fetchImageBuffer(item.imageUrl);
    const webp = await encodeWebpWithinLimit(source, STICKER_SIZE_PX, STICKER_MAX_BYTES);
    converted.push({
      styleId: item.styleId,
      label: style.label,
      emoji: stickerEmojiForStyle(item.styleId),
      webpBase64: webp.toString('base64'),
      bytes: webp.length,
    });
  }
  return converted;
}

export async function buildTrayIcon(firstWebpBase64: string): Promise<{
  webpBase64: string;
  bytes: number;
}> {
  const source = Buffer.from(firstWebpBase64, 'base64');
  const tray = await encodeWebpWithinLimit(source, TRAY_SIZE_PX, TRAY_MAX_BYTES, [80, 64, 48, 32]);
  return { webpBase64: tray.toString('base64'), bytes: tray.length };
}

export async function getTelegramBotUsername(): Promise<string | null> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { username?: string };
    };
    return json.result?.username || null;
  } catch {
    return null;
  }
}

export { slugify, STICKER_SHEET_STYLE_ID };
