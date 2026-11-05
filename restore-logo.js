// restore-logo.js — 把项目内定制的页头 logo 恢复到 refs-cli 静态资产位
// 作用：npm install 重装依赖会还原 node_modules，本脚本在构建前恢复定制 logo（幂等）
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'assets', 'quickreference.svg');
const dst = path.join(__dirname, 'node_modules', 'refs-cli', 'static', 'assets', 'quickreference.svg');

if (!fs.existsSync(src)) {
  console.warn('restore-logo: assets/quickreference.svg 缺失，跳过');
  process.exit(0);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log('restore-logo: 页头 logo 已恢复到 refs-cli 静态资产位');
