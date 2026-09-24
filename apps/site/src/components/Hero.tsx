import React from "react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
          </span>
          Private AI Client — Local-first, Encrypted, xAI-powered
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Your AI.{" "}
          <span className="text-primary-600 dark:text-primary-400">Your Data.</span>
          <br />
          <span className="text-primary-600 dark:text-primary-400">Your Rules.</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
          gh0st is a polished, open-source AI client that gives you a ChatGPT-class experience
          with zero compromise on privacy. Conversations stay on your device. Encrypted by default.
          Powered by Grok.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="#download"
            className="w-full sm:w-auto rounded-lg bg-primary-600 px-8 py-4 text-lg font-medium text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
          >
            Download for macOS
          </Link>
          <a
            href="https://github.com/gh0st"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto rounded-lg border-2 border-gray-300 dark:border-gray-600 px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            View on GitHub
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Zero Data Retention verified
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            End-to-end encrypted
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Local-first architecture
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Open source (MIT)
          </span>
        </div>
      </div>
    </section>
  );
}