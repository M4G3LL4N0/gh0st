import React from "react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" aria-label="gh0st home">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">gh0st</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">v1.0.0</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              Features
            </Link>
            <Link to="#privacy" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              Privacy
            </Link>
            <Link to="#docs" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              Docs
            </Link>
            <a
              href="https://github.com/gh0st"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              GitHub
            </a>
            <Link
              to="#download"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Download
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}