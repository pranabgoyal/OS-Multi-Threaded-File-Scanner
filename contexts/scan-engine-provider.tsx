import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useScanner } from './websocket-provider'
import type { ScanBlock, ThreadState, ScanStatus } from '@/types/scanner'
import { toast } from 'sonner'
import { useSoundEffects } from '@/hooks/use-sound-effects'

interface ScanEngineContextValue {
    status: ScanStatus;
    threads: Map<number, ThreadState>;
    eventStream: ScanBlock[]; // Recent events for waterfall
    selectedBlock: ScanBlock | null;
    selectBlock: (block: ScanBlock | null) => void;
    clearStream: () => void;
    resetEngine: () => void;
}

const ScanEngineContext = createContext<ScanEngineContextValue | undefined>(undefined)

// --- MOCK DATA FOR VISUALIZATION ---
const REALISTIC_FILES = [
    "kernel32.dll", "ntdll.dll", "user32.dll", "gdi32.dll", "advapi32.dll",
    "shell32.dll", "ole32.dll", "oleaut32.dll", "uuid.dll", "ws2_32.dll",
    "chrome.exe", "firefox.exe", "svchost.exe", "explorer.exe", "registry.dat",
    "background.jpg", "profile.png", "document.pdf", "spreadsheet.xlsx", "notes.txt",
    "react.js", "next.config.js", "package.json", "tsconfig.json", "index.html",
    "styles.css", "main.py", "server.go", "database.sql", "config.xml",
    "backup.zip", "archive.tar", "setup.msi", "installer.exe", "driver.sys",
    "font.ttf", "icon.ico", "vector.svg", "audio.mp3", "video.mp4",
    "system.log", "error.log", "debug.log", "access.log", "temp.tmp"
];

const getRandomFile = () => {
    const name = REALISTIC_FILES[Math.floor(Math.random() * REALISTIC_FILES.length)];
    // Generate semi-realistic path
    const dirs = ["C:\\Windows\\System32", "C:\\Program Files\\App", "D:\\Data\\Projects", "C:\\Users\\Admin\\Downloads"];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    return { name, path: `${dir}\\${name}` };
}

export function ScanEngineProvider({ children }: { children: React.ReactNode }) {
    const { connectionStatus, metrics, alerts, dirData } = useScanner()
    const [status, setStatus] = useState<ScanStatus>('IDLE')
    const [threads, setThreads] = useState<Map<number, ThreadState>>(new Map())
    const [eventStream, setEventStream] = useState<ScanBlock[]>([])
    const [selectedBlock, setSelectedBlock] = useState<ScanBlock | null>(null)
    const { playSound } = useSoundEffects()

    // Track previous metric to calculate delta
    const prevFilesScannedRef = useRef(metrics.filesScanned)

    // Initialize Threads
    useEffect(() => {
        const initialThreads = new Map<number, ThreadState>()
        for (let i = 0; i < 8; i++) {
            initialThreads.set(i, { id: i, status: 'idle', filesProcessed: 0 })
        }
        setThreads(initialThreads)
    }, [])

    // --- TELEMETRY DRIVEN VISUALIZATION ---
    // If the C engine scans 50 files, we want to pop 50 blocks onto the screen.
    useEffect(() => {
        // Sync Status
        if (metrics.status) {
            setStatus(metrics.status as ScanStatus || 'IDLE')
        }

        // Calculate Delta
        const delta = metrics.filesScanned - prevFilesScannedRef.current;
        prevFilesScannedRef.current = metrics.filesScanned;

        if (delta > 0) {
            const newBlocks: ScanBlock[] = [];
            const timestamp = Date.now();

            for (let i = 0; i < delta; i++) {
                // Random Thread allocation (visual distribution)
                const threadId = Math.floor(Math.random() * metrics.totalThreads);
                const fileInfo = getRandomFile();

                // If we have a scan path, try to use it as prefix
                const displayPath = dirData.path ? `${dirData.path}\\...\\${fileInfo.name}` : fileInfo.path || "Unknown Path";

                newBlocks.push({
                    id: `${timestamp}-${i}-${Math.random()}`,
                    threadId,
                    filename: fileInfo.name,
                    path: displayPath,
                    size: Math.floor(Math.random() * 5000) * 1024,
                    status: 'clean',
                    timestamp,
                    duration: Math.random() * 10
                });
            }

            // Update Stream (Keep buffer size manageable)
            setEventStream(prev => [...newBlocks, ...prev].slice(0, 50));

            // Update Thread Activity Visuals (Make them 'busy')
            setThreads(prev => {
                const map = new Map(prev);
                newBlocks.forEach(b => {
                    const t = map.get(b.threadId);
                    if (t) {
                        t.status = 'busy';
                        t.currentFile = b.filename;
                        t.filesProcessed++;
                    }
                });
                return map;
            });

            // Auto-revert threads to idle if no events for a bit? 
            // The next tick will handle it if delta is 0, manually handled below.
        } else if (metrics.status === 'IDLE' || metrics.status === 'PAUSED') {
            setThreads(prev => {
                const map = new Map(prev);
                map.forEach(t => t.status = 'idle');
                return map;
            });
        }

    }, [metrics.filesScanned, metrics.status, metrics.totalThreads]);

    // Listen for REAL Threat Alerts to inject Red Blocks
    useEffect(() => {
        if (alerts.length > 0) {
            const lastAlert = alerts[0];

            // Play Alert Sound
            // SILENCED PER USER REQUEST
            // playSound('alert')

            // Inject a threat block immediately
            const threatBlock: ScanBlock = {
                id: `THREAT-${Date.now()}`,
                threadId: Math.floor(Math.random() * 8),
                filename: lastAlert.file.split(/[\\/]/).pop() || "Unknown",
                path: lastAlert.file,
                size: 0,
                status: 'infected',
                timestamp: Date.now(),
                duration: 50
            };
            setEventStream(prev => [threatBlock, ...prev].slice(0, 50));
            setSelectedBlock(threatBlock);

            // Trigger Custom Toast
            // SILENCED PER USER REQUEST
            // import('@/components/dashboard/threat-toast').then(({ ThreatToast }) => {
            //     toast.custom((t) => (
            //         <ThreatToast
            //             file={lastAlert.file.split(/[\\/]/).pop() || "Unknown File"}
            //             path={lastAlert.file}
            //             threat={lastAlert.threat || "Unknown Threat"}
            //             onDismiss={() => toast.dismiss(t)}
            //         />
            //     ), { duration: 10000 }); // Longer duration for threats
            // });
        }
    }, [alerts, playSound]);


    const selectBlock = useCallback((block: ScanBlock | null) => {
        setSelectedBlock(block)
    }, [])

    const clearStream = useCallback(() => {
        setEventStream([])
        setThreads(prev => {
            const map = new Map(prev)
            map.forEach(t => {
                t.status = 'idle'
                t.filesProcessed = 0
            })
            return map
        })
    }, [])

    const resetEngine = useCallback(() => {
        setStatus('IDLE')
        setEventStream([])
        setSelectedBlock(null)
        setThreads(prev => {
            const map = new Map()
            for (let i = 0; i < 8; i++) {
                map.set(i, { id: i, status: 'idle', filesProcessed: 0 })
            }
            return map
        })
    }, [])

    const value: ScanEngineContextValue = {
        status,
        threads,
        eventStream,
        selectedBlock,
        selectBlock,
        clearStream,
        resetEngine
    }

    return (
        <ScanEngineContext.Provider value={value}>
            {children}
        </ScanEngineContext.Provider>
    )
}

export function useScanEngine() {
    const context = useContext(ScanEngineContext)
    if (context === undefined) {
        throw new Error('useScanEngine must be used within a ScanEngineProvider')
    }
    return context
}
