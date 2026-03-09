const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\00cd16fb-7ce6-4289-b7f1-a0eb91141a9e\\.system_generated\\steps\\160\\output.txt';
const outputPath = path.join(__dirname, 'src', 'core', 'database.types.ts');

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const parsed = JSON.parse(content);
    fs.writeFileSync(outputPath, parsed.types, 'utf8');
    console.log('Successfully wrote types to ' + outputPath);
} catch (e) {
    console.error('Error:', e);
}
