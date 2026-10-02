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
    'http://localhost:3000/tools/compress-pdf',
    'http://localhost:3000/tools/edit-pdf',
    'http://localhost:3000/tools/pdf-to-image',
    'http://localhost:3000/tools/protect-pdf',
    'http://localhost:3000/tools/pdf-to-powerpoint',
    'http://localhost:3000/background-remover',
    'http://localhost:3000/tools/background-remover',
    'http://localhost:3000/image-converter',
    'http://localhost:3000/tools/image-converter'
];

async function checkAll() {
    console.log('Testing HTTP responses across active Toolino platform endpoints...\n');
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

    // Verify removed tool returns 404
    console.log('\nTesting that removed Unlock PDF route returns 404 Not Found...');
    try {
        const removedRes = await fetch('http://localhost:3000/tools/unlock-pdf');
        if (removedRes.status === 404) {
            console.log('  ✓ 404 Not Found: http://localhost:3000/tools/unlock-pdf (Successfully removed)');
        } else {
            console.log(`  ✗ Expected 404 but got ${removedRes.status} for http://localhost:3000/tools/unlock-pdf`);
            failures++;
        }
    } catch (e) {
        console.log(`  ✗ FAIL checking removed route: ${e.message}`);
        failures++;
    }

    if (failures === 0) {
        console.log('\n🎉 ALL ROUTES VALIDATED WITH 0 FAILURES!');
    } else {
        console.log(`\n❌ Completed with ${failures} route failures.`);
        process.exit(1);
    }
}

checkAll();