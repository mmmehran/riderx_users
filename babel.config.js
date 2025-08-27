module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
  overrides: [{
    "plugins": [
      ["@babel/plugin-transform-private-methods", {
        "loose": true
      }]
    ]
  }]
};
