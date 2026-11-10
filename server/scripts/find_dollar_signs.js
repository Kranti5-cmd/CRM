const fs = require('fs');
const path = require('path');

function searchDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full, results);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // match $ not part of ${
        if (/\$(?!\{)/.test(line)) {
          results.push({ file: full, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return results;
}

const hits = searchDir('c:\\Users\\KRANTI\\CRM\\client\\src');
console.log(`Found ${hits.length} currency dollar occurrences:`);
hits.forEach(h => console.log(`${path.basename(h.file)}:${h.line}: ${h.text}`));

