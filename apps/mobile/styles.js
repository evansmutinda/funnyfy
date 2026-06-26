import { Platform, StyleSheet } from 'react-native';
import { FONT_PLUS_JAKARTA } from './constants/fonts';

// Dark-first theme — color reserved for success/error/status only
const INK = '#0F172A';
const PAPER = '#FFFFFF';
const DARK_BG = '#0B0F19';
const DARK_SURFACE = 'rgba(255,255,255,0.06)';
const DARK_CHIP = 'rgba(255,255,255,0.08)';
const DARK_BORDER = 'rgba(255,255,255,0.12)';
const DARK_MUTED = 'rgba(255,255,255,0.65)';

const styles = StyleSheet.create({
      safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  
    styleContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    flexGrow: 1,
    backgroundColor: DARK_BG,
  },

  
    styleScroll: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  
    styleScreenSafe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  
  styleScreenHeader: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },

  
  discoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },

  
  discoveryCard: {
    width: '48.2%',
    backgroundColor: 'transparent',
  },

  
  styleCardOuter: {
    width: '100%',
  },

  
  styleCardImageShell: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  
  styleCardImageShellComparison: {
    backgroundColor: '#0B0F19',
  },

  
    styleCardImageShellSelected: {
    borderColor: PAPER,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },

  
  discoveryImageWrapper: {
    aspectRatio: 0.72,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  
  discoveryWideImageWrapper: {
    aspectRatio: 2.15,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  
  discoveryDenseImageWrapper: {
    aspectRatio: 0.88,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },

  
  discoveryTileGradient: {
    height: '46%',
  },

  
  discoveryWideTileGradient: {
    height: '55%',
  },

  
  discoveryDenseTileGradient: {
    height: '50%',
  },

  
  discoveryImageOverlay: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  
  discoveryWideImageOverlay: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  
  discoveryDenseImageOverlay: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 4,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  
  discoveryImageLabel: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    letterSpacing: -0.2,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'left',
    alignSelf: 'stretch',
  },

  
  discoveryWideImageLabel: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    letterSpacing: -0.2,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'left',
    alignSelf: 'stretch',
  },

  
  discoveryDenseImageLabel: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    letterSpacing: -0.15,
    lineHeight: 13,
    color: '#FFFFFF',
    textAlign: 'left',
    alignSelf: 'stretch',
  },

  
  styleEmptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },

  
    styleEmptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PAPER,
    letterSpacing: -0.2,
  },

  
    styleEmptyStateText: {
    fontSize: 14,
    color: DARK_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  
  styleHeroImageWrapper: {
    aspectRatio: 16 / 9,
    borderRadius: 20,
  },

  
  styleHeroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: INK,
    zIndex: 2,
  },

  
  styleHeroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  
    restyleBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    gap: 10,
  },

  
  restyleBannerRow: {
    gap: 2,
  },

  
  restyleBannerBody: {
    gap: 2,
  },

  
    restyleBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK_MUTED,
  },

  
    restyleBannerCancel: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: PAPER,
    borderWidth: 0,
    alignItems: 'center',
  },

  
  restyleBannerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },

  
    restyleHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: PAPER,
    textAlign: 'center',
  },

  
  styleTileRing: {
    borderRadius: 20,
    padding: 0,
  },

  
    styleTileRingSelected: {
    padding: 3,
    backgroundColor: PAPER,
  },

  
  styleImageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },

  
  styleImage: {
    width: '100%',
    height: '100%',
  },

  
  styleTileGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
  },

  
  styleImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },

  
  styleImageLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.15,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  
  afterMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },

  
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  
  sliderHandleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 1,
  },

  
    sliderKnob: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },

  
    errorRetryContainer: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: DARK_CHIP,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    gap: 12,
  },

  
  errorRetryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  
    errorRetryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PAPER,
  },

  
    errorRetrySubtext: {
    fontSize: 13,
    color: DARK_MUTED,
    lineHeight: 18,
  },

  
    errorRetryMessage: {
    flex: 1,
    fontSize: 14,
    color: DARK_MUTED,
    fontWeight: '500',
    lineHeight: 20,
  },

  
    retryButton: {
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 32,
    backgroundColor: PAPER,
    borderRadius: 999,
  },

  
    retryButtonText: {
    color: INK,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  
    wordmark: {
    fontSize: 18,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.3,
  },

  
    iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    offlineBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9998,
    elevation: 9998,
  },

  
    offlineBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: '#FDBA74',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },

  
    offlineBannerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    offlineBannerTextWrap: {
    flex: 1,
    gap: 2,
  },

  
    offlineBannerTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  
    offlineBannerMessage: {
    fontFamily: FONT_PLUS_JAKARTA,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },

  
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  
    menuDismissArea: {
    flex: 1,
  },

  
    menuSheet: {
    backgroundColor: '#0B0F19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: DARK_BORDER,
    paddingTop: 8,
    paddingHorizontal: 8,
  },

  
    menuHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 8,
  },

  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  
  menuItemIcon: {
    marginRight: 14,
  },

  
    menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  
  mediaTileChipWrapper: {
    width: 56,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  
  mediaTileChipGradient: {
    height: '58%',
  },

  
  mediaTileChipOverlay: {
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 4,
  },

  
  mediaTileChipLabel: {
    fontSize: 9,
    fontWeight: '700',
  },

  
    galleryContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: DARK_BG,
  },

  
    galleryRoot: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  
    galleryHeaderBand: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },

  
    galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  
    galleryHeaderTitle: {
    flex: 1,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 18,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  
    galleryHeaderSpacer: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },

  
    galleryHeaderSubtitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '500',
    color: DARK_MUTED,
    textAlign: 'center',
  },

  
    galleryLoadingText: {
    marginTop: 12,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '500',
    color: DARK_MUTED,
  },

  
    galleryViewerRoot: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  
    galleryViewerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  
    galleryViewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  
    galleryViewerPager: {
    flex: 1,
  },

  
    galleryViewerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  
    galleryViewerImage: {
    width: '100%',
    height: '100%',
  },

  
    galleryViewerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },

  
    galleryViewerFooterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  
    galleryViewerCounter: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: DARK_MUTED,
    letterSpacing: -0.1,
    flexShrink: 0,
  },

  
    galleryViewerLabel: {
    flex: 1,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '600',
    color: PAPER,
    textAlign: 'left',
  },

  
  galleryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  
  galleryLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
  galleryEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  
    galleryEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  
    galleryEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PAPER,
  },

  
    galleryEmptyText: {
    fontSize: 13,
    color: DARK_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },

  
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
    rowGap: 14,
  },

  
  galleryItem: {
    width: '48%',
  },

  
    galleryHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },

  
  viewerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  
  viewerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  
  viewerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 10,
  },

  
  viewerFooterLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  
  viewerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  
  viewerActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  
  viewerActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  
  infoContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
  },

  
  infoContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },

  
    infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: DARK_MUTED,
  },

  
    menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },

  
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },


  toastInnerWarning: {
    backgroundColor: '#EA580C',
    borderWidth: 2,
    borderColor: '#FDBA74',
    shadowColor: '#EA580C',
    shadowOpacity: 0.45,
  },


  toastTitleWarning: {
    color: '#FFFFFF',
  },


  toastMessageWarning: {
    color: 'rgba(255,255,255,0.92)',
  },

  
  toastIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  
  toastIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },

  
  toastTextWrap: {
    flex: 1,
    gap: 1,
  },

  
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  
  toastMessage: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },

  
  toastAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexShrink: 0,
  },

  
  toastActionText: {
    color: PAPER,
    fontSize: 12,
    fontWeight: '700',
  },

  
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  
    dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#151B28',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },

  
    dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  
    dialogMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: DARK_MUTED,
    lineHeight: 22,
    marginBottom: 24,
  },

  
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  dialogActionsStack: {
    flexDirection: 'column',
  },

  dialogConfirmButtonFull: {
    flex: 0,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
  },

  
    dialogCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: 'center',
  },

  
    dialogCancelText: {
    color: PAPER,
    fontWeight: '600',
    fontSize: 15,
  },

  
    dialogConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PAPER,
    alignItems: 'center',
  },

  
    dialogConfirmDestructive: {
    backgroundColor: '#EF4444',
  },

  
    dialogConfirmText: {
    color: INK,
    fontWeight: '700',
    fontSize: 15,
  },

  
    dialogConfirmTextDestructive: {
    color: PAPER,
  },

  
    dialogNeutralButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: DARK_BORDER,
    alignItems: 'center',
  },

  
    dialogNeutralDestructive: {
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },

  
    dialogNeutralText: {
    color: PAPER,
    fontWeight: '600',
    fontSize: 15,
  },

  
  dialogNeutralTextDestructive: {
    color: '#EF4444',
  },

  
    styleHomeContainer: {
    paddingTop: 10,
    paddingBottom: 0,
    flexGrow: 1,
    backgroundColor: DARK_BG,
    gap: 4,
  },

  
    styleRowSection: {
    gap: 6,
  },

  
    styleRowHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 26,
  },

  
    styleRowTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 16,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.25,
  },

  
    styleRowSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
  },

  
    styleRowSeeAllText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: DARK_MUTED,
  },

  
    styleRowList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  
    styleRowCard: {
    width: 130,
  },

  
    styleRowSeeAllTile: {
    width: 130,
    borderRadius: 24,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    overflow: 'hidden',
  },

  
    styleRowSeeAllTileInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },

  
    styleRowSeeAllTileText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.2,
  },

  
    styleRowSeeAllTileCount: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '500',
    color: DARK_MUTED,
  },

  
    tipsScroll: {
    flex: 1,
  },

  
    tipsScrollContent: {
    paddingTop: 8,
  },

  
    uploadRoot: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },

  
    uploadBackgroundFill: {
    ...StyleSheet.absoluteFillObject,
  },

  
    uploadBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  
    uploadScrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  
    uploadScrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
  },

  
    uploadTopLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },

  
    uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  
    uploadHeaderStyleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexShrink: 1,
    maxWidth: '46%',
  },

  
    uploadHeaderStyleChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    uploadHeaderSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 8,
  },

  
    uploadCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  
    uploadHeaderPill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 4,
    minWidth: 110,
    flexShrink: 0,
    marginLeft: 8,
  },

  
    uploadHeaderPillProgress: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  
    uploadHeaderPillProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },

  
    uploadHeaderPillText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    uploadHeaderPillLow: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderColor: 'rgba(245,158,11,0.55)',
  },

  
    uploadHeaderPillProgressLow: {
    backgroundColor: 'rgba(245,158,11,0.28)',
  },

  
    uploadHeaderPillProgressFillLow: {
    backgroundColor: '#F59E0B',
  },

  
    uploadHeaderPillTextLow: {
    color: '#FDE68A',
  },

  
    uploadHeaderTrailingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },

  
    uploadFloatingChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },

  
    uploadFloatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  
    uploadFloatingChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  
    uploadFloatingChipText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    uploadInlineBanner: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },

  
    uploadInlineBannerText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    uploadBottomLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },

  
    uploadSourceBlock: {
    gap: 10,
  },

  
    uploadSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  
    uploadSourceOptionDisabled: {
    opacity: 0.55,
  },

  
    uploadSourceOptionText: {
    flex: 1,
    gap: 2,
  },

  
    uploadSourceOptionTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  
    uploadSourceOptionSubtitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.05,
  },

  
    uploadInlineActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  
    uploadSmallGhostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  
    uploadSmallGhostButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    uploadGenerateButton: {
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    uploadGenerateButtonDisabled: {
    opacity: 0.5,
  },

  
    uploadGenerateButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },

  
    tipsRoot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F19',
    paddingHorizontal: 20,
    zIndex: 1000,
    elevation: 1000,
  },

  
    tipsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },

  
    tipsCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },

  
    tipsGridCell: {
    width: '48%',
    alignItems: 'center',
  },

  
    tipsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0F19',
  },

  
    tipsBadgeGood: {
    backgroundColor: '#10B981',
  },

  
    tipsBadgeBad: {
    backgroundColor: '#EF4444',
  },

  
    tipsRulesBlock: {
    marginTop: 36,
    gap: 12,
  },

  
    tipsRuleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  
    tipsRuleBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  
    tipsRuleBulletText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    tipsRuleText: {
    flex: 1,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
    letterSpacing: -0.1,
  },

  
    tipsFooter: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    paddingTop: 8,
  },

  
    tipsContinueButton: {
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    tipsContinueButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },

  
    tipsTopTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  
    tipsCloseCirclePlaceholder: {
    width: 40,
    height: 40,
  },

  
    tipsLead: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 24,
  },

  
    tipsConceptCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  
    tipsConceptCardGood: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.35)',
  },

  
    tipsConceptCardBad: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
  },

  
    tipsConceptIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    tipsConceptIconBgGood: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },

  
    tipsConceptIconBgBad: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },

  
    tipsConceptImage: {
    width: '100%',
    height: '100%',
  },


    tipsPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },


    tipsPlaceholderLabel: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },


    tipsDontShowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },


    tipsCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },


    tipsCheckboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },


    tipsDontShowText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
  },


    tipsConceptTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: -0.2,
  },

  
    tipsConceptSubtitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    letterSpacing: -0.1,
    textAlign: 'center',
  },

  
    pwdRoot: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },

  
    pwdBody: {
    flex: 1,
  },

  
    pwdHeroFadeZone: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0B0F19',
  },

  
    pwdHeroFadeContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },

  
    pwdPlansBottom: {
    marginBottom: 10,
  },

  
    pwdBrandMarkCompact: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },

  
    pwdBrandTierCompact: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  
    pwdBenefitsInline: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    letterSpacing: -0.05,
    paddingHorizontal: 8,
  },

  
    pwdTierCardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  
    pwdTierMetaCompact: {
    marginTop: 2,
    fontSize: 10.5,
  },

  
    pwdBottomBarCompact: {
    paddingTop: 6,
  },

  
    pwdPrimaryButtonCompact: {
    paddingVertical: 12,
  },

  
    pwdHeroBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },

  
    pwdHeroTopScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 88,
  },

  
    pwdFloatingCloseWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    padding: 12,
  },

  
    pwdFloatingCloseLeft: {
    right: undefined,
    left: 0,
  },

  
    pwdCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 15, 25, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },

  
    pwdUsageCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },

  
    pwdUsageCardLow: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.45)',
  },

  
    pwdUsageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  
    pwdUsageTitleBlock: {
    flex: 1,
    gap: 1,
  },

  
    pwdUsagePlanName: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  
    pwdUsageLine: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.1,
  },

  
    pwdUsagePlanNameLow: {
    color: '#FDE68A',
  },

  
    pwdUsageLineLow: {
    color: '#FBBF24',
  },

  
    pwdStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  
    pwdStatusPillActive: {
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderColor: 'rgba(16,185,129,0.45)',
  },

  
    pwdStatusPillTrial: {
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderColor: 'rgba(245,158,11,0.45)',
  },

  
    pwdStatusPillCancel: {
    backgroundColor: 'rgba(239,68,68,0.16)',
    borderColor: 'rgba(239,68,68,0.45)',
  },

  
    pwdStatusPillText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  
    pwdStatusPillTextActive: {
    color: '#10B981',
  },

  
    pwdStatusPillTextTrial: {
    color: '#F59E0B',
  },

  
    pwdStatusPillTextCancel: {
    color: '#EF4444',
  },

  
    pwdProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  
    pwdProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },

  
    pwdProgressTrackLow: {
    backgroundColor: 'rgba(245,158,11,0.22)',
  },

  
    pwdProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },

  
    pwdProgressFillLow: {
    backgroundColor: '#F59E0B',
  },

  
    pwdProgressNumbers: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.1,
  },

  
    pwdProgressNumbersLow: {
    color: '#FBBF24',
  },

  
    pwdFootnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  
    pwdFootnoteText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },

  
    pwdPendingText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: -0.1,
  },

  
    usageActionsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 12,
  },

  
    usageManageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  
    usageManageLinkText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },

  
    pwdSectionTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  
    pwdTierCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },

  
    pwdTierCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  
    pwdTierCopy: {
    flex: 1,
    gap: 2,
  },

  
    pwdTierLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  
    pwdTierPlanLabel: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: -0.05,
  },

  
    pwdTierPlanLabelDark: {
    color: 'rgba(15,23,42,0.65)',
  },

  
    pwdTierPriceLarge: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  
    pwdTierPriceUnitLarge: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },

  
    pwdTierQuotaHint: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: -0.05,
    marginTop: 2,
  },

  
    pwdTierCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },

  
    pwdTierCardCurrent: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.45)',
  },

  
    pwdTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  
    pwdTierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  
    pwdTierName: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  
    pwdTierNameDark: {
    color: '#0F172A',
  },

  
    pwdTierBadgePopular: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  
    pwdTierBadgePopularSelected: {
    backgroundColor: 'rgba(15,23,42,0.10)',
  },

  
    pwdTierBadgePopularText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  
    pwdTierBadgePopularTextSelected: {
    color: '#0F172A',
  },

  
    pwdTierBadgeCurrent: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(16,185,129,0.20)',
  },

  
    pwdTierBadgeCurrentText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.4,
  },

  
    pwdTierPriceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  
    pwdTierPrice: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  
    pwdTierPriceDark: {
    color: '#0F172A',
  },

  
    pwdTierPriceUnit: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },

  
    pwdTierPriceUnitDark: {
    color: 'rgba(15,23,42,0.55)',
  },

  
    pwdTierRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    pwdTierRadioSelectedOnWhite: {
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
  },

  
    pwdTierRadioCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },

  
    pwdTierRadioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },

  
    pwdTierMeta: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: -0.1,
  },

  
    pwdTierMetaDark: {
    color: 'rgba(15,23,42,0.65)',
  },

  
    pwdBottomBar: {
    paddingHorizontal: 20,
    paddingTop: 6,
    backgroundColor: '#0B0F19',
    gap: 6,
  },

  
    pwdPrimaryButton: {
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    pwdPrimaryButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  
    pwdPrimaryButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },

  
    pwdFooterHint: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.05,
  },

  
    pwdFooterLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  
    pwdFooterLinksSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  
    pwdFooterLinkPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    pwdFooterLink: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.05,
    textAlign: 'center',
    lineHeight: 16,
  },

  
    pwdGhostButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    pwdGhostButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.1,
  },

  
    pwdManageLink: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 32,
    justifyContent: 'center',
    marginBottom: 8,
  },

  
    pwdManageLinkText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: -0.1,
  },

  
    reviewRoot: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },

  
    reviewHeaderBand: {
    paddingHorizontal: 16,
  },

  
    reviewPreviewBand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  
    reviewPreviewCard: {
    width: '100%',
    flex: 1,
    maxHeight: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#0B0F19',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },

  
    reviewPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  
    reviewActionBand: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },

  
    discoveryCardCaption: {
    marginTop: 4,
    paddingHorizontal: 2,
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 16,
    letterSpacing: -0.15,
    minHeight: 28,
  },

  
    discoveryWideCardCaption: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
    minHeight: 36,
  },

  
    discoveryDenseCardCaption: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    minHeight: 42,
  },

  
    styleRowSeeAllTileImage: {
    width: '100%',
    aspectRatio: 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
    styleRowSeeAllCaptionSpacer: {
    marginTop: 4,
    minHeight: 28,
  },

  
    resultRoot: {
    flex: 1,
    backgroundColor: DARK_BG,
    flexDirection: 'column',
  },

  
    resultHeaderBand: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  
    resultPreviewBand: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 0,
  },

  
    resultActionBand: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },

  
    resultLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    zIndex: 10,
  },

  
    resultLoadingTitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 17,
    fontWeight: '700',
    color: PAPER,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  
    resultLoadingSubtitle: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 13,
    fontWeight: '500',
    color: DARK_MUTED,
    textAlign: 'center',
    minHeight: 18,
  },

  
    resultLoadingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },

  
    resultLoadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  
    resultLoadingDotActive: {
    backgroundColor: PAPER,
    transform: [{ scale: 1.2 }],
  },

  
    resultChipDotLoading: {
    backgroundColor: '#F59E0B',
  },

  
    resultCompareHintText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '600',
    color: DARK_MUTED,
    letterSpacing: -0.05,
  },

  
    resultActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },

  
    resultActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: PAPER,
  },

  
    resultActionButtonSaved: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.38)',
  },

  
    resultActionButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.1,
  },

  
    resultActionButtonTextSaved: {
    color: '#10B981',
  },

  
    resultGhostButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: DARK_CHIP,
    borderWidth: 1,
    borderColor: DARK_BORDER,
  },

  
    resultGhostButtonText: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 14,
    fontWeight: '600',
    color: PAPER,
    letterSpacing: -0.05,
  },

  
    sliderKnobIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },

  
    resultCompareCanvas: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },

  
    resultCompareImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  
    resultPreviewCard: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#0B0F19',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },

  
    resultCompareHintOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(11, 15, 25, 0.55)',
    zIndex: 4,
  },

  
    resultLoadingStatusHint: {
    fontFamily: FONT_PLUS_JAKARTA,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 16,
  },

  
    pwdFootnoteTextCancel: {
    color: '#EF4444',
    fontWeight: '600',
  },

  
    pwdManageLinkTextCancel: {
    fontWeight: '700',
  }
});

export default styles;
