const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "fs": false,
                    "os": require.resolve("os-browserify/browser"),
                    "stream": require.resolve("stream-browserify"),
                    "process": require.resolve("process/browser"),
                    "path": require.resolve("path-browserify")
                }
            },
        },
        plugins: {
            add: [
                new webpack.ProvidePlugin({
                    process: "process/browser"
                })
            ]
        }
    }
};
