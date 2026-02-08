// Scanner WebSocket message types

export interface ScannerMetrics {
  filesScanned: number;
  threatsDetected: number;
  activeThreads: number;
  totalThreads: number;
  scanSpeed: number; // files per second
  cpuLoad: number; // 0-100
  memoryUsage: number; // 0-100
  diskIO: number; // MB/s
  status?: 'IDLE' | 'WARMUP' | 'SCANNING' | 'PAUSED' | 'COOLDOWN' | 'ERROR';
}

export type ScanStatus = ScannerMetrics['status'];

export interface ScanBlock {
  id: string; // Unique ID (timestamp + random)
  threadId: number;
  filename: string;
  path: string;
  size: number;
  status: 'queued' | 'scanning' | 'clean' | 'infected' | 'warning' | 'error';
  timestamp: number;
  duration: number;
}

export interface ThreadState {
  id: number;
  status: 'idle' | 'busy' | 'blocked' | 'error';
  currentFile?: string;
  filesProcessed: number;
}

export interface ScannerAlert {
  id: string;
  file: string;
  status: 'clean' | 'warning' | 'infected' | 'check_required' | 'quarantined' | 'ignored';
  threat?: string;
  time: string;
  type: string;
}

export interface ScannerStatus {
  scanning: boolean;
  progress: number; // 0-100
  currentPath?: string;
}

export type MessageType = 'metrics' | 'alert' | 'status' | 'fileScanned';

export type ScannerMessage =
  | { type: 'metrics'; data: ScannerMetrics }
  | { type: 'alert'; data: { file: string; threat: string } }
  | { type: 'fileScanned'; data: { threadId: number; file: string; status: string; duration: number } }
  | { type: 'quarantineList'; data: any[] }
  | { type: 'history'; data: ScanHistoryEntry[] }
  | { type: 'historyEntry'; data: ScanHistoryEntry }
  | { type: 'signatures'; data: string[] }
  | { type: 'settings'; data: { vtApiKey: string } }
  | { type: 'vtResult'; data: { path: string; result: any } }
  | { type: 'vtError'; data: string }
  | { type: 'dirList'; data: { path: string; items: { name: string; isDirectory: boolean; isDrive?: boolean }[] } }
  | { type: 'dirError'; data: string }
  | { type: 'watchStatus'; data: { active: boolean; path: string } };

export interface ThroughputDataPoint {
  time: string;
  throughput: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  path: string;
  filesScanned: number;
  threatsDetected: number;
  durationMs: number;
  status: 'completed' | 'cancelled';
}
