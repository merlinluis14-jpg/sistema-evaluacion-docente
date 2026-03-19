const { execSync } = require('child_process');
const output = execSync('git log -n 5 --format="%H|%s"').toString();
require('fs').writeFileSync('gitlog.json', JSON.stringify(output.split('\n')));
