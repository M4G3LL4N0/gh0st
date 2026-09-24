import React from "react";

const privacyPoints = [
  {
    title: "No gh0st Cloud",
    description:
      "gh0st has no backend server that sees your conversations. No account required. No hosted database. Your data never touches our infrastructure."
  },
  {
    title: "Encrypted at Rest",
    description:
      "AES-256-GCM with per-purpose derived keys. Vault master key never stored in plaintext. Argon2id for passphrase derivation. Secure key wiping on lock."
  },
  {
    title: "ZDR Enforced",
    description:
      "Strict mode sends store:false to xAI and verifies the x-zero-data-retention response header. Blocks sensitive requests if verification fails."
  },
  {
    title: "Minimal Metadata",
    description:
      "No analytics. No telemetry by default. No crash reporting. No tracking pixels. No ad SDKs. Logs scrubbed of sensitive content."
  },
  {
    title: "Explicit Tool Boundaries",
    description:
      "External tools (web search, X search, code execution, MCP) are opt-in. Destinations shown before use. No silent data exfiltration."
  },
  {
    title: "Portable Encrypted Export",
    description:
      "Full state export encrypted with your passphrase. Import on any device. Plaintext export available for data portability."
  }
];

const threatModel = [
  { threat: "Casual filesystem inspection", protected: true },
  { threat: "Stolen app data directory (without unlock)", protected: true },
  { threat: "Accidental plaintext backups", protected: true },
  { threat: "Accidental provider-side persistence", protected: true, note: "ZDR verified" },
  { threat: "Remote gh0st server compromise", protected: true, note: "No gh0st server exists" },
  { threat: "Fully compromised OS / malware", protected: false },
  { threat: "xAI seeing plaintext during inference", protected: false, note: "Required for AI to work" },
  { threat: "Network metadata (ISP/VPN)", protected: false },
  { threat: "Screenshots / shoulder surfing", protected: false }
];

export function Privacy() {
  return (
    <section id="privacy" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy by Architecture, Not Promise
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We don't ask you to trust us. We build so you don't have to.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              How We Protect You
            </h3>
            <div className="space-y-6">
              {privacyPoints.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{point.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Threat Model — What We Don't Claim
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-semibold text-gray-900 dark:text-white">Threat</th>
                    <th className="pb-3 font-semibold text-gray-900 dark:text-white">Protected</th>
                    <th className="pb-3 font-semibold text-gray-900 dark:text-white">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {threatModel.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 text-gray-700 dark:text-gray-300">{item.threat}</td>
                      <td className="py-3 text-center">
                        {item.protected ? (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 text-sm">{item.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Crypto Design
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Primitive</h4>
              <p>AES-256-GCM via Web Crypto API (native, audited, hardware-accelerated)</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Derivation</h4>
              <p>HKDF-SHA-256 for purpose-separated subkeys. Argon2id for passphrases.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Nonce Management</h4>
              <p>12-byte random nonces per encryption. Never reused. Stored with ciphertext.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}