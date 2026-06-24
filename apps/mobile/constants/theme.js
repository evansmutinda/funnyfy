/** App shell color — keep in sync with styles.js DARK_BG */
const DARK_BG = '#0B0F19';

/** Fraction of the system nav bar that shows content behind (0.30 = 30% transparent). */
const NAV_BAR_TRANSPARENT_FRACTION = 0.3;

function navBarOpacity() {
  return 1 - NAV_BAR_TRANSPARENT_FRACTION;
}

function alphaByteHex(opacity) {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

/** Runtime (setBackgroundColorAsync) — rgba parses reliably on Android after reload. */
function navBarColorRuntime() {
  return `rgba(11, 15, 25, ${navBarOpacity()})`;
}

function navBarBorderColorRuntime() {
  return '#00000000';
}

/** Native colors.xml (#AARRGGBB) — used by expo prebuild / androidNavigationBar. */
function navBarColorNative() {
  return `#${alphaByteHex(navBarOpacity())}${DARK_BG.slice(1)}`;
}

module.exports = {
  DARK_BG,
  NAV_BAR_TRANSPARENT_FRACTION,
  navBarColorRuntime,
  navBarBorderColorRuntime,
  navBarColorNative,
};
