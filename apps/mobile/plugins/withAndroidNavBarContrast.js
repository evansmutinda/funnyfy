const { withAndroidStyles, AndroidConfig } = require('expo/config-plugins');

/**
 * SDK 52 expo-navigation-bar plugin does not set enforceNavigationBarContrast.
 * Without this, Android adds a grey scrim on 3-button navigation bars.
 */
function withAndroidNavBarContrast(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
    });
    return config;
  });
}

module.exports = withAndroidNavBarContrast;
