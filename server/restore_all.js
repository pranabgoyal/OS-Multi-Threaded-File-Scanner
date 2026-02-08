/* eslint-disable */
const fs = require('fs');
const path = require('path');

const quarantineDir = path.resolve(__dirname, '../../quarantine');
const quarantineLog = path.resolve(quarantineDir, 'quarantine.log');

console.log(`📂 Quarantine Dir: ${quarantineDir}`);
console.log(`📝 Log File: ${quarantineLog}`);

if (!fs.existsSync(quarantineLog)) {
    console.log("✅ No quarantine log found. Nothing to restore.");
    process.exit(0);
}

let content = fs.readFileSync(quarantineLog, 'utf8');
let logEntries = content.split('\n')
    .filter(l => l.trim().length > 0)
    .map(l => { try { return JSON.parse(l); } catch (e) { return null; } })
    .filter(e => e !== null);

console.log(`🔍 Found ${logEntries.length} entries in log.`);

let restoredCount = 0;
let failedCount = 0;
let remainingEntries = [];

logEntries.forEach(entry => {
    const source = path.join(quarantineDir, entry.file);
    const dest = entry.original;

    if (!fs.existsSync(source)) {
        console.error(`❌ File missing in quarantine: ${entry.file}`);
        // Remove from log anyway since we can't restore it? 
        // Or keep it? Let's remove it if it's gone.
        return;
    }

    try {
        // Ensure parent dir exists
        const parentDir = path.dirname(dest);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.renameSync(source, dest);
        console.log(`✅ Restored: ${entry.file} -> ${dest}`);
        restoredCount++;
    } catch (e) {
        console.error(`❌ Failed to restore ${entry.file}: ${e.message}`);
        failedCount++;
        remainingEntries.push(entry);
    }
});

// Update log with only failed/remaining entries
if (remainingEntries.length === 0) {
    fs.writeFileSync(quarantineLog, '', 'utf8');
    console.log("🧹 Quarantine log cleared.");
} else {
    const newContent = remainingEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
    fs.writeFileSync(quarantineLog, newContent, 'utf8');
    console.log(`⚠️ Updated log with ${remainingEntries.length} remaining entries.`);
}

console.log(`\n🎉 Restoration Complete: ${restoredCount} restored, ${failedCount} failed.`);
