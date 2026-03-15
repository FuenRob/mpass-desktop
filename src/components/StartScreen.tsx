import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from "react-i18next";
import { VaultData } from "../App";

interface StartScreenProps {
  onUnlock: (path: string, pass: string, data: VaultData) => void;
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
  const { t } = useTranslation();
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [previewPassword, setPreviewPassword] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyWithClear = async (text: string, field: string) => {
    try {
      await invoke("copy_to_clipboard_with_timeout", { text });
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getPasswordStrength = (pwd: string): { score: number; labelKey: string } => {
    if (!pwd) return { score: 0, labelKey: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = [
      "vault_screen.strength_very_weak",
      "vault_screen.strength_weak",
      "vault_screen.strength_fair",
      "vault_screen.strength_strong",
      "vault_screen.strength_very_strong",
    ];
    return { score, labelKey: labels[Math.min(score, 4)] };
  };

  const recents: string[] = JSON.parse(localStorage.getItem("recent_dbs") || "[]");

  const saveRecent = (path: string) => {
    const updated = [path, ...recents.filter(p => p !== path)].slice(0, 5);
    localStorage.setItem("recent_dbs", JSON.stringify(updated));
  }

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let pool = chars;
    if (genNumbers) pool += nums;
    if (genSymbols) pool += syms;

    const poolSize = pool.length;
    // Rejection sampling: discard values >= largest multiple of poolSize in uint32 range
    // to eliminate modulo bias.
    const maxUnbiased = Math.floor(0x100000000 / poolSize) * poolSize;

    let password = "";
    let generated = 0;
    while (generated < genLength) {
      const batch = new Uint32Array(Math.max(genLength - generated, 8));
      window.crypto.getRandomValues(batch);
      for (const value of batch) {
        if (value < maxUnbiased) {
          password += pool[value % poolSize];
          generated++;
          if (generated >= genLength) break;
        }
      }
    }

    setPreviewPassword(password);
    return password;
  };

  useEffect(() => {
    if (showGenerator) {
      generatePassword();
    }
  }, [genLength, genNumbers, genSymbols, showGenerator]);

  const applyPassword = () => {
    setPassword(previewPassword);
    setShowGenerator(false);
  };

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
    } catch (err) {
      setError(String(err));
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
    } catch (err) {
      setError(String(err));
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
        onUnlock(action.path, password, { folders: [], entries: [] });
      } catch (err) {
        if (err === "Wrong password or corrupted data!") {
          setError(t("start_screen.error_wrong_password"));
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    } else if (action.type === 'open') {
      try {
        setLoading(true);
        const data: VaultData = await invoke("open_database", { path: action.path, masterPassword: password });
        saveRecent(action.path);
        onUnlock(action.path, password, data);
      } catch (err) {
        if (err === "Wrong password or corrupted data!") {
          setError(t("start_screen.error_wrong_password"));
        } else {
          setError(String(err));
        }
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>{t("start_screen.title")}</h1>
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

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="password"
              placeholder={t("start_screen.master_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {action.type === 'create' && (
              <button type="button" onClick={() => setShowGenerator(true)} title={t("vault_screen.generate_password")} style={{ padding: "0 0.8rem", fontSize: "1.2rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>🔑</button>
            )}
          </div>
          {action.type === 'create' && password && (() => {
            const { score, labelKey } = getPasswordStrength(password);
            const colors = ["#e11d48", "#f97316", "#eab308", "#84cc16", "#22c55e"];
            const color = colors[Math.min(score, 4)];
            return (
              <div>
                <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= score ? color : "var(--border-color)", transition: "background 0.2s" }} />
                  ))}
                </div>
                <span style={{ fontSize: "0.75rem", color }}>{t(labelKey)}</span>
              </div>
            );
          })()}

          {error && <div style={{ color: "var(--danger-color)", fontSize: "0.9rem" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" disabled={loading}>
              {action.type === 'create' ? t("start_screen.create_new") : t("start_screen.open_vault")}
            </button>
            <button type="button" onClick={cancelAction} className="secondary" disabled={loading}>{t("start_screen.cancel")}</button>
          </div>
        </form>
      )}

      {showGenerator && (
        <div className="modal-overlay" onClick={() => setShowGenerator(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0" }}>{t("vault_screen.generate_password")}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>{t("vault_screen.length", { val: genLength })}</span>
                </label>
                <input
                  type="range"
                  min="8" max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  style={{ padding: "0" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={genNumbers}
                  onChange={(e) => setGenNumbers(e.target.checked)}
                  style={{ width: "auto" }}
                />
                {t("vault_screen.include_numbers")}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={genSymbols}
                  onChange={(e) => setGenSymbols(e.target.checked)}
                  style={{ width: "auto" }}
                />
                {t("vault_screen.include_symbols")}
              </label>

              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{t("vault_screen.preview")}</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="text" readOnly value={previewPassword} style={{ flex: 1, fontFamily: "monospace", fontSize: "1.1rem" }} />
                  <button type="button" className="secondary" onClick={() => copyWithClear(previewPassword, "preview")} title={t("vault_screen.copy_preview")} style={{ padding: "0 0.8rem" }}>
                    {copiedField === "preview" ? "✔" : "📋"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="button" onClick={applyPassword} style={{ flex: 1 }}>{t("vault_screen.apply")}</button>
              <button type="button" className="secondary" onClick={() => setShowGenerator(false)}>{t("vault_screen.cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
