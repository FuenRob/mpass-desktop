import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import StartScreen from "./components/StartScreen";
import VaultScreen from "./components/VaultScreen";
import SettingsModal from "./components/SettingsModal";
import "./App.css";

export type PasswordEntry = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
};

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [vaultData, setVaultData] = useState<PasswordEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  const handleUnlock = (path: string, pass: string, data: PasswordEntry[]) => {
    setDbPath(path);
    setMasterPassword(pass);
    setVaultData(data);
    setIsUnlocked(true);
  };

  const handleLock = async () => {
    try {
      await invoke("lock_vault");
    } catch (e) {
      console.error("Lock error:", e);
    }
    setIsUnlocked(false);
    setMasterPassword("");
    setVaultData([]);
  };

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
      </header>

      <main className="animate-fade-in" style={{ flex: 1, overflowY: "auto" }}>
        {!isUnlocked ? (
          <StartScreen onUnlock={handleUnlock} />
        ) : (
          <VaultScreen 
            dbPath={dbPath!} 
            masterPassword={masterPassword} 
            initialData={vaultData}
            onLock={handleLock}
          />
        )}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
