/** App shell color — keep in sync with styles.js DARK_BG */
const DARK_BG = '#0B0F19';

/** Runtime + native nav bar — solid dark (transparency removed; unreliable on APK). */
function navBarColorRuntime() {
  return DARK_BG;
}

function navBarColorNative() {
  return DARK_BG;
}

module.exports = {
  DARK_BG,
  navBarColorRuntime,
  navBarColorNative,
};
