const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:\\\\Users\\\\MY PC\\\\.gemini\\\\antigravity-ide\\\\brain\\\\6055bf37-28d9-4c5e-8870-b837bb939c9b\\\\.system_generated\\\\steps\\\\451\\\\content.md', 'utf8');
const $ = cheerio.load(html);

console.log('--- From the dashboard ---');
let el = $('#from-the-dashboard').parent();
console.log(el.text() || 'Not found');

console.log('--- From the API ---');
let apiEl = $('#from-the-api').parent();
console.log(apiEl.text() || 'Not found');
