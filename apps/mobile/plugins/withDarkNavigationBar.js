/**
 * Stop Android from forcing a light contrast scrim on the system nav bar
 * (shows up as a white/grey strip when the bar is hidden or translucent).
 */
const { withAndroidStyles } = require('@expo/config-plugins');

function withDarkNavigationBar(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults;
    const appTheme = styles.resources?.style?.find(
      (entry) => entry?.$?.name === 'AppTheme',
    );
    if (!appTheme) return cfg;

    if (!Array.isArray(appTheme.item)) {
      appTheme.item = appTheme.item ? [appTheme.item] : [];
    }

    const contrastItem = appTheme.item.find(
      (item) => item?.$?.name === 'android:enforceNavigationBarContrast',
    );
    if (contrastItem) {
      contrastItem._ = 'false';
    } else {
      appTheme.item.unshift({
        $: { name: 'android:enforceNavigationBarContrast', 'tools:targetApi': '29' },
        _: 'false',
      });
    }

    const hasWindowBg = appTheme.item.some(
      (item) => item?.$?.name === 'android:windowBackground',
    );
    if (!hasWindowBg) {
      appTheme.item.push({
        $: { name: 'android:windowBackground' },
        _: '@color/navigationBarColor',
      });
    }

    return cfg;
  });
}

module.exports = withDarkNavigationBar;
