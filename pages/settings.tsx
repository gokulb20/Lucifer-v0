import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      const isDark = JSON.parse(savedDarkMode);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Settings - Lucifer</title>
        <meta name="description" content="Lucifer Settings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors">
        <div className="border-b border-neutral-300 dark:border-neutral-700 py-4 px-4 sm:px-8">
          <div className="max-w-2xl mx-auto flex items-center">
            <Link
              href="/"
              className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 mr-2" />
              Back to Chat
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Integrations
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Connect services through Klavis to give Lucifer access to your tools.
          </p>

          {/* Klavis connection card */}
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
              Manage Connections
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Connect Gmail, Google Calendar, and other services through Klavis MCP Servers.
              Once connected there, Lucifer can use those tools automatically.
            </p>
            <a
              href="https://klavis.ai/mcp-servers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Open Klavis Dashboard
              <IconExternalLink className="h-4 w-4 ml-2" />
            </a>
          </div>

          {/* Klavis tools */}
          <div className="mt-8">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
              Klavis Tools (OAuth)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📧</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Gmail</p>
                  <p className="text-sm text-neutral-500">Search, read, send emails</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Google Calendar</p>
                  <p className="text-sm text-neutral-500">Check schedule, create events</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">💻</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">GitHub</p>
                  <p className="text-sm text-neutral-500">Repos, issues, PRs</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📁</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Google Drive</p>
                  <p className="text-sm text-neutral-500">Search, list, read files</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">💼</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">LinkedIn</p>
                  <p className="text-sm text-neutral-500">Profile, post updates</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📬</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Outlook</p>
                  <p className="text-sm text-neutral-500">Search, read, send emails</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">💬</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Discord</p>
                  <p className="text-sm text-neutral-500">Servers, channels, messages</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📷</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Instagram</p>
                  <p className="text-sm text-neutral-500">Profile, posts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Direct API tools */}
          <div className="mt-8">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
              Direct API Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">🔍</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Web Search</p>
                  <p className="text-sm text-neutral-500">Search the internet (Tavily)</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">📰</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">News</p>
                  <p className="text-sm text-neutral-500">Headlines, search articles</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <span className="text-xl mr-3">🌤️</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Weather</p>
                  <p className="text-sm text-neutral-500">Current conditions, forecast</p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              How it works
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Once you authorize services on Klavis, Lucifer can use those tools when needed.
              Just ask naturally - &quot;check my calendar&quot; or &quot;any emails from John?&quot;
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
