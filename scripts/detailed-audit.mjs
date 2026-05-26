import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT_DIR, 'src');

console.log('ROOT_DIR:', ROOT_DIR);
console.log('SRC_DIR:', SRC_DIR);

// Recursive walk
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'reports') {
                results = results.concat(walk(fullPath));
            }
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walk(SRC_DIR);
console.log(`Found ${allFiles.length} files under src/`);

const fileStats = [];
const importMap = {}; // file -> set of dependencies
const importedBy = {}; // dependency file -> set of files importing it

// Normalize file paths to be relative to SRC_DIR or ROOT_DIR
function getRelative(p) {
    return path.relative(SRC_DIR, p).replace(/\\/g, '/');
}

// Resolve import path
function resolveImport(sourceFile, importStr) {
    if (!importStr.startsWith('.')) {
        // Absolute import (like 'src/...' or library)
        if (importStr.startsWith('src/')) {
            const absPath = path.resolve(ROOT_DIR, importStr);
            return findActualFile(absPath);
        }
        // Might be a library or aliased path
        return null;
    }
    const dir = path.dirname(sourceFile);
    const absPath = path.resolve(dir, importStr);
    return findActualFile(absPath);
}

function findActualFile(basePath) {
    const extensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.svg', '.json'];
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
        return basePath;
    }
    for (const ext of extensions) {
        const p = basePath + ext;
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            return p;
        }
        const indexP = path.join(basePath, 'index' + ext);
        if (fs.existsSync(indexP) && fs.statSync(indexP).isFile()) {
            return indexP;
        }
    }
    return null;
}

// Prepare importedBy tracking
allFiles.forEach(f => {
    const rel = getRelative(f);
    importedBy[rel] = new Set();
    importMap[rel] = new Set();
});

const arabicTypos = [];
const brokenImports = [];
const complexFiles = [];

// Regex to find imports
const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
const exportRegex = /export\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const rel = getRelative(file);
    const byteSize = fs.statSync(file).size;

    // Stat
    fileStats.push({
        file: rel,
        lines: lines.length,
        size: byteSize
    });

    // Detect Arabic commas/semicolons/question marks in JS/TS/TSX files outside strings and comments
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        let insideStringSingle = false;
        let insideStringDouble = false;
        let insideStringTemplate = false;
        let insideLineComment = false;
        let insideBlockComment = false;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const nextChar = content[i + 1];
            const prevChar = content[i - 1];

            // Handle comments
            if (!insideStringSingle && !insideStringDouble && !insideStringTemplate) {
                if (insideLineComment && char === '\n') {
                    insideLineComment = false;
                }
                if (insideBlockComment && char === '*' && nextChar === '/') {
                    insideBlockComment = false;
                    i++;
                    continue;
                }
                if (!insideLineComment && !insideBlockComment) {
                    if (char === '/' && nextChar === '/') {
                        insideLineComment = true;
                        i++;
                        continue;
                    }
                    if (char === '/' && nextChar === '*') {
                        insideBlockComment = true;
                        i++;
                        continue;
                    }
                }
            }

            // Handle strings
            if (!insideLineComment && !insideBlockComment) {
                if (char === "'" && prevChar !== '\\' && !insideStringDouble && !insideStringTemplate) {
                    insideStringSingle = !insideStringSingle;
                } else if (char === '"' && prevChar !== '\\' && !insideStringSingle && !insideStringTemplate) {
                    insideStringDouble = !insideStringDouble;
                } else if (char === '`' && prevChar !== '\\' && !insideStringSingle && !insideStringDouble) {
                    insideStringTemplate = !insideStringTemplate;
                }
            }

            // Check Arabic characters outside comments and string literals
            if (!insideLineComment && !insideBlockComment && !insideStringSingle && !insideStringDouble && !insideStringTemplate) {
                if (char === '،') { // Arabic comma
                    const lineNum = content.substring(0, i).split('\n').length;
                    const charNum = i - content.lastIndexOf('\n', i);
                    arabicTypos.push({
                        file: rel,
                        line: lineNum,
                        column: charNum,
                        type: 'Arabic Comma (،)',
                        context: content.substring(Math.max(0, i - 15), Math.min(content.length, i + 15)).replace(/\n/g, ' ')
                    });
                }
                if (char === '؛') { // Arabic semicolon
                    const lineNum = content.substring(0, i).split('\n').length;
                    const charNum = i - content.lastIndexOf('\n', i);
                    arabicTypos.push({
                        file: rel,
                        line: lineNum,
                        column: charNum,
                        type: 'Arabic Semicolon (؛)',
                        context: content.substring(Math.max(0, i - 15), Math.min(content.length, i + 15)).replace(/\n/g, ' ')
                    });
                }
                if (char === '؟') { // Arabic question mark
                    const lineNum = content.substring(0, i).split('\n').length;
                    const charNum = i - content.lastIndexOf('\n', i);
                    arabicTypos.push({
                        file: rel,
                        line: lineNum,
                        column: charNum,
                        type: 'Arabic Question Mark (؟)',
                        context: content.substring(Math.max(0, i - 15), Math.min(content.length, i + 15)).replace(/\n/g, ' ')
                    });
                }
            }
        }
    }

    // Rough Cyclomatic Complexity metric
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        const branchPoints = (content.match(/\b(if|else\s+if|for|while|catch|switch|case|&&|\|\|)\b/g) || []).length;
        const mapsAndFilters = (content.match(/\.(map|filter|reduce|forEach|find|some|every)\(/g) || []).length;
        const totalComplexity = branchPoints + mapsAndFilters;
        if (totalComplexity > 30) {
            complexFiles.push({
                file: rel,
                complexityScore: totalComplexity,
                branchPoints,
                arrayMethods: mapsAndFilters,
                lines: lines.length
            });
        }
    }

    // Extract Imports
    let match;
    const processMatch = (importedStr) => {
        const resolved = resolveImport(file, importedStr);
        if (resolved) {
            const resolvedRel = getRelative(resolved);
            if (resolvedRel !== rel) {
                importMap[rel].add(resolvedRel);
                if (importedBy[resolvedRel]) {
                    importedBy[resolvedRel].add(rel);
                }
            }
        } else {
            // Check if it's a relative import that is broken
            if (importedStr.startsWith('.')) {
                brokenImports.push({
                    file: rel,
                    importString: importedStr,
                    resolvedPath: path.resolve(path.dirname(file), importedStr)
                });
            }
        }
    };

    // Reset regex indices
    importRegex.lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
        processMatch(match[1]);
    }
    exportRegex.lastIndex = 0;
    while ((match = exportRegex.exec(content)) !== null) {
        processMatch(match[1]);
    }
    dynamicImportRegex.lastIndex = 0;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        processMatch(match[1]);
    }
});

// Dependency Analysis: Traverse from Entry Points
const entryPoints = ['index.tsx', 'App.tsx'];
const visited = new Set();

function traverse(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const deps = importMap[file];
    if (deps) {
        deps.forEach(dep => traverse(dep));
    }
}

entryPoints.forEach(ep => {
    if (importMap[ep]) {
        traverse(ep);
    }
});

// Find unused files
const unusedFiles = [];
allFiles.forEach(f => {
    const rel = getRelative(f);
    // Ignore entrypoints and assets/styles/types config
    if (entryPoints.includes(rel)) return;
    if (rel.startsWith('types/') || rel.includes('.d.ts') || rel.includes('index.css') || rel.startsWith('config/')) return;
    if (rel.includes('vite-env') || rel.includes('analyze-codebase')) return;

    if (!visited.has(rel)) {
        unusedFiles.push({
            file: rel,
            importedByCount: importedBy[rel] ? importedBy[rel].size : 0,
            importedByFiles: importedBy[rel] ? Array.from(importedBy[rel]) : []
        });
    }
});

// Sort stats
fileStats.sort((a, b) => b.lines - a.lines);
complexFiles.sort((a, b) => b.complexityScore - a.complexityScore);

// Output report
const report = {
    summary: {
        totalFiles: allFiles.length,
        largeFilesCount: fileStats.filter(f => f.lines > 300).length,
        unusedFilesCount: unusedFiles.length,
        brokenImportsCount: brokenImports.length,
        arabicTyposCount: arabicTypos.length,
        complexFilesCount: complexFiles.length
    },
    topLargeFiles: fileStats.slice(0, 20),
    unusedFiles: unusedFiles.sort((a, b) => a.importedByCount - b.importedByCount),
    brokenImports,
    arabicTypos,
    complexFiles: complexFiles.slice(0, 20)
};

const outputDir = path.resolve(ROOT_DIR, 'reports');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(path.join(outputDir, 'detailed-audit-report.json'), JSON.stringify(report, null, 2));

console.log('AUDIT COMPLETED. Summary:');
console.log(JSON.stringify(report.summary, null, 2));
