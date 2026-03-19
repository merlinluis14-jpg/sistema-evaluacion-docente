const { execSync } = require('child_process');
try {
  const diff = execSync('git diff --stat 506e109b0cdad1458aaca2ed305d7d8426d74a3a..bc97fcf2174b5680618de48ca6c7baab442e4455').toString();
  require('fs').writeFileSync('gitstat.txt', diff);
} catch (e) {
  require('fs').writeFileSync('gitstat.txt', e.toString());
}
