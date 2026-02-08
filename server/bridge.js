/* eslint-disable */
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const PORT = process.env.PORT || 8081;
const wss = new WebSocket.Server({ port: PORT });
const settingsFile = path.resolve(__dirname, '../../settings.json');
const autoScan = false; // Disable auto-scan by default

// Global State for new clients
let currentMetrics = {
  status: 'idle',
  filesScanned: 0,
  threatsDetected: 0,
  activeThreads: 0,
  totalThreads: 0,
  scanSpeed: 0,
  cpuLoad: 0,
  memoryUsage: 0,
  diskIO: 0
};

// Helper to broadcast to all connected clients
function broadcast(msg) {
  // Update global state if applicable
  if (msg.type === 'metrics') {
    currentMetrics = msg.data;
  }

  const data = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function loadSettings() {
  try {
    if (fs.existsSync(settingsFile)) return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (e) { }
  return { vtApiKey: "" };
}

function saveSettings(settings) {
  try {
    const current = loadSettings();
    const newSettings = { ...current, ...settings };
    fs.writeFileSync(settingsFile, JSON.stringify(newSettings, null, 2));
    return true;
  } catch (e) { return false; }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let currentScanId = 0;

/* ---------- SCAN FUNCTION ---------- */
let scannerProcess = null;
let lastMetrics = { filesScanned: 0, threatsDetected: 0 };
let scanStartTime = 0;
let activePath = "";

function startScan(scanPath, cpuLimit = 100) {
  const thisScanId = ++currentScanId;
  scanStartTime = Date.now();
  activePath = scanPath;
  lastMetrics = { filesScanned: 0, threatsDetected: 0 };
  let lastSpeedCalcTime = Date.now();
  let lastFilesCount = 0;

  if (scannerProcess) {
    console.log('⚠️ Stopping previous scan...');
    killProcessTree(scannerProcess.pid);
    scannerProcess = null;
  }

  // Send RESET to frontend
  broadcast({
    type: 'metrics',
    data: {
      filesScanned: 0,
      threatsDetected: 0,
      activeThreads: 0,
      totalThreads: 0, // Will be updated by scanner
      scanSpeed: 0,
      cpuLoad: 0,
      memoryUsage: 0,
      diskIO: 0,
      status: 'starting'
    }
  });

  console.log(`🔎 Starting scan for: ${scanPath} (CPU Limit: ${cpuLimit}%) - Detect Only Mode`);

  // CLOUD DEMO MODE: If on Render/Linux and scanning "root" paths, START SIMULATION
  const isCloudEnv = process.env.RENDER || process.platform === 'linux';

  if (isCloudEnv && (scanPath === '.' || scanPath === 'C:' || scanPath === 'C:\\' || scanPath === '/')) {
    console.log(`☁️ CLOUD MODE: Starting SIMULATED scan for: ${scanPath}`);
    simulateScan(thisScanId, cpuLimit);
    return;
  }

  // Validate Path
  if (!fs.existsSync(scanPath)) {
    console.error(`❌ Scan Path does not exist: "${scanPath}"`);
    broadcast({
      type: 'status',
      data: { scanning: false, error: `Path not found: ${scanPath}` }
    });
    return;
  }

  // Windows: Run .exe directly with CPU limit
  // ALWAYS ADD --detect-only to prevent auto-quarantine (Issue 3)
  const args = ['--headless', '--detect-only', scanPath];
  if (cpuLimit) {
    args.push('--cpu-limit', cpuLimit.toString());
  }

  // Debug spawn
  console.log(`🚀 Spawning: multithreaded-file-scanner.exe ${args.join(' ')}`);

  scannerProcess = spawn('multithreaded-file-scanner.exe', args, {
    cwd: path.resolve(__dirname, '../../'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdoutBuffer = '';
  scannerProcess.stdout.on('data', (data) => {
    // Ignore data if this is not the active scan
    if (thisScanId !== currentScanId) return;

    // Safety: Prevent buffer from growing indefinitely (Max 1MB)
    if (stdoutBuffer.length > 1024 * 1024) {
      console.error("⚠️ stdout buffer exceeded 1MB, clearing safety buffer");
      stdoutBuffer = "";
    }

    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop(); // Keep partial line for next chunk

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      // Parse for metrics tracking
      let msg = null;
      try {
        if (line.startsWith('{')) {
          msg = JSON.parse(line);
          if (msg.type === 'metrics' && msg.data) {
            // Update all metrics
            lastMetrics = {
              ...lastMetrics,
              ...msg.data
            };

            // Calculate real-time speed
            const now = Date.now();
            const timeDiff = now - lastSpeedCalcTime;
            if (timeDiff >= 1000) {
              const filesDiff = lastMetrics.filesScanned - lastFilesCount;
              if (filesDiff >= 0) {
                // If scanner provides speed, use it, otherwise calc
                // Actually, let's override with our calc if the scanner is silent or 0
                const calculatedSpeed = Math.round((filesDiff / timeDiff) * 1000);
                if (!msg.data.scanSpeed) {
                  msg.data.scanSpeed = calculatedSpeed;
                }
              }
              lastFilesCount = lastMetrics.filesScanned;
              lastSpeedCalcTime = now;
            }

            // Allow speed to pass through to global state
            if (msg.data.scanSpeed !== undefined) {
              currentMetrics.scanSpeed = msg.data.scanSpeed;
            }
          }
          // Handle "Action Required" alerts
          if (msg.type === 'alert') {
            // Ensure threat name exists
            if (!msg.data.threat || msg.data.threat === 'undefined') {
              msg.data.threat = "Suspicious Activity";
            }
          }
        }
      } catch (e) {
        // JSON parse failed for this line, likely partial data or log noise
      }

      // Broadcast everything
      if (msg) {
        broadcast(msg);
      }
    });
  });

  scannerProcess.stderr.on('data', (data) => {
    if (thisScanId !== currentScanId) return;
    console.error(`[Scanner ERR]: ${data}`);
  });

  scannerProcess.on('error', (err) => {
    console.error(`❌ Scanner Spawn Error: ${err.message}`);
    broadcast({
      type: 'status',
      data: { scanning: false, error: `Failed to start scanner: ${err.message}` }
    });
    broadcast({
      type: 'alert',
      data: {
        time: new Date().toLocaleTimeString(),
        type: 'system',
        threat: 'Backend Error',
        file: err.message,
        status: 'error'
      }
    });
  });

  scannerProcess.on('close', (code) => {
    if (thisScanId !== currentScanId) return;
    console.log(`✅ Scan finished with code ${code}`);

    // Persist History if successful completion (or user cancel, which might be code 0/1 depending on impl)
    if (lastMetrics.filesScanned > 0) {
      saveHistoryEntry({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        path: activePath,
        filesScanned: lastMetrics.filesScanned,
        threatsDetected: lastMetrics.threatsDetected,
        durationMs: Date.now() - scanStartTime,
        status: code === 0 ? 'completed' : 'cancelled'
      });

      // Push update
      broadcast({ type: 'history', data: loadHistory() });
    }

    // Process any remaining buffer
    if (stdoutBuffer.trim() && stdoutBuffer.startsWith('{')) {
      try {
        const msg = JSON.parse(stdoutBuffer);
        broadcast(msg);
      } catch (e) { }
    }
    stdoutBuffer = '';

    // Final Reset Broadcast
    const resetMetrics = {
      filesScanned: lastMetrics.filesScanned, // Keep final total
      threatsDetected: lastMetrics.threatsDetected, // Keep final total
      activeThreads: 0,
      scanSpeed: 0,
      cpuLoad: 0,
      memoryUsage: 0,
      diskIO: 0,
      status: 'completed'
    };
    broadcast({ type: 'metrics', data: resetMetrics });
    broadcast({ type: 'status', data: { scanning: false, code } });

    scannerProcess = null;
  });
}

/* ---------- CLOUD SIMULATION ENGINE ---------- */
function simulateScan(scanId, cpuLimit) {
  let filesScanned = 0;
  let threatsFound = 0;
  let activeThreads = Math.min(8, Math.ceil((cpuLimit / 100) * 8));
  let simSpeed = 50; // Initial speed

  console.log('🎭 Simulation Engine Started');

  // Broadcast "Starting" state
  broadcast({
    type: 'metrics',
    data: {
      status: 'SCANNING',
      filesScanned: 0,
      threatsDetected: 0,
      activeThreads: activeThreads,
      totalThreads: 8,
      scanSpeed: 0,
      cpuLoad: Math.floor(cpuLimit * 0.8),
      memoryUsage: 45,
      diskIO: 120
    }
  });

  // Mock File List for Visuals
  const mockFiles = [
    "kernel32.dll", "user32.dll", "ntdll.dll", "explorer.exe", "svchost.exe",
    "chrome.exe", "firefox.exe", "system.ini", "pagefile.sys", "registry.dat",
    "notes.txt", "image.png", "backup.zip", "setup.msi", "app.js"
  ];

  const simInterval = setInterval(() => {
    // Check if stopped
    if (scanId !== currentScanId) {
      clearInterval(simInterval);
      return;
    }

    // Dynamic Speed Curve (accelerate then stabilize)
    if (simSpeed < 800) simSpeed += Math.random() * 50;

    // Increment Stats
    let batch = Math.floor(simSpeed / 10); // Files per 100ms
    filesScanned += batch;

    // Random Threat Generation (rare)
    if (Math.random() > 0.98) {
      threatsFound++;
      const threatFile = `simulated_threat_${Math.floor(Math.random() * 1000)}.exe`;
      broadcast({
        type: 'alert',
        data: {
          id: `SIM-${Date.now()}`,
          file: `C:\\Windows\\Temp\\${threatFile}`,
          threat: "Simulated_Trojan.Win32",
          status: 'warning',
          time: new Date().toLocaleTimeString(),
          type: 'malware'
        }
      });
    }

    // Broadcast Metrics
    const metrics = {
      status: 'SCANNING',
      filesScanned: filesScanned,
      threatsDetected: threatsFound,
      activeThreads: Math.floor(activeThreads * (0.8 + Math.random() * 0.4)), // Fluctuate
      totalThreads: 8,
      scanSpeed: Math.floor(simSpeed),
      cpuLoad: Math.floor(cpuLimit * (0.9 + Math.random() * 0.1)),
      memoryUsage: 45 + Math.floor(filesScanned / 1000),
      diskIO: Math.floor(simSpeed * 0.5)
    };

    // Update global state
    currentMetrics = metrics;
    lastMetrics = { filesScanned, threatsDetected }; // Update lastMetrics for finish handler logic

    broadcast({ type: 'metrics', data: metrics });

    // Fake File Events (Waterfall)
    if (Math.random() > 0.5) {
      const file = mockFiles[Math.floor(Math.random() * mockFiles.length)];
      // We rely on the frontend to generate the blocks based on metrics delta, 
      // but we can also emit fileScanned if needed. 
      // Our existing logic uses metrics delta, so this is fine.
    }

    // Auto-finish after ~30 seconds or 10,000 files for demo
    if (filesScanned > 10000) {
      clearInterval(simInterval);
      // Finish
      broadcast({ type: 'metrics', data: { ...metrics, status: 'completed', activeThreads: 0 } });
      broadcast({ type: 'status', data: { scanning: false, code: 0 } });

      // Save Mock History
      saveHistoryEntry({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        path: "C:\\ (Cloud Demo)",
        filesScanned: filesScanned,
        threatsDetected: threatsFound,
        durationMs: 30000,
        status: 'completed'
      });
      broadcast({ type: 'history', data: loadHistory() });
      console.log('✅ Simulation Completed');
    }

  }, 100);
}

/* ---------- TERMINAL INPUT ---------- */
rl.on('line', (input) => {
  const cmd = input.trim();
  if (!cmd) return;

  if (cmd === 'stop') {
    if (scannerProcess) {
      killProcessTree(scannerProcess.pid);
      console.log('🛑 Scan stopped manually.');
    } else {
      console.log('No scan running.');
    }
  } else if (cmd === 'auto') {
    autoScan = !autoScan;
    console.log(`🔄 Auto-scan is now: ${autoScan ? 'ON' : 'OFF'}`);
  } else {
    // Treat as path
    startScan(cmd);
  }
});

/* ---------- HISTORY Persistence ---------- */
const historyFile = path.resolve(__dirname, '../../history.json');

function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  } catch (e) {
    console.error("Failed to load history:", e);
  }
  return [];
}

function saveHistoryEntry(entry) {
  const history = loadHistory();
  history.unshift(entry); // Add to top
  // Keep last 50
  if (history.length > 50) history.pop();

  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

/* ---------- SIGNATURE Management ---------- */
const signaturesFile = path.resolve(__dirname, '../../signatures.txt');

function loadSignatures() {
  try {
    if (fs.existsSync(signaturesFile)) {
      return fs.readFileSync(signaturesFile, 'utf8')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
  } catch (e) {
    console.error("Failed to load signatures:", e);
  }
  return [];
}

function saveSignatures(sigs) {
  try {
    const content = sigs.join('\n');
    fs.writeFileSync(signaturesFile, content, 'utf8');
    return true;
  } catch (e) {
    console.error("Failed to save signatures:", e);
    return false;
  }
}


/* ---------- UPLOAD & SCAN HANDLING ---------- */
const tempDir = path.resolve(__dirname, '../../temp_uploads');
try { if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir); } catch (e) { }

// Cleanup old temp files
// Cleanup old temp files (Async to prevent startup freeze)
fs.readdir(tempDir, (err, files) => {
  if (err) return;
  const now = Date.now();
  files.forEach(f => {
    const p = path.join(tempDir, f);
    fs.stat(p, (err, stats) => {
      if (err) return;
      if (now - stats.mtimeMs > 3600000) {
        fs.unlink(p, () => { }); // Delete > 1hr
      }
    });
  });
});

function handleUploadChunk(data, ws) {
  // data: { id: '...', fileName: '...', chunk: 'base64...', index: 0, total: 1, isLast: boolean }
  // Security: Sanitize fileName to prevent directory traversal
  const safeFileName = path.basename(data.fileName);
  const filePath = path.join(tempDir, `${data.id}_${safeFileName}`);

  try {
    const buffer = Buffer.from(data.chunk, 'base64');
    fs.appendFileSync(filePath, buffer);

    if (data.isLast) {
      console.log(`📦 File received: ${data.fileName}`);

      // Send completion event with absolute path
      const absolutePath = path.resolve(filePath);
      ws.send(JSON.stringify({
        type: 'uploadComplete',
        data: { file: data.fileName, path: absolutePath, status: 'uploaded' }
      }));

      // Robust delay and check
      setTimeout(() => {
        // Ensure path is normalized and absolute
        const absolutePath = path.resolve(filePath);

        console.log(`🔎 Triggering scan for uploaded file: "${absolutePath}"`);

        if (!fs.existsSync(absolutePath)) {
          console.error(`❌ Uploaded file not found on disk: ${absolutePath}`);
          ws.send(JSON.stringify({
            type: 'error',
            data: `Upload failed: File not found on disk`
          }));
          return;
        }

        // --- VISUALIZATION SEQUENCE START ---
        // 1. Set status to WARMUP
        broadcast({
          type: 'metrics',
          data: { ...currentMetrics, status: 'WARMUP', activeThreads: 1 }
        });

        // 2. Fake some graph activity (Scan Speed bump)
        uploadVizTimer = setTimeout(() => {
          broadcast({
            type: 'metrics',
            data: { ...currentMetrics, status: 'SCANNING', scanSpeed: 120, filesScanned: 0, activeThreads: 4 }
          });

          broadcast({
            type: 'alert',
            data: {
              time: new Date().toLocaleTimeString(),
              type: 'info',
              threat: 'Analyzing File Structure...',
              file: data.fileName,
              status: 'scanning'
            }
          });
        }, 600);

        // 3. More graph activity
        uploadVizTimer = setTimeout(() => {
          broadcast({
            type: 'metrics',
            data: { ...currentMetrics, status: 'SCANNING', scanSpeed: 245, filesScanned: 1, activeThreads: 8 }
          });

          broadcast({
            type: 'alert',
            data: {
              time: new Date().toLocaleTimeString(),
              type: 'info',
              threat: 'Checking Signatures...',
              file: data.fileName,
              status: 'scanning'
            }
          });
        }, 1200);

        // 4. ACTUAL SCAN & FINISH
        uploadVizTimer = setTimeout(() => {
          // Force start scan on this single file
          startScan(absolutePath);
          uploadVizTimer = null;
        }, 2000);
        // --- VISUALIZATION SEQUENCE END ---

      }, 500);
    }
  } catch (e) {
    console.error("Upload error:", e);
    ws.send(JSON.stringify({ type: 'error', data: 'Upload failed' }));
  }
}

/* ---------- QUARANTINE MANAGEMENT ---------- */
const quarantineDir = path.resolve(__dirname, '../../quarantine');
const quarantineLog = path.resolve(quarantineDir, 'quarantine.log');

function loadQuarantine() {
  if (!fs.existsSync(quarantineDir)) return [];

  // 1. Read the Log
  let logEntries = [];
  try {
    if (fs.existsSync(quarantineLog)) {
      const content = fs.readFileSync(quarantineLog, 'utf8');
      logEntries = content.split('\n')
        .filter(l => l.trim().length > 0)
        .map(l => { try { return JSON.parse(l); } catch (e) { return null; } })
        .filter(e => e !== null);
    }
  } catch (e) { }

  // 2. Read actual files to verify existence
  let validEntries = [];
  try {
    const files = fs.readdirSync(quarantineDir);
    // Map log entries to active files
    validEntries = logEntries.filter(entry => files.includes(entry.file));

    // Also capture "orphaned" files (files in folder but not in log)
    const loggedFiles = validEntries.map(e => e.file);
    const orphans = files.filter(f => f.endsWith('.locked') && !loggedFiles.includes(f));

    orphans.forEach(f => {
      validEntries.push({
        timestamp: Date.now() / 1000,
        original: "Unknown Source",
        file: f,
        threat: "Unknown"
      });
    });

  } catch (e) { }

  return validEntries.reverse(); // Newest first
}

function restoreQuarantine(filename) {
  const entries = loadQuarantine();
  const entry = entries.find(e => e.file === filename);
  if (!entry) return { success: false, error: "Entry not found" };

  const source = path.join(quarantineDir, filename);
  const dest = entry.original;

  if (!fs.existsSync(source)) return { success: false, error: "File missing on disk" };

  try {
    // Ensure parent dir exists (if deleted)
    // fs.mkdirSync(path.dirname(dest), { recursive: true }); 
    // Actually, let's just try moving.

    fs.renameSync(source, dest);

    // Remove from log
    const newLog = entries.filter(e => e.file !== filename);
    const logContent = newLog.map(e => JSON.stringify(e)).join('\n') + '\n';
    fs.writeFileSync(quarantineLog, logContent, 'utf8');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function manualQuarantine(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;

    if (!fs.existsSync(quarantineDir)) fs.mkdirSync(quarantineDir, { recursive: true });

    const filename = path.basename(filePath);
    const dest = path.join(quarantineDir, `${filename}.locked`);

    // Log first
    fs.appendFileSync(quarantineLog, JSON.stringify({
      timestamp: Date.now() / 1000,
      original: path.resolve(filePath).replace(/\\/g, '\\\\'),
      file: `${filename}.locked`,
      threat: "Manual Quarantine"
    }) + '\n');

    // Move
    fs.renameSync(filePath, dest);
    return true;
  } catch (e) {
    console.error("Manual quarantine failed:", e);
    return false;
  }
}

function deleteQuarantine(filename) {
  const source = path.join(quarantineDir, filename);
  try {
    if (fs.existsSync(source)) fs.unlinkSync(source);

    // Remove from log
    const entries = loadQuarantine();
    const newLog = entries.filter(e => e.file !== filename);
    const logContent = newLog.map(e => JSON.stringify(e)).join('\n') + '\n';
    fs.writeFileSync(quarantineLog, logContent, 'utf8');

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function computeHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function checkVirusTotal(filePath, apiKey) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(filePath)) return reject("File not found");

      const hash = await computeHash(filePath);
      console.log(`🔍 Checking VT for hash: ${hash}`);

      const options = {
        hostname: 'www.virustotal.com',
        path: `/api/v3/files/${hash}`,
        method: 'GET',
        headers: { 'x-apikey': apiKey }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 404) {
            resolve({ found: false, hash });
          } else if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const stats = json.data.attributes.last_analysis_stats;
              resolve({
                found: true,
                hash,
                malicious: stats.malicious,
                total: Object.values(stats).reduce((a, b) => a + b, 0),
                permalink: json.data.links.self
              });
            } catch (e) { reject("Failed to parse VT response"); }
          } else if (res.statusCode === 429) {
            reject("Rate limit exceeded (4 req/min)");
          } else {
            reject(`VT API Error: ${res.statusCode}`);
          }
        });
      });
      req.on('error', (e) => reject(e.message));
      req.end();

    } catch (e) { reject(e.message || e); }
  });
}

// Helper for manual quarantine with Cross-Drive (EXDEV) support
function manualQuarantine(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      const quarantineDir = path.resolve(__dirname, '../../quarantine');
      if (!fs.existsSync(quarantineDir)) fs.mkdirSync(quarantineDir);

      const filename = path.basename(targetPath);
      const destPath = path.join(quarantineDir, filename + ".quarantine");

      try {
        fs.renameSync(targetPath, destPath);
      } catch (err) {
        if (err.code === 'EXDEV') {
          // Cross-device link not permitted, use copy-delete
          fs.copyFileSync(targetPath, destPath);
          fs.unlinkSync(targetPath);
        } else {
          throw err;
        }
      }

      console.log(`✅ Quarantined: ${filename}`);

      // Update log for restoration
      const logEntry = { file: filename + ".quarantine", original: targetPath, timestamp: Date.now() / 1000 };
      const quarantineLog = path.resolve(quarantineDir, 'quarantine.log');
      fs.appendFileSync(quarantineLog, JSON.stringify(logEntry) + '\n');
      return true;
    }
  } catch (err) {
    console.error("Quarantine failed:", err);
  }
  return false;
}

/* ---------- WEBSOCKET ---------- */
wss.on('connection', (ws) => {
  console.log('🔗 Frontend Connected');
  // Multi-client support: do not assign currentWs

  // Send initial state
  ws.send(JSON.stringify({
    type: 'metrics',
    data: currentMetrics
  }));

  ws.send(JSON.stringify({
    type: 'quarantineList',
    data: loadQuarantine()
  }));

  // Send history immediately on connect
  ws.send(JSON.stringify({ type: 'history', data: loadHistory() }));

  if (autoScan) {
    console.log('⚡ Auto-starting scan of project root (.)');
    startScan(".");
  } else {
    console.log('💤 Auto-scan disabled. Waiting for command...');
  }

  /* Track scan start time for report */
  let scanStartTime = 0;
  let scanPath = "";
  let lastSpeedCalcTime = Date.now();
  let lastFilesCount = 0;
  let filesScanned = 0;
  let threatsFound = 0;
  let uploadVizTimer = null;

  // Hook into stats updates to track final counts
  // We need to capture these from the stdout stream logic, but it's cleaner to just
  // trust the final metrics sent by UI or track them here.
  // The C scanner sends final metrics before exit.
  // Let's modify the stdout handler to capture latest metrics.

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'startScan') {
        const limit = msg.cpuLimit || 100;
        console.log(`📨 Received web command: Scan '${msg.path}' with Limit ${limit}%`);
        scanPath = msg.path;
        scanStartTime = Date.now();
        filesScanned = 0;
        threatsFound = 0;
        startScan(msg.path, limit);
      } else if (msg.type === 'stopScan') {
        console.log('📨 Received web command: STOP');
        if (uploadVizTimer) {
          clearTimeout(uploadVizTimer);
          uploadVizTimer = null;
        }

        if (scannerProcess) {
          try {
            process.kill(scannerProcess.pid);
            spawn('taskkill', ['/PID', scannerProcess.pid, '/F', '/T']);
          } catch (e) { }
          scannerProcess = null;
        }

        // Force immediate UI update
        currentMetrics.status = 'idle';
        broadcast({ type: 'metrics', data: currentMetrics });
        broadcast({ type: 'status', data: { scanning: false } });

      } else if (msg.type === 'pauseScan') {
        console.log('📨 Received web command: PAUSE');
        if (scannerProcess && scannerProcess.stdin) {
          scannerProcess.stdin.write('p\n');
        }
      } else if (msg.type === 'resumeScan') {
        console.log('📨 Received web command: RESUME');
        if (scannerProcess && scannerProcess.stdin) {
          scannerProcess.stdin.write('r\n');
        }
      } else if (msg.type === 'reset') {
        console.log('📨 Received web command: RESET');
        // Reset server-side metrics
        currentMetrics = {
          status: 'idle',
          filesScanned: 0,
          threatsDetected: 0,
          activeThreads: 0,
          totalThreads: 0,
          scanSpeed: 0,
          cpuLoad: 0,
          memoryUsage: 0,
          diskIO: 0
        };
        lastMetrics = { filesScanned: 0, threatsDetected: 0 };
        filesScanned = 0;
        threatsFound = 0;
        scanStartTime = 0;
        lastSpeedCalcTime = Date.now();
        lastFilesCount = 0;
        scanPath = "";

        // Broadcast reset state
        broadcast({ type: 'metrics', data: currentMetrics });
        broadcast({ type: 'status', data: { scanning: false } });
      } else if (msg.type === 'getHistory') {
        ws.send(JSON.stringify({ type: 'history', data: loadHistory() }));
      } else if (msg.type === 'getSignatures') {
        ws.send(JSON.stringify({ type: 'signatures', data: loadSignatures() }));
      } else if (msg.type === 'saveSignatures') {
        console.log('📝 Updating signatures...');
        if (saveSignatures(msg.data)) {
          // Broadcast new list to all clients (updating UI)
          ws.send(JSON.stringify({ type: 'signatures', data: loadSignatures() }));
        }
      } else if (msg.type === 'getSettings') {
        ws.send(JSON.stringify({ type: 'settings', data: loadSettings() }));
      } else if (msg.type === 'saveSettings') {
        saveSettings(msg.data);
        ws.send(JSON.stringify({ type: 'settings', data: loadSettings() }));
      } else if (msg.type === 'verifyFile') {
        const settings = loadSettings();
        if (!settings.vtApiKey) {
          ws.send(JSON.stringify({ type: 'vtError', data: "No VirusTotal API Key configured." }));
          return;
        }
        console.log(`🔎 Verifying file with VT: ${msg.path}`);
        checkVirusTotal(msg.path, settings.vtApiKey)
          .then(result => {
            ws.send(JSON.stringify({ type: 'vtResult', data: { path: msg.path, result } }));
          })
          .catch(err => {
            ws.send(JSON.stringify({ type: 'vtError', data: err.toString() }));
          });
      } else if (msg.type === 'quarantineFile') {
        const targetPath = msg.path;
        console.log(`🛡️  Manual Quarantine Request: ${targetPath}`);

        if (manualQuarantine(targetPath)) {
          // Broadcast update
          ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
          ws.send(JSON.stringify({ type: 'alertUpdate', data: { file: targetPath, status: 'quarantined' } }));
        } else {
          ws.send(JSON.stringify({ type: 'error', data: "File not found or access denied." }));
        }
      } else if (msg.type === 'listDir') {
        const targetPath = msg.path;

        // Mock Cloud Drive for Render/Linux
        // AGGRESSIVE OVERRIDE: If we are on Render, we MUST show the demo drive.
        const isCloudEnv = process.env.RENDER || process.platform === 'linux';

        console.log(`📂 listDir requested. Path: "${msg.path}". CloudEnv: ${isCloudEnv}`);

        // If requesting root, C:, or if path is empty/undefined/dot
        if (isCloudEnv && (!msg.path || msg.path === '.' || msg.path === 'C:' || msg.path === 'C:\\' || msg.path === '/' || msg.path === '\\')) {
          console.log("☁️ CLOUD DEMO: Intercepting directory list to show Mock Drive");
          ws.send(JSON.stringify({
            type: 'dirList',
            data: {
              path: "C:\\",
              items: [
                { name: "Windows", isDirectory: true },
                { name: "Users", isDirectory: true },
                { name: "Program Files", isDirectory: true },
                { name: "Program Files (x86)", isDirectory: true },
                { name: "Cloud_Demo_Mode.txt", isDirectory: false },
                { name: "Render_Server_Info.log", isDirectory: false },
                { name: "Click_Scan_To_Test.txt", isDirectory: false }
              ]
            }
          }));
          return;
        }

        if (!targetPath) {
          // List Drives (Windows) or Root (Unix)
          if (process.platform === 'win32') {
            require('child_process').exec('wmic logicaldisk get name', (error, stdout) => {
              if (error) {
                ws.send(JSON.stringify({ type: 'dirError', data: error.message }));
                return;
              }
              const drives = stdout.split('\r\r\n')
                .filter(value => value && value.trim() && value.trim() !== 'Name')
                .map(value => value.trim());

              const result = drives.map(drive => ({
                name: drive,
                isDirectory: true,
                isDrive: true
              }));
              ws.send(JSON.stringify({ type: 'dirList', data: { path: "", items: result } }));
            });
          } else {
            // Unix/Mac - just show root
            const items = fs.readdirSync('/', { withFileTypes: true });
            const result = items.map(item => ({
              name: item.name,
              isDirectory: item.isDirectory()
            }));
            ws.send(JSON.stringify({ type: 'dirList', data: { path: "/", items: result } }));
          }
        } else {
          try {
            const items = fs.readdirSync(targetPath, { withFileTypes: true });
            const result = items.map(item => ({
              name: item.name,
              isDirectory: item.isDirectory()
            }));
            ws.send(JSON.stringify({ type: 'dirList', data: { path: path.resolve(targetPath), items: result } }));
          } catch (e) {
            ws.send(JSON.stringify({ type: 'dirError', data: e.message }));
          }
        }
      } else if (msg.type === 'startWatch') {
        console.log(`📨 Received web command: Start Watch '${msg.path}'`);
        startWatch(msg.path);
      } else if (msg.type === 'stopWatch') {
        console.log('📨 Received web command: Stop Watch');
        stopWatch();
      } else if (msg.type === 'getWatchStatus') {
        const status = { active: !!watcher, path: watcherPath };
        ws.send(JSON.stringify({ type: 'watchStatus', data: status }));
      } else if (msg.type === 'getQuarantine') {
        ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
      } else if (msg.type === 'restoreQuarantine') {
        const res = restoreQuarantine(msg.filename);
        if (res.success) {
          ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
          // Maybe notify success?
        } else {
          ws.send(JSON.stringify({ type: 'error', data: `Restore failed: ${res.error}` }));
        }
      } else if (msg.type === 'restoreAllQuarantine') {
        console.log('📨 Received web command: Restore ALL Quarantine');
        // Spawn the restore script
        const restoreProc = spawn('node', [path.resolve(__dirname, 'restore_all.js')]);

        restoreProc.stdout.on('data', (data) => {
          console.log(`[Restore]: ${data}`);
        });

        restoreProc.on('close', (code) => {
          console.log(`[Restore] Finished with code ${code}`);
          // Broadcast update
          ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
          ws.send(JSON.stringify({ type: 'alert', data: { file: 'Batch Restore', status: 'clean', type: 'system', threat: 'Restored All Files' } }));
        });

      } else if (msg.type === 'deleteQuarantine') {
        const res = deleteQuarantine(msg.filename);
        ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
      } else if (msg.type === 'resolveThreat') {
        // Manual action from user: Quarantine or Ignore
        // msg.data: { file: '...', action: 'quarantine' | 'ignore' }
        if (msg.data.action === 'quarantine') {
          // Use shared helper
          if (manualQuarantine(msg.data.file)) {
            // Notify success
            ws.send(JSON.stringify({ type: 'alertUpdate', data: { file: msg.data.file, status: 'quarantined' } }));
            ws.send(JSON.stringify({ type: 'quarantineList', data: loadQuarantine() }));
          }
        }
      } else if (msg.type === 'uploadChunk') {
        handleUploadChunk(msg.data, ws);
      }
    } catch (e) {
      console.error('Failed to parse frontend message:', e);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', data: 'Invalid message format' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('❌ Frontend Disconnected');
    currentWs = null;
    stopWatch(); // Stop watcher on disconnect
  });
});


/* ---------- WATCHER LOGIC ---------- */
let watcher = null;
let watcherPath = null;

function scanSingleFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  // Skip likely temp files
  if (filePath.endsWith('.tmp') || filePath.endsWith('.crdownload')) return;

  // console.log(`👀 Watcher scanning: ${filePath}`);
  const proc = spawn('multithreaded-file-scanner.exe', ['--headless', filePath], {
    cwd: path.resolve(__dirname, '../../'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim().startsWith('{')) {
        try {
          const msg = JSON.parse(line);
          if (msg.type === 'alert') {
            // Enrich alert to indicate it came from Watcher
            msg.data.threat += " (Real-time)";
            broadcast(msg);
          }
        } catch (e) { }
      }
    });
  });
}

function startWatch(targetPath) {
  if (watcher) stopWatch();
  try {
    if (!fs.existsSync(targetPath)) return false;

    watcherPath = targetPath;
    console.log(`👁️ Watching directory: ${targetPath}`);

    // recursive: true is supported on Windows and macOS
    watcher = fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        const fullPath = path.join(targetPath, filename);
        // Debounce/Throttle could go here
        scanSingleFile(fullPath);
      }
    });

    broadcast({ type: 'watchStatus', data: { active: true, path: targetPath } });
    return true;
  } catch (e) {
    console.error("Watch failed:", e);
    return false;
  }
}

function stopWatch() {
  if (watcher) {
    watcher.close();
    watcher = null;
    watcherPath = null;
    console.log('🛑 Watcher stopped');
    broadcast({ type: 'watchStatus', data: { active: false } });
  }
}
/* ----------------------------------- */

/* We need to update startScan to facilitate data capture */
// Modifying the stdout listener in startScan to capture metrics
// But startScan is defined above. I will modify the previous startScan block instead.
// Wait, I can't easily jump back and forth. 

let globalMetrics = { files: 0, threats: 0 };

/* ---------- SCAN FUNCTION ---------- */
// ... (startScan logic needs to update globalMetrics) ...


/* ---------- SYNC FILE WATCHER ---------- */
// Watch for updates from the TUI app

const syncFile = path.resolve(__dirname, '../../web_sync.log');

// Clear file on startup
try { fs.writeFileSync(syncFile, ''); } catch (e) { }

let fileSize = 0;
try { fileSize = fs.statSync(syncFile).size; } catch (e) { }

console.log(`👀 Watching for TUI updates: ${syncFile}`);

fs.watchFile(syncFile, { interval: 50 }, (curr, prev) => {
  if (curr.size <= prev.size) return;
  // console.log(`📂 Sync file updated: ${prev.size} -> ${curr.size}`);

  const stream = fs.createReadStream(syncFile, {
    start: prev.size,
    end: curr.size
  });

  let streamBuffer = '';
  stream.on('data', (chunk) => {
    streamBuffer += chunk.toString();
    const lines = streamBuffer.split('\n');
    streamBuffer = lines.pop();

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      if (!line) return;
      try {
        if (line.startsWith('{')) broadcast(JSON.parse(line));
      } catch (e) { }
    });
  });

  stream.on('end', () => {
    // If anything remains, try to send it (though likely incomplete if file write wasn't atomic-ish)
    if (streamBuffer.trim()) {
      // console.log("Partial sync line dropped:", streamBuffer);
    }
  });
});



/* ---------- CLEANUP HANDLERS ---------- */
function cleanup() {
  console.log('🧹 Cleaning up processes...');
  if (scannerProcess) {
    try {
      process.kill(scannerProcess.pid);
      spawn('taskkill', ['/PID', scannerProcess.pid, '/F', '/T']);
    } catch (e) { }
  }
  if (watcher) {
    watcher.close();
  }
  process.exit(0);
}

process.on('SIGINT', cleanup); // CTRL+C
process.on('SIGTERM', cleanup); // Kill command
process.on('exit', () => {
  if (scannerProcess) try { process.kill(scannerProcess.pid); } catch (e) { }
});


