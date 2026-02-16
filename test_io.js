const fs = require('fs');
fs.writeFileSync('test_io.txt', 'hello');
const content = fs.readFileSync('test_io.txt', 'utf8');
console.log(content);
fs.unlinkSync('test_io.txt');
