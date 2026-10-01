import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const sourceDir = path.resolve('c:/Users/samee/OneDrive/Desktop/ecommerce app/Toolnova');
const outputDir = path.resolve('c:/Users/samee/OneDrive/Desktop/project file');
const zipFileName = 'Toolino.zip';
const outputPath = path.join(outputDir, zipFileName);

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'brain',
  'dist',
  '.turbo',
]);

const EXCLUDE_FILES = new Set([
  'Toolnova.zip',
  'tsconfig.tsbuildinfo',
  '.eslintrc.json',
]);

async function createProjectZip() {
  console.log('🚀 Starting project zip generation...');
  console.log(`Source Directory: ${sourceDir}`);
  console.log(`Target Destination: ${outputPath}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zip = new JSZip();
  let fileCount = 0;
  let totalBytes = 0;

  function addDirectoryToZip(currentDir, relativePath = '') {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      const relPath = relativePath ? `${relativePath}/${item.name}` : item.name;

      if (item.isDirectory()) {
        if (EXCLUDE_DIRS.has(item.name) || relPath === 'backend/storage/jobs' || relPath.startsWith('backend/storage/jobs/')) {
          console.log(`  [Skipping directory]: ${relPath}`);
          continue;
        }
        addDirectoryToZip(fullPath, relPath);
      } else if (item.isFile()) {
        if (EXCLUDE_FILES.has(item.name) || item.name.endsWith('.log')) {
          console.log(`  [Skipping file]: ${relPath}`);
          continue;
        }
        const fileData = fs.readFileSync(fullPath);
        zip.file(relPath, fileData);
        fileCount++;
        totalBytes += fileData.length;
      }
    }
  }

  addDirectoryToZip(sourceDir);

  console.log(`📦 Bundling ${fileCount} files (${(totalBytes / (1024 * 1024)).toFixed(2)} MB uncompressed)...`);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(outputPath, content);
  const zipSizeMB = (content.length / (1024 * 1024)).toFixed(2);

  console.log(`✅ Successfully created zip archive:`);
  console.log(`   Path: ${outputPath}`);
  console.log(`   Size: ${zipSizeMB} MB (${content.length} bytes)`);
  console.log(`   Total files: ${fileCount}`);
}

createProjectZip().catch((err) => {
  console.error('❌ Error creating zip file:', err);
  process.exit(1);
});
