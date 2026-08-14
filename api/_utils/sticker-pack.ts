import { query } from './db';
import {
  STICKER_SHEET_STYLE_ID,
  getStyleById,
} from './styles-config';

export const STICKER_PACK_MIN = 4;
export const STICKER_PACK_MAX = 12;
export const STICKER_SHEET_SIZES = [4, 9, 12] as const;

export function isStickerStyle(styleId: string): boolean {
  if (!styleId || styleId === STICKER_SHEET_STYLE_ID) return false;
  const style = getStyleById(styleId);
  return Boolean(style && style.categoryId === 'stickers');
}

export function stickerSheetGridForCount(count: number): { cols: number; rows: number } | null {
  if (count === 4) return { cols: 2, rows: 2 };
  if (count === 9) return { cols: 3, rows: 3 };
  if (count === 12) return { cols: 3, rows: 4 };
  return null;
}

export function stickerSheetAspectRatio(count: number): string {
  const grid = stickerSheetGridForCount(count);
  if (!grid) return '1:1';
  return grid.cols === grid.rows ? '1:1' : `${grid.cols}:${grid.rows}`;
}

export function normalizeStickerExpressionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => String(id || '').trim())
    .filter((id) => /^[a-z0-9-]+$/.test(id));
}

export function validateStickerSheetExpressions(ids: string[]): string | null {
  if (!stickerSheetGridForCount(ids.length)) {
    return 'Pick 4, 9, or 12 sticker expressions for a pack.';
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

export { STICKER_SHEET_STYLE_ID };
