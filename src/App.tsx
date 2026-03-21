import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Info } from "lucide-react";
import { VaultData, ThemeMode } from "./types";
import { lockVault } from "./utils/tauriApi";
import StartScreen from "./components/StartScreen";
import VaultScreen from "./components/VaultScreen";
import SettingsModal from "./components/SettingsModal";
import LegalModal from "./components/LegalModal";
import "./App.css";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbPath, setDbPath] = useState<string | null>(null);
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

  const handleUnlock = useCallback((path: string, data: VaultData) => {
    setDbPath(path);
    setVaultData(data);
    setIsUnlocked(true);
  }, []);

  const handleLock = useCallback(async () => {
    try {
      await lockVault();
    } catch (e) {
      console.error("Lock error:", e);
    }
    setIsUnlocked(false);
    setVaultData(null);
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-actions">
          <button onClick={() => setShowLegal(true)} className="header-btn">
            <Info size={18} />
            {t("legal.title")}
          </button>
          <button onClick={() => setShowSettings(true)} className="header-btn">
            <SlidersHorizontal size={18} />
            {t("settings.title")}
          </button>
        </div>
      </header>

      <main className="animate-fade-in app-main">
        {!isUnlocked ? (
          <StartScreen onUnlock={handleUnlock} />
        ) : (
          <VaultScreen
            dbPath={dbPath!}
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
