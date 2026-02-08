# OS Multi-Threaded File Scanner 🛡️

![Scanner Dashboard](https://via.placeholder.com/800x400?text=Scanner+Dashboard+Preview)

A high-performance, multi-threaded file scanning application providing real-time threat detection, telemetry, and a professional dashboard. Built with **Next.js 15**, **React 19**, and a custom **Node.js Bridge**.

## 🚀 Features

*   **Real-Time Visualization**: Watch scanning threads in action with a waterfall view and sparkline graphs.
*   **Multi-Threaded Engine**: Simulates high-performance scanning with adjustable CPU limits.
*   **Professional UI**: Glassmorphic design, dark/light themes, and responsive layout.
*   **Advanced Controls**: Keyboard shortcuts (`Space` to Pause, `Esc` to Stop), Turbo Mode, and specific directory targeting.
*   **Threat Detection**: Simulated virus signatures and quarantine management.
*   **Data Export**: Download detailed JSON reports of scan history and alerts.
*   **Audio Feedback**: Sound effects for start, stop, alerts, and completion.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Recharts, Sonner.
*   **Backend**: Node.js Bridge (WebSocket server) simulating a C++ scanning engine.
*   **State Management**: React Context API + WebSockets.

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/pranabgoyal/OS-Multi-Threaded-File-Scanner.git
    cd OS-Multi-Threaded-File-Scanner
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Scanner**:
    You need two terminals to run the full stack:

    *   **Terminal 1 (Backend/Bridge)**:
        ```bash
        node server/bridge.js
        ```

    *   **Terminal 2 (Frontend)**:
        ```bash
        npm run dev
        ```

4.  **Open Dashboard**:
    Visit `http://localhost:3001` in your browser.

## 🎮 Usage

*   **Start Scan**: Enter a path (e.g., `C:\`) or click "Scan C: Drive".
*   **Pause/Resume**: Press `Spacebar`.
*   **Stop**: Press `Esc` or click the Stop button.
*   **Settings**: Click the Gear icon to change Theme or CPU Limit.
*   **Export**: Click the Download icon in the Activity card to save a report.

## ⚠️ Note on Deployment

This application uses a separate Node.js backend (`server/bridge.js`) for system-level operations.
*   **Vercel/Netlify**: Will only host the Frontend. The scanner will appear "Disconnected" unless you run the backend locally.
*   **Full Hosting**: Requires a VPS (e.g., Railway, Render, DigitalOcean) to run the Node.js process.

## 📄 License

MIT License.
