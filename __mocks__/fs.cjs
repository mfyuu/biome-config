// __mocks__/fs.cjs
// Use memfs's fs object to mock node:fs
const { fs } = require("memfs");
module.exports = fs;
