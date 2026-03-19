const { execSync } = require('child_process');
try {
  const diff = execSync('git diff bc97fcf2174b5680618de48ca6c7baab442e4455..f66a840b29c1923b8c58a14b76e67fd133035f68').toString();
  require('fs').writeFileSync('gitdiff.txt', diff);
} catch (e) {
  require('fs').writeFileSync('gitdiff.txt', e.toString());
}
