# 🔍 RAG Test Studio

> **A browser-based Retrieval-Augmented Generation (RAG) testing workbench** for QA engineers and AI teams. Upload any document, run natural language queries against it, and validate AI responses — all powered by Google Gemini or a local Ollama model.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🎯 What Does This Project Do?

RAG Test Studio is a **quality assurance and validation tool for RAG (Retrieval-Augmented Generation) pipelines**. It allows you to:

1. **Upload a document** (PDF, DOCX, TXT) — it gets chunked and indexed in memory.
2. **Ask questions** — the app retrieves the most relevant chunks and sends them to an AI model.
3. **Review AI answers** alongside the source chunks it used to generate them.
4. **Track query history** — every query/answer pair is logged with metadata for audit and review.
5. **Export results** — download the full query history as a PDF report.

This is ideal for teams building RAG pipelines who want to **test retrieval quality**, **validate AI answers against source documents**, and **generate evaluation reports**.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Document Upload** | Supports `.pdf`, `.docx`, and `.txt` — parsed and auto-chunked with configurable overlap |
| **Semantic Chunk Retrieval** | Keyword-based top-K retrieval of the most relevant document chunks for each query |
| **Multi-Provider AI** | Choose between **Google Gemini** (cloud) or **Ollama** (local/offline) |
| **Source Attribution** | Every AI answer shows exactly which document chunks were used |
| **Query History Log** | All Q&A sessions are persisted with timestamps, chunk count, and provider used |
| **History Filtering** | Search and filter query history by question text or answer content |
| **PDF Export** | Export the full history log to a professional PDF report with `html2pdf.js` |
| **Auto Model Discovery** | Automatically discovers available Ollama models from your local server |
| **Connection Testing** | Test-and-verify buttons for both Gemini and Ollama before running queries |
| **Demo Questions** | Pre-seeded example questions to get started immediately |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                Browser (No Backend)          │
│                                             │
│  ┌──────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Document │  │  Dashboard │  │ History │ │
│  │  Upload  │  │  (Q&A UI)  │  │   Log   │ │
│  └────┬─────┘  └─────┬──────┘  └────┬────┘ │
│       │              │               │      │
│  ┌────▼──────────────▼───────────────▼────┐ │
│  │         React Context (State)          │ │
│  │  DocumentContext / HistoryContext /    │ │
│  │  SettingsContext                       │ │
│  └────┬──────────────────────────────────┘ │
│       │                                     │
│  ┌────▼─────────────────────┐               │
│  │     Utility Layer        │               │
│  │  documentParser (PDF/    │               │
│  │  DOCX/TXT) → chunker →  │               │
│  │  retriever → aiProvider  │               │
│  └────┬─────────────────────┘               │
└───────┼─────────────────────────────────────┘
        │
   ┌────▼──────────┐   ┌──────────────────┐
   │ Google Gemini │   │ Local Ollama API  │
   │   Cloud API   │   │ (http://localhost │
   │               │   │  :11434)         │
   └───────────────┘   └──────────────────┘
```

> **100% client-side** — no backend server required. All processing runs in the browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Routing** | React Router DOM v7 |
| **Charts** | Recharts |
| **PDF Parsing** | `pdfjs-dist` |
| **DOCX Parsing** | `mammoth` |
| **PDF Export** | `html2pdf.js` |
| **AI (Cloud)** | Google Gemini API (`@google/genai`) |
| **AI (Local)** | Ollama REST API |
| **Linting** | Oxlint |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) **OR** a running [Ollama](https://ollama.com/) instance

### Installation

```bash
# Clone the repository
git clone https://github.com/tiwarysuniel-aml/RAG_Test-Studio.git
cd RAG_Test-Studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

### Configuration

1. Navigate to the **Settings** page in the app.
2. Select your AI provider: **Gemini** or **Ollama**.
3. Enter your Gemini API key, or configure your Ollama base URL.
4. Click **Test Connection** to verify.
5. Go to **Document** page and upload a `.pdf`, `.docx`, or `.txt` file.
6. Go to the **Dashboard** and start asking questions.

### Ollama Setup (for local/offline use)

Start Ollama with CORS enabled so the browser can reach it:

```bash
# Windows
set OLLAMA_ORIGINS=*
ollama serve

# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve
```

Then use the **Auto-Discover Models** button in Settings to detect available models.

---

## 📁 Project Structure

```
RAG_Test-Studio/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main Q&A interface with Recharts visualization
│   │   ├── Document.tsx     # File upload and chunk viewer
│   │   ├── History.tsx      # Query log with search, filter, and PDF export
│   │   └── Settings.tsx     # AI provider config and connection test
│   ├── components/
│   │   └── Layout.tsx       # Navigation shell
│   ├── context/
│   │   ├── DocumentContext.tsx   # Parsed doc + chunks state
│   │   ├── HistoryContext.tsx    # Q&A audit log state
│   │   └── SettingsContext.tsx   # AI provider config state
│   └── utils/
│       ├── documentParser.ts     # PDF / DOCX / TXT parsers
│       ├── chunker.ts            # Text chunking with sliding window overlap
│       ├── retriever.ts          # Top-K chunk retrieval (keyword similarity)
│       └── aiProvider.ts         # Gemini + Ollama API adapters
├── index.html
├── package.json
└── vite.config.ts
```

---

## 💡 Skills Demonstrated

- **RAG Pipeline Engineering** — document parsing, chunking, retrieval, and AI augmentation
- **TypeScript + React** — fully typed component tree with Context API for state management
- **Multi-Provider AI** — abstracted AI provider layer supporting both cloud and local LLMs
- **Frontend-Only Architecture** — entire pipeline runs in the browser with no server needed
- **QA Tooling** — designed for AI system validation, answer attribution, and evaluation reporting
- **Modern Toolchain** — Vite 8, Tailwind CSS v4, Oxlint, TypeScript 6

---

## 📄 License

MIT License — feel free to use, fork, and extend.
