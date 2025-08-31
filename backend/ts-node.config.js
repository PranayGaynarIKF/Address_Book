const { resolve } = require('path');

module.exports = {
  require: ['tsconfig-paths/register'],
  project: resolve(__dirname, 'tsconfig.json'),
  transpileOnly: false
};
