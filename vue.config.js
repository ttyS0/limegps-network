// vue.config.js
module.exports = {
  pages: {
    index: {
      entry: 'front/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Index Page',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
  }
}
  