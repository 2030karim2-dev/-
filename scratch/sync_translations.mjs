import fs from 'fs';

const arPath = './src/lib/locales/ar.json';
const enPath = './src/lib/locales/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function findMissingKeys(source, target, currentPath = '') {
    let missing = [];
    for (const key in source) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        if (!(key in target)) {
            missing.push({ path, value: source[key] });
        } else if (typeof source[key] === 'object' && source[key] !== null) {
            missing = missing.concat(findMissingKeys(source[key], target[key], path));
        }
    }
    return missing;
}

const missing = findMissingKeys(ar, en);
console.log(`Total missing keys in en.json: ${missing.length}`);
fs.writeFileSync('./scratch/missing_keys.json', JSON.stringify(missing, null, 2));
console.log('Saved missing keys to ./scratch/missing_keys.json');
