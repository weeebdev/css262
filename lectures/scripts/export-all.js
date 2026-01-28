#!/usr/bin/env bun

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find all lecture directories
const lecturesDir = path.join(__dirname, '..');
const lectures = fs.readdirSync(lecturesDir)
  .filter(dir => dir.startsWith('lecture-'))
  .filter(dir => {
    const slidesPath = path.join(lecturesDir, dir, 'slides.md');
    return fs.existsSync(slidesPath);
  })
  .sort();

// Create exports directory if it doesn't exist
const exportsDir = path.join(lecturesDir, 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

console.log(`Found ${lectures.length} lectures to export:\n`);

let successCount = 0;
let failCount = 0;

lectures.forEach((lecture) => {
  const slidesPath = `${lecture}/slides.md`;
  const outputPath = `exports/${lecture}.pdf`;
  
  console.log(`\n📄 Exporting ${lecture} to PDF...`);
  
  try {
    execSync(`npx slidev export ${slidesPath} --output ${outputPath}`, {
      stdio: 'inherit',
      cwd: lecturesDir
    });
    console.log(`✅ ${lecture} exported successfully`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to export ${lecture}`);
    console.error(`Error: ${error.message}`);
    failCount++;
  }
});

console.log(`\n\n🎉 Export complete!`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);

process.exit(failCount > 0 ? 1 : 0);
