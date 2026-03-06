import fs from 'fs';

const log = fs.readFileSync('type_errors_utf8.log', 'utf-8');
const lines = log.split('\n');

const fixes = {};
const regex = /^(.*?)\((\d+),(\d+)\): error (TS\d+):/;

lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
        const file = match[1];
        const lineNum = parseInt(match[2], 10);
        const tsCode = match[4];

        if (['TS6192', 'TS6196', 'TS6133'].includes(tsCode)) {
            if (!fixes[file]) fixes[file] = [];
            fixes[file].push({ lineNum, tsCode, original: line });
        }
    }
});

let modifiedFiles = 0;
for (const file of Object.keys(fixes)) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf-8').split('\n');
    let modified = false;

    // Sort descending to not mess up earlier line replacements if we were inserting new lines (we aren't, but still good practice)
    const fileFixes = fixes[file].sort((a, b) => b.lineNum - a.lineNum);

    for (const fix of fileFixes) {
        const idx = fix.lineNum - 1;
        if (idx < 0 || idx >= content.length) continue;

        let line = content[idx];

        if (fix.tsCode === 'TS6192') { // All imports unused
            if (!line.trim().startsWith('//')) {
                content[idx] = '// ' + line;
                modified = true;
            }
        }
        else if (fix.tsCode === 'TS6133' || fix.tsCode === 'TS6196') {
            const nameMatch = fix.original.match(/'([^']+)' is declared/);
            if (nameMatch) {
                const varName = nameMatch[1];
                const isImport = line.includes('import ') || line.includes('} from') || line.trim().startsWith('import');

                if (isImport) {
                    // Try to remove from destructuring pattern like `{ A, B }`
                    const wordRegex = new RegExp(`\\b${varName}\\b\\s*,?`);
                    let newLine = line.replace(wordRegex, '');
                    // Clean up empty braces or trailing commas
                    newLine = newLine.replace(/\{\s*,\s*/g, '{ ').replace(/,\s*\}/g, ' }').replace(/,\s*,/g, ',');
                    newLine = newLine.replace(/\{\s*\}/, '');

                    if (newLine.trim().startsWith('import from') || newLine.trim().startsWith('import  from') || newLine.trim().startsWith("import ''") || newLine === 'import ;') {
                        newLine = '// ' + line;
                    }
                    content[idx] = newLine;
                    modified = true;
                } else {
                    // For function params or variables, prefix with _
                    const wordRegex = new RegExp(`\\b${varName}\\b`);
                    if (wordRegex.test(line) && !line.includes(`_${varName}`)) {
                        content[idx] = line.replace(wordRegex, `_${varName}`);
                        modified = true;
                    }
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, content.join('\n'));
        modifiedFiles++;
    }
}
console.log(`Modified ${modifiedFiles} files.`);
