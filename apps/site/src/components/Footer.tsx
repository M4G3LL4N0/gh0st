import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">gh0st</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Private AI client. Local-first, encrypted, xAI-powered.
              Built for those who believe privacy is a feature, not a setting.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/gh0st" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">GitHub</a></li>
              <li><Link to="#docs" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Documentation</Link></li>
              <li><Link to="#privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Privacy Model</Link></li>
              <li><a href="https://github.com/gh0st/security" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Security Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/gh0st/discussions" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Discussions</a></li>
              <li><a href="https://github.com/gh0st/issues" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Issue Tracker</a></li>
              <li><a href="https://github.com/gh0st/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Contributing</a></li>
              <li><a href="https://github.com/gh0st/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Code of Conduct</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/gh0st/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">MIT License</a></li>
              <li><a href="https://github.com/gh0st/blob/main/PRIVACY.md" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</a></li>
              <li><a href="https://github.com/gh0st/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 gh0st. Released under MIT License.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/gh0st" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400" aria-label="GitHub">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://twitter.com/gh0st" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400" aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}