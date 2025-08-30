<div align="center">
  <img src="https://github.com/OwnOptic/Website-storage/blob/main/NoteTaker.png?raw=true" alt="NoteTaker AI Logo" width="120">
  <h1 align="center">NoteTaker AI</h1>
  <p align="center">
    <strong>Your Private, Offline-First, AI-Powered Second Brain.</strong>
    <br />
    Turn unstructured notes into organized knowledge without ever sacrificing your privacy.
  </p>
</div>

---

NoteTaker AI is an intelligent note-taking application that uses the Google Gemini API to automatically categorize, summarize, and organize your notes. It's built on a **privacy-first** foundation, storing all notes securely and privately in your browser's local database. This makes them accessible offline while ensuring you retain full and complete ownership of your data.

## ✨ Key Features

| Feature                       | Description                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧠 **Absolute Privacy**       | All data is stored **only** in your browser's IndexedDB. No cloud accounts, no tracking, no servers. Your data is yours. Period.                            |
| 🌐 **Fully Offline Capable**  | Thanks to a robust Service Worker, you can create, read, and edit all your notes without an internet connection.                                            |
| 🤖 **Autonomous AI Sync**     | The AI works silently in the background to automatically summarize, tag, extract to-dos, and categorize your notes after you've finished writing.         |
| 🎙️ **Meeting Assistant**      | Transcribe meetings in real-time from your microphone or system audio, with optional screen captures for richer, AI-generated meeting minutes.               |
| 📄 **Content Ingestion**      | Upload images, PDFs, Word documents, or spreadsheets. The AI performs OCR and analysis to turn them into fully structured and organized notes.            |
| 💬 **Chat With Your Notes**   | Use the Cognito AI chat to ask questions about your knowledge base and get synthesized answers with direct links to the source notes.                      |
| 🕸️ **Mind Map View**          | Visualize the connections between your notes. Link ideas with `[[wiki-style]]` syntax and see your second brain as a dynamic knowledge graph.             |
| ⌨️ **Command Palette**        | A lightning-fast, keyboard-driven interface (`Ctrl+K`) to navigate, create notes, and execute commands without leaving your keyboard.                     |
| 🎨 **Modern UI/UX**           | A clean, responsive interface with beautiful dark and light themes, designed to help you focus.                                                          |
|  portability                 | **Full Data Portability** | Export your entire library to a single JSON file for backup or migration at any time. Your data is never locked in. |

---

## 작동 방식: 개인 정보 보호 우선 아키텍처
(How It Works: A Privacy-First Architecture)

NoteTaker AI is fundamentally different from cloud-based note apps. Our architecture is designed to give you complete control.

*   **No Central Server:** The application is a static site. There is no proprietary backend that could ever access or store user notes.
*   **Local-First Storage:** All data (notes, projects, API key) resides entirely on your local machine within the browser's sandboxed storage (`IndexedDB`).
*   **You Bring the Key:** To enable AI features, you provide your own Google Gemini API key. This is stored locally and creates a direct relationship between you and the AI provider, ensuring we never act as a middleman.
*   **Direct & Secure AI Communication:** Note content is sent from your browser directly to the Google Gemini API over HTTPS. It is not proxied through any third-party server. Per Google's policy, this data is not stored or used for model training.

---

## 🚀 Getting Started

NoteTaker AI is a fully client-side application and requires **zero installation**.

1.  **Obtain a Gemini API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Click "**Create API key in new project**".
    *   Copy the generated API key to your clipboard.

2.  **Launch the App & Configure:**
    *   Open the NoteTaker AI application. You will be greeted with a one-time setup screen.
    *   Paste your API key when prompted.
    *   That's it! All AI features are now enabled. Your key is stored securely in your browser for future sessions.

You can change your key or other settings at any time from the main menu.

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript
*   **AI:** Google Gemini API (`@google/genai`)
*   **Data Storage:** IndexedDB (via `idb` library)
*   **Styling:** Tailwind CSS
*   **Offline Capability:** Service Workers API
*   **Client-Side File Parsing:** `mammoth` (DOCX), `pdfjs-dist` (PDF), `read-excel-file` (XLSX)
