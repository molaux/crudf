var path = require('path');
module.exports = {
  entry: './src/index.js',
  devtool: 'cheap-source-map',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env", {
                targets: {
                  browsers: ['last 2 versions, not dead'],
                  // esmodules: true
                },
                modules: false
              }]
            ],
            plugins: [
              "transform-object-rest-spread",
              "@babel/transform-react-jsx",
              ["@babel/plugin-proposal-class-properties", { "loose": true }],
              ["@babel/plugin-proposal-private-methods", { "loose": true }],
              ["@babel/plugin-proposal-private-property-in-object", { "loose": true }]
            ]
          }
        }
      }
    ]
  },
  externals: [
    {
      'react': 'commonjs react',
      'react-dom': 'react-dom',
      "graphql": "graphql",
      "@apollo/client": "@apollo/client",
      "@apollo/client/react/hoc": "@apollo/client/react/hoc",
      "react-router-dom": "react-router-dom",
      "@date-io/date-fns": "@date-io/date-fns",
      'date-fns': 'date-fns',
    },
    /@mui\/.*/,
    /date-fns\/.*/,
    /graphql\/.*/
  ],
  optimization: {
    nodeEnv: false
  }
};