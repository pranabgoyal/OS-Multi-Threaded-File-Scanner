"use client"

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { toast } from "sonner"
import type {
  ScannerMessage,
  ScannerMetrics,
  ScannerAlert,
  ScannerStatus,
  ScanHistoryEntry,
  ConnectionStatus,
  ThroughputDataPoint
} from '@/types/scanner'

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:9090'

interface WebSocketContextValue {
  connectionStatus: ConnectionStatus;
  metrics: ScannerMetrics;
  alerts: ScannerAlert[];
  history: ScanHistoryEntry[];
  throughputData: ThroughputDataPoint[];
  connect: () => void;
  startScan: (path: string, auto: boolean, cpuLimit: number) => void;
  stopScan: () => void;
  pauseScan: () => void;
  resumeScan: () => void;
  signatures: string[];
  saveSignatures: (sigs: string[]) => void;
  saveSettings: (settings: any) => void;
  verifyFile: (path: string) => void;
  settings: any;

  // File Browser State
  dirData: { path: string, items: { name: string, isDirectory: boolean, isDrive?: boolean }[] };
  listDir: (path: string) => void;

  // Real-time Watcher State
  watchStatus: { active: boolean, path: string | null };
  startWatch: (path: string) => void;
  stopWatcher: () => void;

  // Quarantine State
  quarantineList: any[];
  restoreQuarantine: (filename: string) => void;
  restoreAllQuarantine: () => void;
  deleteQuarantine: (filename: string) => void;
  resolveThreat: (file: string, action: 'quarantine' | 'ignore') => void;

  // Upload Scan
  uploadFile: (file: File, cpuLimit?: number) => void;
  quarantineFile: (path: string) => void;
  lastUploadedFile: { path: string, ts: number } | null;
  resetScanner: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

const DEFAULT_METRICS: ScannerMetrics = {
  status: 'IDLE',
  filesScanned: 0,
  threatsDetected: 0,
  activeThreads: 0,
  totalThreads: 8, // Default to 8 until backend connects
  scanSpeed: 0,
  cpuLoad: 0,
  memoryUsage: 0,
  diskIO: 0
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [metrics, setMetrics] = useState<ScannerMetrics>(DEFAULT_METRICS)
  const [alerts, setAlerts] = useState<ScannerAlert[]>([])
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [signatures, setSignatures] = useState<string[]>([])
  const [settingsState, setSettingsState] = useState<any>({ vtApiKey: "", cpuLimit: 80, theme: 'blue' })
  const [throughputData, setThroughputData] = useState<ThroughputDataPoint[]>([])
  const [dirData, setDirData] = useState<{ path: string, items: { name: string, isDirectory: boolean, isDrive?: boolean }[] }>({ path: "", items: [] })

  const [watchStatus, setWatchStatus] = useState<{ active: boolean, path: string | null }>({ active: false, path: null })
  const [quarantineList, setQuarantineList] = useState<any[]>([])
  const [lastUploadedFile, setLastUploadedFile] = useState<{ path: string, ts: number } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setConnectionStatus('connecting')

    try {
      const ws = new WebSocket(WEBSOCKET_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        // Request initial data
        ws.send(JSON.stringify({ type: 'getHistory' }))
        ws.send(JSON.stringify({ type: 'getSignatures' }))
        ws.send(JSON.stringify({ type: 'getSettings' }))
        ws.send(JSON.stringify({ type: 'getWatchStatus' }))
        ws.send(JSON.stringify({ type: 'getQuarantine' }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case 'metrics':
              setMetrics(message.data)
              setThroughputData(prev => {
                const now = new Date().toLocaleTimeString()
                // Add new point
                const newData = [...prev, { time: now, throughput: message.data.scanSpeed }]
                // Keep last 60 points (60 seconds)
                return newData.slice(-60)
              })

              // STATUS CHANGE NOTIFICATIONS
              if (message.data.status) {
                const newStatus = message.data.status;
                const prevStatus = document.body.getAttribute('data-scan-status'); // Hacky but effective state tracking without ref

                if (newStatus !== prevStatus) {
                  document.body.setAttribute('data-scan-status', newStatus);

                  if (newStatus === 'SCANNING' && prevStatus !== 'PAUSED') {
                    toast.info("Scan Started", { description: "Scanning file system...", duration: 2000 });
                  } else if (newStatus === 'IDLE' && prevStatus === 'SCANNING') {
                    toast.info("Scan Stopped", { description: "Scan was stopped manually.", duration: 2000 });
                  } else if (newStatus === 'completed') {
                    toast.success("Scan Completed", {
                      description: `Scanned ${message.data.filesScanned} files. Found ${message.data.threatsDetected} threats.`,
                      duration: 5000
                    });
                  }
                }
              }
              break
            case 'quarantineList':
              if (Array.isArray(message.data)) {
                setQuarantineList(message.data);
              }
              break;

            case 'uploadComplete':
              if (message.data && message.data.path) {
                setLastUploadedFile({ path: message.data.path, ts: Date.now() });
                toast.success("Upload Ready", { description: `File prepared at: ${message.data.path}` });
              }
              break;

            case 'alert':
              // Differentiate between INFO (progress) and THREATS
              if (message.data.type === 'info') {
                // SPAM PREVENTION: User found these annoying.
                // toast.info(message.data.threat, {
                //   description: `${message.data.file}`,
                //   duration: 2000,
                // });
                // We just ignore visual toasts for info, but could log if needed.
              } else {
                // Real Threat or System Error
                const newAlert = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  file: message.data.file,
                  threat: message.data.threat,
                  type: 'virus',
                  status: 'infected',
                  time: new Date().toLocaleTimeString()
                } as ScannerAlert

                setAlerts(prev => [newAlert, ...prev])

                // SILENCED PER USER REQUEST:
                // Only showing Summary at the end.
                // toast("Threat Detected!", {
                //   description: `${message.data.threat} found in ${message.data.file}`,
                //   action: {
                //     label: "Details",
                //     onClick: () => console.log("Show details"),
                //   },
                // })
              }
              break

            // @ts-ignore
            case 'history':
              if (Array.isArray(message.data)) {
                setHistory(message.data);
              }
              break

            // @ts-ignore
            case 'historyEntry':
              setHistory(prev => [message.data, ...prev].slice(0, 50));
              break

            // @ts-ignore
            case 'signatures':
              if (Array.isArray(message.data)) {
                setSignatures(message.data);
              }
              break

            // @ts-ignore
            case 'settings':
              if (message.data) {
                setSettingsState(message.data);
              }
              break

            // @ts-ignore
            case 'vtResult':
              if (message.data) {
                const { path, result } = message.data;
                if (result.found) {
                  toast(`${result.malicious} / ${result.total} Malicious`, {
                    description: `VirusTotal Report for ${path.split(/[\\/]/).pop()}`,
                    action: {
                      label: "View Report",
                      onClick: () => window.open(result.permalink, '_blank'),
                    },
                    duration: 8000
                  });
                } else {
                  toast("Clear Report (VirusTotal)", {
                    description: "File not found in VirusTotal database (Clean or Unknown).",
                  });
                }
              }
              break

            // @ts-ignore
            case 'vtError':
              toast.error("VirusTotal Error", { description: message.data });
              break

            case 'dirList':
              if (message.data) {
                setDirData(message.data);
              }
              break

            // @ts-ignore
            case 'dirError':
              toast.error("Directory Error", { description: message.data });
              break

            // @ts-ignore
            case 'watchStatus':
              if (message.data) {
                setWatchStatus(message.data);
                if (message.data.active) {
                  toast.success("Watch Mode Active", { description: `Monitoring ${message.data.path}` });
                } else {
                  toast("Watch Mode Stopped");
                }
              }
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setConnectionStatus('disconnected')
        wsRef.current = null
      }

      ws.onerror = (error) => {
        // Suppress empty error events common during cleanup/react strict mode
        if (event && (event as any).type === 'error' && (event as any).message === undefined) return;
        console.error('WebSocket Error:', error)
        setConnectionStatus('error')

        // DEBUG: Tell user what URL failed
        if (reconnectAttemptsRef.current === 0) {
          toast.error("Connection Failed", {
            description: `Tried connecting to: ${WEBSOCKET_URL}. Check Env Vars!`,
            duration: 10000
          });
        }
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const startScan = useCallback((path: string, auto: boolean, cpuLimit: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'startScan',
        path,
        auto,
        cpuLimit
      }))
      // Reset alerts on new scan
      setAlerts([])
    }
  }, [])

  const stopScan = useCallback(() => {
    // Optimistic UI update
    setMetrics(prev => ({ ...prev, status: 'IDLE' }))
    setWatchStatus(prev => ({ ...prev, active: false })) // Also stop watch if active

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stopScan' }))
    }
  }, [])

  const pauseScan = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'pauseScan' }));
    }
  }, []);

  const resumeScan = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resumeScan' }));
    }
  }, []);

  const saveSignatures = useCallback((sigs: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'saveSignatures', data: sigs }))
    }
  }, [])

  const uploadFile = useCallback((file: File, cpuLimit: number = 80) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const CHUNK_SIZE = 1024 * 512; // 512KB
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const fileId = Date.now().toString();

      toast.info("Uploading for Scan...", { description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)` });

      let offset = 0;
      let chunkIndex = 0;

      const readChunk = () => {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const base64 = btoa(
              new Uint8Array(e.target.result as ArrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            wsRef.current?.send(JSON.stringify({
              type: 'uploadChunk',
              data: {
                id: fileId,
                fileName: file.name,
                chunk: base64,
                index: chunkIndex,
                total: totalChunks,
                isLast: chunkIndex === totalChunks - 1,
                cpuLimit: cpuLimit // Send link in every chunk or just need it in handler? Sending in all/last is fine.
              }
            }));

            offset += CHUNK_SIZE;
            chunkIndex++;

            if (offset < file.size) {
              readChunk(); // Next chunk
            } else {
              toast.success("Upload Complete. Scanning...", { duration: 2000 });
            }
          }
        };
        reader.readAsArrayBuffer(slice);
      };

      readChunk();
    } else {
      toast.error("Not connected to scanner service.");
    }
  }, []);

  const value: WebSocketContextValue = {
    connectionStatus,
    metrics,
    alerts,
    history,
    throughputData,
    connect,
    startScan,
    stopScan,
    pauseScan,
    resumeScan,
    signatures,
    saveSignatures,
    uploadFile,
    saveSettings: (s) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'saveSettings', data: s }))
      }
    },
    verifyFile: (path) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        toast("Verifying with VirusTotal...", { description: "Computing hash and querying API. This may take a moment." })
        wsRef.current.send(JSON.stringify({ type: 'verifyFile', path }))
      }
    },
    listDir: (path) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'listDir', path }))
      }
    },
    settings: settingsState,
    dirData,

    watchStatus,
    startWatch: (path) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'startWatch', path }))
      }
    },
    stopWatcher: () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stopWatch' }))
      }
    },

    quarantineList,
    restoreQuarantine: (filename) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'restoreQuarantine', filename }))
      }
    },
    restoreAllQuarantine: () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'restoreAllQuarantine' }))
      }
    },
    quarantineFile: (path) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'quarantineFile', path }))
        toast.info("Quarantining File...", { description: path })
      }
    },

    deleteQuarantine: (filename) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'deleteQuarantine', filename }))
      }
    },
    resolveThreat: (file, action) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resolveThreat', data: { file, action } }))
        // Optimistic update
        setAlerts(prev => prev.map(a =>
          a.file === file ? { ...a, status: action === 'quarantine' ? 'quarantined' : 'ignored' } : a
        ))
      }
    },
    lastUploadedFile,
    resetScanner: () => {
      // Notify server to reset its counters
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'reset' }))
      }

      setMetrics(DEFAULT_METRICS)
      setAlerts([])
      setHistory([])
      setThroughputData([])
      setQuarantineList([])
      setLastUploadedFile(null)
      setDirData({ path: "", items: [] })
      setWatchStatus({ active: false, path: null })
      toast.info("Dashboard Reset", { description: "All metrics and alerts have been cleared." })
    }
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useScanner() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useScanner must be used within a WebSocketProvider')
  }
  return context
}
