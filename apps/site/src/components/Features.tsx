import React from "react";

const features = [
  {
    icon: "🔒",
    title: "Local-First & Encrypted",
    description:
      "All conversations, attachments, and preferences are encrypted on your device using AES-256-GCM. Nothing leaves your machine unencrypted."
  },
  {
    icon: "🛡️",
    title: "Zero Data Retention Verified",
    description:
      "Strict mode enforces xAI's ZDR (store:false) and verifies the x-zero-data-retention header before sending sensitive content."
  },
  {
    icon: "⚡",
    title: "Streaming & Real-time",
    description:
      "HTTP streaming with WebSocket support for instant, token-by-token responses. Feels as fast as native apps."
  },
  {
    icon: "🤖",
    title: "Agents & Tools",
    description:
      "Built-in agents (General, Researcher, Coder, Analyst) with web search, X search, code execution, and MCP support."
  },
  {
    icon: "📁",
    title: "Files & Local Search",
    description:
      "Drag-and-drop PDFs, code, docs. Local extraction, chunking, and lexical retrieval — no vector DB required."
  },
  {
    icon: "💻",
    title: "CLI + Browser + Native",
    description:
      "One codebase. Terminal chat (gh0st chat), local web UI (gh0st web), macOS app (Tauri), iOS app (Tauri)."
  },
  {
    icon: "🔍",
    title: "Transparent Privacy",
    description:
      "Real-time privacy status: ZDR verification, vault state, active MCP destinations, telemetry toggles — all visible."
  },
  {
    icon: "📦",
    title: "Import/Export",
    description:
      "Encrypted backups with passphrase protection. Portable between devices. Plaintext export for data portability."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Built for Privacy, Designed for Power
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Every feature respects your data sovereignty while delivering a first-class AI experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <article
              key={index}
              className="group p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}