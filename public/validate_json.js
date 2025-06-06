// Script to validate JSON file
const fs = require('fs');
const path = require('path');

// Try to parse the updated JSON file
try {
    const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cap_updated.json'), 'utf8'));
    console.log('JSON validation successful!');
    
    // If successful, make a backup of original file
    fs.copyFileSync(
        path.join(__dirname, 'cap.json'),
        path.join(__dirname, 'cap.json.backup')
    );
    console.log('Backup of original file created as cap.json.backup');
    
    // Replace the original with the updated version
    fs.copyFileSync(
        path.join(__dirname, 'cap_updated.json'),
        path.join(__dirname, 'cap.json')
    );
    console.log('Original cap.json updated with standardized version');
    
} catch (error) {
    console.error('Error validating JSON:', error);
    process.exit(1);
}
