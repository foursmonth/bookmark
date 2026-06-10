const { defineConfig } = require("@vue/cli-service");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  configureWebpack: (config) => {
    const plugins = [
      new CopyPlugin({
        patterns: [{ from: "src/manifest.json", to: "./" }],
      }),
    ];

    // 生产构建时替换 mock 数据为空数组
    if (process.env.NODE_ENV === "production") {
      plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /mockBookmarks\.json$/,
          require.resolve("./src/common/mockBookmarks.empty.json")
        )
      );
    }

    config.plugins = config.plugins || [];
    config.plugins.push(...plugins);

    // 关闭性能提示（Chrome 扩展本地加载，体积影响较小）
    config.performance = {
      hints: false,
    };
  },
});
