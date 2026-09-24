import React, { useEffect, useState } from "react";
import { cn } from "@gh0st/ui";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { Composer } from "./components/Composer";
import { useStore } from "./store";
import { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: "New Chat", icon: Plus, action: () => useStore.getState().newChat() },
  { label: "Conversations", icon: MessageSquare, action: () => {} },
  { label: "Agents", icon: Bot, action: () => {} },
  { label: "Settings", icon: Settings, action: () => {} }
];

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { initialized, initialize, theme } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">gh0st</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector />
            <PrivacyIndicator />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex overflow-hidden">
          <ChatArea />
        </main>
        <Composer />
      </div>
      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

function ModelSelector() {
  const { config, setConfig } = useStore();
  const models = Object.values(config?.models || {});

  return (
    <select
      value={config?.model || "grok-3"}
      onChange={(e) => setConfig({ ...config!, model: e.target.value })}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Select model"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

function PrivacyIndicator() {
  const { privacyState } = useStore();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
      <Badge variant={privacyState?.zdrVerified ? "success" : "warning"}>
        {privacyState?.zdrVerified ? "ZDR Verified" : "ZDR Not Verified"}
      </Badge>
      <Tooltip content={privacyState?.zdrVerified ? "Zero Data Retention verified" : "Zero Data Retention not verified"}>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </Tooltip>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useStore();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-accent"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 z-50 w-64 bg-card shadow-lg">
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

import { Plus, MessageSquare, Bot, Settings, Menu, Sun, Moon, Info } from "lucide-react";
import { Badge } from "@gh0st/ui";
import { Tooltip } from "@gh0st/ui";