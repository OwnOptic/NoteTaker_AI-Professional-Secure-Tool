# NoteTaker AI

NoteTaker AI is an intelligent note-taking application that uses the Google Gemini API to automatically categorize, summarize, and organize your notes. It stores all notes securely and privately in your browser's local database, making them accessible offline while ensuring you retain full ownership of your data.

## Features

- **Local-First Storage:** All notes are stored in your browser's IndexedDB. No cloud account is needed.
- **Offline-First:** Read and write notes even when you're offline.
- **AI-Powered Organization:** Automatically generates summaries, to-do lists, key people, and tags for your notes.
- **Meeting Assistant:** Live transcription and screen capture analysis to produce detailed meeting minutes.
- **Content Upload:** Upload images, PDFs, or Word documents and have the AI automatically convert them into organized notes.
- **Cognito AI Chat:** Chat with your notes to find information and get synthesized answers.
- **Multi-language Support:** The UI and AI responses can be configured for multiple languages.

---

## 🚀 Getting Started

NoteTaker AI is a fully client-side application. To use it, simply deploy it to any static web hosting provider (like Vercel, Netlify, or GitHub Pages).

### Enabling AI Features

To unlock the powerful AI features, you need a Google Gemini API key.

1.  **Deploy the Application:** First, deploy the application to your preferred static hosting service.

2.  **Obtain an API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Click "Create API key in new project".
    *   Copy the generated API key to your clipboard.

3.  **Configure the App:**
    *   Open your deployed application in your browser.
    *   Click the main menu icon and go to **Settings**.
    *   Paste your API key into the "Your Personal Gemini API Key" field.
    *   Click "Save Settings".

All AI features, such as automatic summarization, meeting transcription, and chat, will now be enabled. Your key is stored securely in your browser's local storage and is never sent anywhere else.
