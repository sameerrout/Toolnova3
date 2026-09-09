const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/pdf-tools',
    'http://localhost:3000/about',
    'http://localhost:3000/login',
    'http://localhost:3000/signup',
    'http://localhost:3000/tools/image-to-pdf',
    'http://localhost:3000/tools/merge-pdf',
    'http://localhost:3000/tools/split-pdf',
    'http://localhost:3000/tools/rotate-pdf',
    'http://localhost:3000/tools/watermark-pdf',
    'http://localhost:3000/tools/pdf-page-numbers',
    'http://localhost:3000/tools/organize-pdf',
    'http://localhost:3000/tools/unlock-pdf',
    'http://localhost:3000/tools/compress-pdf',
    'http://localhost:3000/tools/edit-pdf',
    'http://localhost:3000/tools/pdf-to-image',
    'http://localhost:3000/tools/protect-pdf',
    'http://localhost:3000/tools/pdf-to-word',
    'http://localhost:3000/tools/word-to-pdf',
    'http://localhost:3000/tools/pdf-to-powerpoint',
    'http://localhost:3000/tools/powerpoint-to-pdf'
];

async function checkAll() {
    console.log('Testing HTTP responses across all 21 Toolnova platform endpoints...\n');
    let failures = 0;
    for (const u of urls) {
        try {
            const res = await fetch(u);
            if (res.status === 200) {
                console.log(`  ✓ 200 OK: ${u}`);
            } else {
                console.log(`  ✗ ${res.status}: ${u}`);
                failures++;
            }
        } catch (e) {
            console.log(`  ✗ FAIL: ${u} -> ${e.message}`);
            failures++;
        }
    }

    if (failures === 0) {
        console.log('\n🎉 ALL 21 TOOLNOVA ROUTES RETURNED 200 OK WITH 0 FAILURES!');
    } else {
        console.log(`\n❌ Completed with ${failures} route failures.`);
        process.exit(1);
    }
}

checkAll();