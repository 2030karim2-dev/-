const fs = require('fs');
const inputFile = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\e94fbb07-99fb-4d6c-8319-35a87d2392ac\\.system_generated\\steps\\1818\\output.txt';
const outputFile = 'C:\\Users\\User\\OneDrive\\Desktop\\alzhra smart\\src\\core\\database.types.ts';

const data = fs.readFileSync(inputFile, 'utf8');
const json = JSON.parse(data);

if (json && json.types) {
    fs.writeFileSync(outputFile, json.types, 'utf8');
    console.log('Types successfully extracted and saved.');
} else {
    console.error('Extraction failed: "types" property not found.');
}
