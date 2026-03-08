import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import StartScreen from "./components/StartScreen";
import VaultScreen from "./components/VaultScreen";
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
    <main className="animate-fade-in">
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
  );
}

export default App;
