import { getStyleCategory } from './styleCategories';
import { getUsageQuotaInfo } from './usageQuota';

export const STICKER_SHEET_STYLE_ID = 'sticker-sheet';
export const STICKER_SHEET_SIZES = [4, 9, 12];
export const STICKER_PACK_MIN = 4;
export const STICKER_PACK_MAX = 12;
export const STICKER_PACK_SIZE_HINT = '4, 9, or 12';

export function isStickerStyle(style) {
  if (!style) return false;
  if (style.id === STICKER_SHEET_STYLE_ID) return false;
  return (style.categoryId || getStyleCategory(style.id)) === 'stickers';
}

export function toggleStickerSelection(selectedIds, styleId, max = STICKER_PACK_MAX) {
  const next = new Set(selectedIds);
  if (next.has(styleId)) {
    next.delete(styleId);
    return next;
  }
  if (next.size >= max) return next;
  next.add(styleId);
  return next;
}

export function canBuildStickerPack(selectedCount) {
  return STICKER_SHEET_SIZES.includes(selectedCount);
}

export function stickerSheetAspectRatio(count) {
  if (count === 12) return 3 / 4;
  return 1;
}

export function stickerPackQuotaMessage(subscriptionInfo, selectedCount = 1) {
  if (subscriptionInfo && !subscriptionInfo.subscription) {
    return 'A subscription is required to create a sticker pack.';
  }
  const quota = getUsageQuotaInfo(subscriptionInfo);
  if (quota.isExceeded) {
    return 'You have no images left. Upgrade to create a sticker pack.';
  }
  if (quota.remaining < 1) {
    return `A sticker pack uses 1 image. You have ${quota.remaining} left.`;
  }
  return null;
}

export function stickerSheetStyle() {
  return {
    id: STICKER_SHEET_STYLE_ID,
    label: 'Sticker pack',
    categoryId: 'stickers',
    prompt: 'Pixar-style sticker sheet',
  };
}
