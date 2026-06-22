const {
  withAndroidStyles,
  withMainActivity,
  AndroidConfig,
} = require('expo/config-plugins');

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
 * After changing: npx expo prebuild --platform android --clean && rebuild APK.
 * JS reload alone is not enough. See To do/ENTRY_INTEGRATION.md + MD/UI_REDESIGN_2026_06.md §1.
 */
function withAndroidNavBarContrast(config) {
  config = withAndroidStyles(config, (config) => {
    const parent = AndroidConfig.Styles.getAppThemeGroup();
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent,
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
    });
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent,
      name: 'android:windowDrawsSystemBarBackgrounds',
      value: 'true',
    });
    return config;
  });

  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes(EDGE_TO_EDGE_MARKER)) {
      if (!contents.includes('import androidx.core.view.WindowCompat')) {
        contents = contents.replace(
          'import android.os.Bundle',
          'import android.os.Bundle\nimport androidx.core.view.WindowCompat',
        );
      }
      contents = contents.replace(
        /super\.onCreate\(null\)/,
        `${EDGE_TO_EDGE_MARKER}\n    super.onCreate(null)`,
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidNavBarContrast;
