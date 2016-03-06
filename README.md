# extricate-loader [![Build Status](https://travis-ci.org/erikdesjardins/extricate-loader.svg?branch=master)](https://travis-ci.org/erikdesjardins/extricate-loader) [![Coverage Status](https://coveralls.io/repos/github/erikdesjardins/extricate-loader/badge.svg?branch=master)](https://coveralls.io/github/erikdesjardins/extricate-loader?branch=master)

Webpack loader to extract content from the bundle.

A fork of [`extract-loader`](https://github.com/peerigon/extract-loader), which will better serve your needs if you only want to extract HTML or CSS.

## Installation

`npm install --save-dev extricate-loader`

## Options

By default, `extricate-loader` will resolve all `require()` expressions with Webpack's internal module loader and substitute the resolved values asynchronously.

If you supply a regexp for the `resolve` option, any path that matches will be required synchronously with Node's native `require()`.
This means that none of your Webpack loaders will apply.

This is necessary for `css-loader` to work, since it requires a helper module.

### Examples

All `.js` files: `extricate?resolve=%5C.js%24` (`encodeURIComponent('\\.js$')`

## Example Usage

**webpack.config.js:**
```js
module.exports = {
  entry: 'manifest.json',
  module: {
    loaders: [
      { test: /\.json$/, loaders: ['file?name=[name].[ext]', 'extricate', 'interpolate'] },
      { test: /\.js$/, loader: 'entry' },
      { test: /\.css$/, loaders: ['file', 'extricate?resolve=%5C.js%24', 'css'] },
      { test: /\.png$/, loader: 'file' }
    ]
  }
  // ...
};
```

**manifest.json:**

```json
{
  "scripts": "{{app.js}}",
  "css": "{{main.css}}"
}
```

**main.css:**

```css
body {
  background: url(bg.png);
}
```

### Output

**manifest.json:**

```json
{
  "scripts": "e43b20c069c4a01867c31e98cbce33c9.js",
  "css": "0dcbbaa701328a3c262cfd45869e351f.css"
}
```

**0dcbbaa701328a3c262cfd45869e351f.css:**

```css
body {
  background: url(7c57758b88216530ef48069c2a4c685a.png);
}
```

## License

Unlicense
