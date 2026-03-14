import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Info } from "lucide-react";
import StartScreen from "./components/StartScreen";
import VaultScreen from "./components/VaultScreen";
import SettingsModal from "./components/SettingsModal";
import LegalModal from "./components/LegalModal";
import "./App.css";

export type VaultData = {
  folders: string[];
  entries: PasswordEntry[];
};

export type PasswordEntry = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  folder: string;
};

export type ThemeMode = "light" | "dark" | "system";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("app-theme") as ThemeMode) || "system";
  });
  const { t } = useTranslation();

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    const applyTheme = () => {
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const handleUnlock = (path: string, pass: string, data: VaultData) => {
    setDbPath(path);
    setMasterPassword(pass);
    setVaultData(data);
    setIsUnlocked(true);
  };

  const handleLock = useCallback(async () => {
    try {
      await invoke("lock_vault");
    } catch (e) {
      console.error("Lock error:", e);
    }
    setIsUnlocked(false);
    setMasterPassword("");
    setVaultData(null);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        padding: "1rem 2rem", 
        background: "var(--bg-panel)", 
        borderBottom: "1px solid var(--border-color)",
        alignItems: "center" 
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setShowLegal(true)}
            className="secondary"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <Info size={18} />
            {t("legal.title")}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="secondary"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <SlidersHorizontal size={18} />
            {t("settings.title")}
          </button>
        </div>
      </header>

      <main className="animate-fade-in" style={{ flex: 1, overflowY: "auto" }}>
        {!isUnlocked ? (
          <StartScreen onUnlock={handleUnlock} />
        ) : (
          <VaultScreen 
            dbPath={dbPath!} 
            masterPassword={masterPassword} 
            initialData={vaultData!}
            onLock={handleLock}
          />
        )}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} theme={theme} onThemeChange={setTheme} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
    </div>
  );
}

export default App;
