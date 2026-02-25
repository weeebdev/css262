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
  const slidesFullPath = path.join(lecturesDir, slidesPath);
  const pdfFullPath = path.join(lecturesDir, outputPath);

  // Skip if PDF exists and slides.md is unchanged
  if (fs.existsSync(pdfFullPath)) {
    const slidesStat = fs.statSync(slidesFullPath);
    const pdfStat = fs.statSync(pdfFullPath);
    if (slidesStat.mtimeMs <= pdfStat.mtimeMs) {
      console.log(`\n⏭️  Skipping ${lecture} (PDF is up to date)`);
      successCount++;
      return;
    }
  }

  const hasMermaid = fs.readFileSync(slidesFullPath, 'utf8').includes('```mermaid');
  const extraArgs = hasMermaid ? '--per-slide --timeout 60000' : '';

  console.log(`\n📄 Exporting ${lecture} to PDF${hasMermaid ? ' (with Mermaid, using --per-slide)' : ''}...`);

  try {
    execSync(`npx slidev export ${slidesPath} --output ${outputPath} ${extraArgs}`.trim(), {
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
