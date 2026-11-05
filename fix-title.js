// 构建后处理：修正首页 <title> 的重复拼接（refs-cli 对首页固定生成 "页面标题 & 站点名"）
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(file)) process.exit(0);
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<title>[^<]*&[^<]*<\/title>/, '<title>Coding Reference</title>');
fs.writeFileSync(file, html);
console.log('fix-title: homepage <title> normalized');
