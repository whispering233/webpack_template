// Node.js的核心模块，专门用来处理文件路径
// 相当于 python os
const path = require("path");
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const os = require("os");
// 进程本身也会有资源消耗
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const PreloadWebpackPlugin = require("@vue/preload-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

// cpu核数
const threads = os.cpus().length;

// 获取处理样式的Loaders
const getStyleLoaders = (preProcessor) => {
    return [
        MiniCssExtractPlugin.loader,
        "css-loader",
        {
            loader: "postcss-loader",
            options: {
                postcssOptions: {
                    plugins: [
                        "postcss-preset-env", // 能解决大多数样式兼容性问题
                    ],
                },
            },
        },
        preProcessor,
    ].filter(Boolean);
};

module.exports = {
    // 入口
    // 相对路径和绝对路径都行
    entry: "./src/main.js",
    // 输出
    output: {
        // path: 文件输出目录，必须是绝对路径
        // path.resolve()方法返回一个绝对路径
        // __dirname 当前文件的文件夹绝对路径
        // 生产模式需要输出 开发模式不需要输出
        // path: path.resolve(__dirname, "../dist"),
        path: undefined, // 开发模式没有输出，不需要指定输出目录
        // filename: 输出文件名
        filename: "static/js/[name].js", // 入口文件打包输出资源命名方式
        chunkFilename: "static/js/[name].chunk.js", // 动态导入输出资源命名方式
        assetModuleFilename: "static/media/[name].[hash][ext]", // 图片、字体等资源命名方式（注意用hash）
        clean: true
    },
    // 加载器
    module: {
        rules: [
            {
                oneOf: [
                    {
                        // 文件匹配规则
                        test: /\.css$/,
                        // use 处理顺序 从右到左，从左到右
                        use: getStyleLoaders(),
                    },
                    {
                        // 文件匹配规则
                        test: /\.less$/,
                        // use 处理顺序 从右到左，从左到右
                        use: getStyleLoaders("less-loader")
                    },
                    {
                        test: /\.s[ac]ss$/,
                        use: getStyleLoaders("sass-loader"),
                    },
                    {
                        test: /\.styl$/,
                        use: getStyleLoaders("stylus-loader"),
                    },
                    {
                        test: /\.(png|jpe?g|gif|webp)$/,
                        type: "asset",
                        parser: {
                            dataUrlCondition: {
                                maxSize: 10 * 1024 // 小于10kb的图片会被base64处理
                            }
                        },
                        // generator: {
                        //     // 将图片文件输出到 static/imgs 目录中
                        //     // 将图片文件命名 [hash:8][ext][query]
                        //     // [hash:8]: hash值取8位
                        //     // [ext]: 使用之前的文件扩展名
                        //     // [query]: 添加之前的query参数
                        //     filename: "static/imgs/[hash:8][ext][query]",
                        // },
                    },
                    {
                        test: /\.(ttf|woff2?|map4|map3|avi)$/,
                        type: "asset/resource",
                        // generator: {
                        //     filename: "static/media/[hash:8][ext][query]",
                        // },
                    },
                    {
                        test: /\.js$/,
                        // 排除node_modules代码不编译
                        // exclude: /node_modules/,
                        // 两个只能同时用一个
                        include: path.resolve(__dirname, "../src"), // 也可以用包含
                        use: [
                            {
                                loader: "thread-loader", // 开启多进程
                                options: {
                                    workers: threads, // 数量
                                },
                            },
                            {
                                loader: "babel-loader",
                                options: {
                                    cacheDirectory: true, // 开启babel编译缓存
                                    cacheCompression: false, // 缓存文件不要压缩
                                    plugins: [
                                        "@babel/plugin-transform-runtime" // 减少代码体积
                                    ]
                                },
                            }
                        ]
                    },
                ]
            }
        ],
    },
    // 插件
    plugins: [
        new ESLintWebpackPlugin({
            // 指定检查文件的根目录
            context: path.resolve(__dirname, "../src"),
            cache: true, // 开启缓存
            // 缓存目录
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"),
            threads, // 开启多进程
        }),
        new HtmlWebpackPlugin({
            // 以 public/index.html 为模板创建文件
            // 新的html文件有两个特点：1. 内容和源文件一致 2. 自动引入打包生成的js等资源
            template: path.resolve(__dirname, "../src/public/index.html"),
        }),
        // 提取css成单独文件
        new MiniCssExtractPlugin({
            // 定义输出文件名和目录
            filename: "static/css/[name].css",
            chunkFilename: "static/css/[name].chunk.css",
        }),
        new PreloadWebpackPlugin({
            rel: "preload", // preload兼容性更好
            as: "script",
            // rel: 'prefetch' // prefetch兼容性更差
        }),
        new WorkboxPlugin.GenerateSW({
            // 这些选项帮助快速启用 ServiceWorkers
            // 不允许遗留任何“旧的” ServiceWorkers
            clientsClaim: true,
            skipWaiting: true,
        }),
    ],
    optimization: {
        // 开发模式不用压缩
        // minimizer: [
        //     // css压缩
        //     new CssMinimizerPlugin(),
        //     // js压缩
        //     new TerserPlugin({
        //         parallel: threads,
        //     }),
        //     // 压缩图片
        //     new ImageMinimizerPlugin({
        //         minimizer: {
        //             implementation: ImageMinimizerPlugin.imageminGenerate,
        //             options: {
        //                 plugins: [
        //                     ["gifsicle", { interlaced: true }],
        //                     ["jpegtran", { progressive: true }],
        //                     ["optipng", { optimizationLevel: 5 }],
        //                     [
        //                         "svgo",
        //                         {
        //                             plugins: [
        //                                 "preset-default",
        //                                 "prefixIds",
        //                                 {
        //                                     name: "sortAttrs",
        //                                     params: {
        //                                         xmlnsOrder: "alphabetical",
        //                                     },
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 ],
        //             },
        //         },
        //     }),
        // ],
        // 代码分割配置
        splitChunks: {
            chunks: "all", // 对所有模块都进行分割
            // 以下是默认值
            // minSize: 20000, // 分割代码最小的大小
            // minRemainingSize: 0, // 类似于minSize，最后确保提取的文件大小不能为0
            // minChunks: 1, // 至少被引用的次数，满足条件才会代码分割
            // maxAsyncRequests: 30, // 按需加载时并行加载的文件的最大数量
            // maxInitialRequests: 30, // 入口js文件最大并行请求数量
            // enforceSizeThreshold: 50000, // 超过50kb一定会单独打包（此时会忽略minRemainingSize、maxAsyncRequests、maxInitialRequests）
            // cacheGroups: { // 组，哪些模块要打包到一个组
            //   defaultVendors: { // 组名
            //     test: /[\\/]node_modules[\\/]/, // 需要打包到一起的模块
            //     priority: -10, // 权重（越大越高）
            //     reuseExistingChunk: true, // 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块
            //   },
            //   default: { // 其他没有写的配置会使用上面的默认值
            //     minChunks: 2, // 这里的minChunks权重更大
            //     priority: -20,
            //     reuseExistingChunk: true,
            //   },
            // },
            // 修改配置
            cacheGroups: {
                // 组，哪些模块要打包到一个组
                // defaultVendors: { // 组名
                //   test: /[\\/]node_modules[\\/]/, // 需要打包到一起的模块
                //   priority: -10, // 权重（越大越高）
                //   reuseExistingChunk: true, // 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块
                // },
                default: {
                    // 其他没有写的配置会使用上面的默认值
                    minSize: 0, // 我们定义的文件体积太小了，所以要改打包的最小文件体积
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
        runtimeChunk: {
            name: (entrypoint) => `runtime~${entrypoint.name}`, // runtime文件命名规则
        }
    },
    devServer: {
        host: "localhost", // 启动服务器域名
        port: "3000", // 启动服务器端口号
        open: true, // 是否自动打开浏览器
        hot: true, // 开启HMR功能（只能用于开发环境，生产环境不需要了）
    },
    // 模式
    mode: "development",
    devtool: "cheap-module-source-map", // 开发模式
};
