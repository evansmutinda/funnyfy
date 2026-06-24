const path = require('path');
const {
  withAndroidStyles,
  withMainActivity,
  withAndroidColors,
  AndroidConfig,
} = require('expo/config-plugins');

const { navBarColorNative } = require(path.join(__dirname, '..', 'constants', 'theme'));

const EDGE_TO_EDGE_MARKER = 'WindowCompat.setDecorFitsSystemWindows(window, false)';

/**
 * Android navigation bar — edge-to-edge + theme translucent DARK_BG.
 *
 * Why a custom plugin (SDK 52):
 * - expo-navigation-bar plugin does not set enforceNavigationBarContrast
 * - position:absolute from config only applies after JS loads unless MainActivity
 *   calls setDecorFitsSystemWindows(false) at startup
 * - Translucent nav bar only visible when content draws behind the bar (edge-to-edge)
 *
 * After changing theme.js or this file: npx expo prebuild --platform android --clean && rebuild APK.
 * JS reload alone is not enough. See To do/ENTRY_INTEGRATION.md + MD/UI_REDESIGN_2026_06.md §1.
 */
function injectMainActivityEdgeToEdge(contents) {
  if (contents.includes(EDGE_TO_EDGE_MARKER)) {
    return contents;
  }

  if (!contents.includes('import androidx.core.view.WindowCompat')) {
    contents = contents.replace(
      /import android\.os\.Bundle\r?\n/,
      'import android.os.Bundle\nimport androidx.core.view.WindowCompat\n',
    );
  }

  const replaced = contents.replace(
    /(fun onCreate\([^{]+\{)\s*\r?\n/,
    `$1\n    ${EDGE_TO_EDGE_MARKER}\n`,
  );

  if (replaced === contents) {
    const fallback = contents.replace(
      /(override fun onCreate\([^{]+\{)\s*\r?\n/,
      `$1\n    ${EDGE_TO_EDGE_MARKER}\n`,
    );
    return fallback;
  }

  return replaced;
}

function withAndroidNavBarContrast(config) {
  const navColor = navBarColorNative();

  config = withAndroidColors(config, (cfg) => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, {
      name: 'navigationBarColor',
      value: navColor,
    });
    return cfg;
  });

  config = withAndroidStyles(config, (cfg) => {
    const parent = AndroidConfig.Styles.getAppThemeGroup();
    const themeItems = [
      ['android:enforceNavigationBarContrast', 'false'],
      ['android:windowDrawsSystemBarBackgrounds', 'true'],
      ['android:navigationBarColor', '@color/navigationBarColor'],
    ];

    for (const [name, value] of themeItems) {
      cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
        add: true,
        parent,
        name,
        value,
      });
    }
    return cfg;
  });

  return withMainActivity(config, (cfg) => {
    cfg.modResults.contents = injectMainActivityEdgeToEdge(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withAndroidNavBarContrast;
