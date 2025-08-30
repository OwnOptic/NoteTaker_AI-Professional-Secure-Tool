# NoteTaker AI: Features & Backlog

This document provides a comprehensive inventory of the current features of the NoteTaker AI application and outlines a backlog of potential future enhancements.

---

## ✅ Current Features (Inventory)

### Core Functionality
- **Offline-First Note Taking:** Full capability to create, read, edit, and delete notes without an internet connection.
- **Privacy-First Architecture:** All user data (notes, projects, API key) is stored exclusively in the browser's local IndexedDB. No cloud sync or backend server.
- **Rich Text & Markdown Support:** A versatile editor that supports Markdown syntax with a live preview mode.
- **Hierarchical Organization:** Notes are organized into user-defined Projects and Subjects.
- **Note Version History:** Automatically saves previous versions of notes, allowing users to view and restore them.
- **Templating System:** Includes pre-built templates (e.g., Meeting Minutes) and allows any user-created note to be saved as a custom template.
- **Full Data Portability:** Users can export their entire database (notes, projects, settings) to a single JSON file and import it into another instance.
- **Progressive Web App (PWA):** The application can be installed on desktop or mobile devices for a native-like experience.
- **Multi-Language Support:** The user interface is translated into several languages, selectable in the settings.

### AI-Powered Features (via Google Gemini API)
- **🤖 Auto-Sync Analysis:** After a note is modified, the AI works in the background to automatically:
  - Generate a concise summary and a detailed summary.
  - Extract actionable To-Do items.
  - Identify and list key people mentioned.
  - Detect and list key decisions made.
  - Suggest relevant tags for categorization.
  - Assign the note to the most appropriate Project and Subject.
- **🎙️ Meeting Assistant:**
  - **Live Transcription:** Real-time transcription using the microphone.
  - **System Audio Transcription:** Records and transcribes audio from a shared browser tab or window.
  - **Visual Context:** Captures periodic screenshots during screen sharing to provide richer context for meeting summaries.
- **📄 Content Ingestion & OCR:**
  - Upload and analyze various file types: DOCX, PDF, XLSX, TXT, and images (PNG, JPG).
  - The AI performs Optical Character Recognition (OCR) on images and PDFs, extracts content, and formats it into a new, fully organized note.
- **💬 Cognito AI Chat:**
  - A conversational assistant that can search and synthesize information from the user's entire note library.
  - Provides citations and links back to the source notes used to generate an answer.
- **✨ AI Quick Actions:**
  - **Continue Writing:** Prompts the AI to continue writing from the cursor's position.
  - **Translate Note:** Translates the entire note content into a different language.
  - **Change Tone:** Rewrites the note's content in a different style (e.g., Professional, Casual, Friendly).
  - **Summarize Selection:** Generates a summary for a specific piece of highlighted text.
- **🧠 Semantic Search:**
  - A powerful search mode that finds notes based on conceptual meaning, not just keyword matches.

### UI/UX & Productivity
- **📊 Dashboard:** A central hub displaying quick actions, statistics (total notes, projects), and a list of recently updated notes.
- **⌨️ Command Palette (Ctrl+K):** A fast, keyboard-driven interface for navigating to any note or project and executing common commands.
- **🕸️ Mind Map View:** A visual representation of the knowledge graph, showing `[[wiki-style]]` links between notes as a network.
- **🎨 Theming:** A polished default Dark theme and a clean Light theme, switchable in settings.
- **📱 Responsive Design:** A seamless experience on both desktop and mobile devices.
- **🎓 Interactive Tutorial:** A guided, non-intrusive tour for first-time users that highlights key features.

---

## 🚀 Future Features & Backlog

### High Priority
- **End-to-End Encrypted Cloud Sync (Optional):** Allow users to optionally sync their encrypted data across devices using a cloud provider like Google Drive or Dropbox. The encryption key would remain client-side to preserve the privacy-first model.
- **Advanced Search Operators:** Introduce search operators like `tag:`, `project:`, `created:<date>`, and boolean operators (AND, OR, NOT) for more precise filtering.
- **Mobile App Wrapper (Capacitor/Tauri):** Package the web app as a native mobile application for better performance and deeper platform integration (e.g., share sheets, notifications).

### Medium Priority
- **Note Sharing:** Generate secure, time-limited, read-only links for individual notes.
- **Calendar Integration:** Create a new view to see notes on a calendar based on their creation date or a specified date in the note's metadata.
- **Expanded Visualizations:** Enhance the `DataGraph` component to support more chart types (line, pie) and allow users to manually create charts from tables in their notes.
- **Plugin System:** Develop an architecture to allow for third-party plugins (e.g., a "publish to blog" plugin, a Zotero integration plugin for researchers).

### Ideas & Enhancements
- **Voice Memos:** Allow users to record and attach audio clips to notes, with on-demand AI transcription.
- **Web Clipper Extension:** A browser extension to easily clip articles and web content directly into NoteTaker AI as a new note.
- **Real-time Collaboration:** A significant feature that would require a backend (e.g., using CRDTs), potentially as an opt-in "pro" feature for teams.
- **Customizable Dashboards:** Allow users to add, remove, and rearrange widgets on their dashboard view.
