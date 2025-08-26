// __mocks__/fs/promises.cjs
// Use memfs's fs.promises to mock node:fs/promises
const { fs } = require("memfs");
module.exports = fs.promises;
