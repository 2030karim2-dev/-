import fs from 'fs';
import { execSync } from 'child_process';

const log = fs.readFileSync('type_errors_utf8.log', 'utf-8');
const lines = log.split('\n');

const fixes = {};
const regex = /^(.*?)\((\d+),(\d+)\): error (TS2724|TS2339):/;

lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
        const file = match[1];
        const lineNum = parseInt(match[2], 10);
        const tsCode = match[4];

        // TS2724: "has no exported member named '_Something'"
        // TS2339: "Property '_Something' does not exist on type..." (often destructured hooks)
        if (line.includes("'_")) {
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

    // Sort descending
    const fileFixes = fixes[file].sort((a, b) => b.lineNum - a.lineNum);

    for (const fix of fileFixes) {
        const idx = fix.lineNum - 1;
        if (idx < 0 || idx >= content.length) continue;

        let line = content[idx];
        const nameMatch = fix.original.match(/'(_[^']+)'/);
        if (nameMatch) {
            const badName = nameMatch[1];
            // If it's a member of an object or import, we should just remove it if it was added as a "fix" for unused status
            // Our previous script added it. We want to revert it (remove it) if it's in a list, or just remove the prefix if it's a variable.
            // Actually, if it's in an import list like `  _Store,`, we just want to remove the whole line or entry.

            if (line.includes(badName)) {
                // Try to remove the entry from a list (with optional comma)
                const wordRegex = new RegExp(`\\s*${badName}\\s*,?`);
                let newLine = line.replace(wordRegex, '');

                // If the line is now empty or just whitespace/punctuation, and it wasn't the main import line
                if (newLine.trim() === '' || newLine.trim() === ',' || newLine.trim() === '},') {
                    newLine = ''; // Mark for deletion or just empty it
                }

                content[idx] = newLine;
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, content.filter(l => l !== null).join('\n'));
        modifiedFiles++;
    }
}
console.log(`Cleaned up ${modifiedFiles} files.`);
