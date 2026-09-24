import React from "react";
import { Link } from "react-router-dom";

const docsSections = [
  {
    title: "Getting Started",
    items: [
      { label: "Installation", href: "#installation" },
      { label: "Quick Start", href: "#quick-start" },
      { label: "Configuration", href: "#configuration" },
      { label: "API Key Setup", href: "#api-key-setup" }
    ]
  },
  {
    title: "Usage",
    items: [
      { label: "Chat Interface", href: "#chat-interface" },
      { label: "Agents", href: "#agents" },
      { label: "Tools (Web, X, Code)", href: "#tools" },
      { label: "Files & Search", href: "#files" },
      { label: "CLI Reference", href: "#cli-reference" }
    ]
  },
  {
    title: "Privacy & Security",
    items: [
      { label: "Threat Model", href: "#threat-model" },
      { label: "Cryptography", href: "#cryptography" },
      { label: "ZDR Verification", href: "#zdr" },
      { label: "Vault & Encryption", href: "#vault" },
      { label: "Data Export/Import", href: "#export-import" }
    ]
  },
  {
    title: "Development",
    items: [
      { label: "Architecture", href: "#architecture" },
      { label: "Building from Source", href: "#building" },
      { label: "Testing", href: "#testing" },
      { label: "Contributing", href: "#contributing" }
    ]
  }
];

export function Docs() {
  return (
    <section id="docs" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Documentation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to use, configure, and extend gh0st.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {docsSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i}>
                    <Link
                      to={item.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Commands
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">CLI</h4>
              <div className="space-y-2 font-mono text-sm bg-gray-950 dark:bg-black rounded-lg p-4 overflow-x-auto">
                <div className="text-green-400"># Interactive chat</div>
                <div>gh0st chat</div>
                <div className="text-green-400"># One-shot question</div>
                <div>gh0st ask "What is Rust?"</div>
                <div className="text-green-400"># Start local web UI</div>
                <div>gh0st web</div>
                <div className="text-green-400"># Verify ZDR</div>
                <div>gh0st zdr</div>
                <div className="text-green-400"># Check status</div>
                <div>gh0st status</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Development</h4>
              <div className="space-y-2 font-mono text-sm bg-gray-950 dark:bg-black rounded-lg p-4 overflow-x-auto">
                <div className="text-green-400"># Install deps</div>
                <div>pnpm install</div>
                <div className="text-green-400"># Dev server</div>
                <div>pnpm dev:client</div>
                <div className="text-green-400"># Build all</div>
                <div>pnpm build</div>
                <div className="text-green-400"># Run tests</div>
                <div>pnpm test</div>
                <div className="text-green-400"># Type check</div>
                <div>pnpm typecheck</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}