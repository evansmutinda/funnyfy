/**
 * Wire Android release builds to a real keystore instead of the debug key.
 *
 * After prebuild, create apps/mobile/keystore.properties from keystore.properties.example
 * and place your .jks file at the path listed there.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'funnyfyReleaseSigning';

const SIGNING_CONFIG_BLOCK = `
        ${MARKER} {
            def keystorePropsFile = rootProject.file("../keystore.properties")
            if (keystorePropsFile.exists()) {
                def keystoreProps = new Properties()
                keystoreProps.load(new FileInputStream(keystorePropsFile))
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }`;

function injectReleaseSigning(buildGradle) {
  if (buildGradle.includes(MARKER)) {
    return buildGradle;
  }

  let next = buildGradle;

  if (next.includes('signingConfigs {')) {
    next = next.replace(/(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\s*)/m, `$1${SIGNING_CONFIG_BLOCK}\n`);
  } else {
    next = next.replace(
      /android\s*\{/,
      `android {
    signingConfigs {${SIGNING_CONFIG_BLOCK}
    }`
    );
  }

  next = next.replace(
    /(buildTypes\s*\{\s*release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    `$1signingConfig signingConfigs.${MARKER}.storeFile != null ? signingConfigs.${MARKER} : signingConfigs.debug`
  );

  return next;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy') {
      mod.modResults.contents = injectReleaseSigning(mod.modResults.contents);
    }
    return mod;
  });
};
