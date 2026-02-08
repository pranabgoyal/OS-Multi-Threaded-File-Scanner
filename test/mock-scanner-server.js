// Mock WebSocket server to simulate C backend scanner
// Run with: node test/mock-scanner-server.js

const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Mock Scanner Server running on ws://localhost:${PORT}`);

// Simulation state
let filesScanned = 0;
let threatsDetected = 0;
let scanning = true;

const threatFiles = [
  'suspicious_installer.exe',
  'unknown_script.ps1',
  'temp_download.tmp',
  'untrusted_binary.bin',
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMetrics() {
  filesScanned += getRandomInt(10, 50);
  const scanSpeed = getRandomInt(180, 280);
  
  // Randomly detect threats
  if (Math.random() < 0.05) {
    threatsDetected++;
  }
  
  return {
    type: 'metrics',
    timestamp: Date.now(),
    data: {
      filesScanned,
      threatsDetected,
      activeThreads: getRandomInt(12, 16),
      totalThreads: 16,
      scanSpeed,
      cpuLoad: getRandomInt(60, 90),
      memoryUsage: getRandomInt(35, 55),
      diskIO: getRandomInt(5, 20),
    },
  };
}

function generateAlert(isThreat = false) {
  const statuses = isThreat 
    ? ['infected', 'warning'] 
    : ['clean'];
  
  const status = statuses[getRandomInt(0, statuses.length - 1)];
  const file = isThreat 
    ? threatFiles[getRandomInt(0, threatFiles.length - 1)]
    : `file_${getRandomInt(1000, 9999)}.dll`;
  
  return {
    type: 'alert',
    timestamp: Date.now(),
    data: {
      file,
      status,
      threat: isThreat ? ['Trojan.Win32.Generic', 'Ransom.WannaCry', 'Heuristic.Script', 'Heuristic.Packed'][getRandomInt(0, 3)] : undefined,
      type: ['system', 'exec', 'doc', 'script', 'binary'][getRandomInt(0, 4)],
    },
  };
}

wss.on('connection', (ws) => {
  console.log('✅ Client connected');
  
  // Send metrics every 500ms
  const metricsInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(generateMetrics()));
    }
  }, 500);
  
  // Send alerts randomly
  const alertInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN && Math.random() < 0.3) {
      const isThreat = Math.random() < 0.2; // 20% chance of threat
      ws.send(JSON.stringify(generateAlert(isThreat)));
    }
  }, 2000);
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clearInterval(metricsInterval);
    clearInterval(alertInterval);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

console.log(`
📊 Simulating scanner with:
  - Metrics updates every 500ms
  - Random alerts every 2 seconds
  - 20% chance of threats

Press Ctrl+C to stop
`);
