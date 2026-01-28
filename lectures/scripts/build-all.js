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

console.log(`Found ${lectures.length} lectures to build:\n`);

let successCount = 0;
let failCount = 0;

lectures.forEach((lecture) => {
  const slidesPath = `${lecture}/slides.md`;
  const outputDir = `dist/${lecture}`;
  
  console.log(`\n📦 Building ${lecture}...`);
  
  try {
    execSync(`npx slidev build ${slidesPath} -o ${outputDir}`, {
      stdio: 'inherit',
      cwd: lecturesDir
    });
    console.log(`✅ ${lecture} built successfully`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to build ${lecture}`);
    failCount++;
  }
});

console.log(`\n\n🎉 Build complete!`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);

process.exit(failCount > 0 ? 1 : 0);
