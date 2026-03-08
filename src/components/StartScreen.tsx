import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from "react-i18next";
import { PasswordEntry } from "../App";
import SettingsModal from "./SettingsModal";

interface StartScreenProps {
  onUnlock: (path: string, pass: string, data: PasswordEntry[]) => void;
}

type ActionState =
  | { type: 'idle' }
  | { type: 'create', path: string }
  | { type: 'open', path: string };

export default function StartScreen({ onUnlock }: StartScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ActionState>({ type: 'idle' });
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  const recents: string[] = JSON.parse(localStorage.getItem("recent_dbs") || "[]");

  const saveRecent = (path: string) => {
    const updated = [path, ...recents.filter(p => p !== path)].slice(0, 5);
    localStorage.setItem("recent_dbs", JSON.stringify(updated));
  }

  const handleCreateClick = async () => {
    setError("");
    try {
      const selectedPath = await save({
        filters: [{
          name: 'Text Database',
          extensions: ['txt']
        }]
      });
      if (selectedPath) {
        setAction({ type: 'create', path: selectedPath });
      }
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleImportClick = async () => {
    setError("");
    try {
      const selectedPath = await open({
        multiple: false,
        filters: [{
          name: 'Text Database',
          extensions: ['txt']
        }]
      });
      if (selectedPath && typeof selectedPath === 'string') {
        setAction({ type: 'open', path: selectedPath });
      }
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const executeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(t("start_screen.error_required"));
      return;
    }

    if (action.type === 'create') {
      try {
        setLoading(true);
        await invoke("create_database", { path: action.path, masterPassword: password });
        saveRecent(action.path);
        onUnlock(action.path, password, []);
      } catch (err: any) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    } else if (action.type === 'open') {
      try {
        setLoading(true);
        const data: PasswordEntry[] = await invoke("open_database", { path: action.path, masterPassword: password });
        saveRecent(action.path);
        onUnlock(action.path, password, data);
      } catch (err: any) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelAction = () => {
    setAction({ type: 'idle' });
    setPassword("");
    setError("");
  };

  return (
    <div className="glass-panel" style={{ maxWidth: "500px", margin: "10vh auto", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>{t("start_screen.title")}</h1>
        <button onClick={() => setShowSettings(true)} className="secondary" style={{ padding: "0.4rem 0.6rem", background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }} title={t("settings.title")}>
          ⚙️
        </button>
      </div>

      {action.type === 'idle' ? (
        <>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>{t("start_screen.subtitle")}</p>

          {error && <div style={{ color: "var(--danger-color)", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <button onClick={handleCreateClick} disabled={loading}>{t("start_screen.create_new")}</button>
            <button onClick={handleImportClick} className="secondary" disabled={loading}>{t("start_screen.open_vault")}</button>
          </div>

          {recents.length > 0 && (
            <div style={{ marginTop: "3rem", textAlign: "left" }}>
              <h4 style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>{t("start_screen.recent_vaults")}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recents.map((path) => (
                  <button
                    key={path}
                    className="secondary"
                    style={{ textAlign: "left", fontSize: "0.9rem", padding: "0.5rem 1rem", overflow: "hidden", textOverflow: "ellipsis" }}
                    onClick={() => {
                      setError("");
                      setAction({ type: 'open', path });
                    }}
                    disabled={loading}
                    title={path}
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={executeAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {action.type === 'create' ? t("start_screen.create_prompt") : t("start_screen.open_prompt")}
            <br />
            <span style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{action.path}</span>
          </p>

          <input
            type="password"
            placeholder={t("start_screen.master_password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />

          {error && <div style={{ color: "var(--danger-color)", fontSize: "0.9rem" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" disabled={loading}>
              {action.type === 'create' ? t("start_screen.create_new") : t("start_screen.open_vault")}
            </button>
            <button type="button" onClick={cancelAction} className="secondary" disabled={loading}>{t("start_screen.cancel")}</button>
          </div>
        </form>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
