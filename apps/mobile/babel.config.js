module.exports = function (api) {
  api.cache(true);
  return {
    // SDK 54: babel-preset-expo configures Reanimated / Worklets plugins.
    // Do not add react-native-reanimated/plugin here — it conflicts with worklets.
    presets: ['babel-preset-expo'],
  };
};
