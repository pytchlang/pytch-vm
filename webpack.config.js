const path = require('path');
const webpack = require('webpack');
const shell = require('shelljs');
const chalk = require('chalk');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const git = new GitRevisionPlugin({branch: true});

const styleexcludes = [
    "node_modules",
    "support",
    "gen",
    "tokenize.js",
    "symtable.js",
    "compile.js",
    "ast.js",
    "internalpython.js",
    "tigerpython-parser.js",
];

if (!shell.which('git')) {
    console.log(chalk.red("WARNING: Cannot find git!  Unsure if working directory is clean."));
}

var output = shell.exec('git diff-index --quiet HEAD');
if (output.code !== 0) {
    console.log(chalk.red("WARNING: Working directory is not clean."));
} else {
    console.log("Working directory is clean.");
}

module.exports = (env, argv) => {
    var opt = {
        minimize: false
    };
    var outfile = 'skulpt.js';
    var assertfile = './assert-dev.js';
    var mod = {};
    var languageOut = (env && env.languageOut) || '';

    var extraPlugins = [];
    if (argv.mode === 'production') {
        opt = {
            emitOnErrors: false,
            minimize: true,
        };
        outfile = 'skulpt.min.js';
        assertfile = './assert-prod.js';
        extraPlugins = [new ESLintPlugin({
            extensions: ["js"],
            exclude: styleexcludes,
            overrideConfig: {
                rules: {
                    "brace-style": "off",
                    "semi": "off",
                    "indent": "off",
                    "curly": "off",
                    "quotes": "off",
                },
            },
        })];
    }

    var config = {
        entry: './src/main.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: outfile
        },
        devtool: 'source-map',
        plugins: [
            new CleanWebpackPlugin(),
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'debugger/debugger.js', to: 'debugger.js' }
                ],
            }),
            new webpack.DefinePlugin({
                GITVERSION: JSON.stringify(git.version()),
                GITHASH: JSON.stringify(git.commithash()),
                GITBRANCH: JSON.stringify(git.branch()),
                BUILDDATE: JSON.stringify(new Date())
            }),
            new CompressionWebpackPlugin({
                include: /^skulpt\.min\.js$/,
                algorithm: 'gzip'
            }),
            ...extraPlugins,
        ],
        optimization: opt,
        performance: {
            maxAssetSize: 1400000,
            maxEntrypointSize: 1400000,
        },
        resolve: {
            alias: {
                'assert': assertfile,
            }
        },

        module: mod,
        // uncomment this while working on closure compiler errors
        // externals: {
        //     jsbi: "JSBI",
        // }
    };

    return config;
};
