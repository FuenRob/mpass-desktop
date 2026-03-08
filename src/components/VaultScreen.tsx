import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { PasswordEntry } from "../App";
import { useAutoLock } from "../hooks/useAutoLock";
import SettingsModal from "./SettingsModal";

interface VaultScreenProps {
  dbPath: string;
  masterPassword: string;
  initialData: PasswordEntry[];
  onLock: () => void;
}

export default function VaultScreen({ dbPath, masterPassword, initialData, onLock }: VaultScreenProps) {
  const [entries, setEntries] = useState<PasswordEntry[]>(initialData);
  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [previewPassword, setPreviewPassword] = useState("");

  const [form, setForm] = useState<PasswordEntry>({
    id: "",
    name: "",
    url: "",
    username: "",
    password: "",
    notes: ""
  });

  useAutoLock(60000, onLock);

  const handleSaveData = async (newEntries: PasswordEntry[]) => {
    try {
      await invoke("save_database", {
        path: dbPath,
        masterPassword,
        entries: newEntries
      });
      setEntries(newEntries);
    } catch (err: any) {
      alert("Failed to save: " + err.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedEntries = [...entries];

    if (editingIndex !== null) {
      updatedEntries[editingIndex] = form;
    } else {
      updatedEntries.push({ ...form, id: crypto.randomUUID() });
    }

    handleSaveData(updatedEntries);
    handleCancel();
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setForm(entries[index]);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("vault_screen.confirm_delete"))) {
      const updatedEntries = entries.filter((e) => e.id !== id);
      handleSaveData(updatedEntries);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setForm({ id: "", name: "", url: "", username: "", password: "", notes: "" });
  };

  const filteredEntries = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.url.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  );

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let pool = chars;
    if (genNumbers) pool += nums;
    if (genSymbols) pool += syms;

    let password = "";
    const randomValues = new Uint32Array(genLength);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < genLength; i++) {
      password += pool[randomValues[i] % pool.length];
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
    setForm({ ...form, password: previewPassword });
    setShowGenerator(false);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", width: "100%", maxWidth: "1200px" }}>
      {/* Sidebar: List */}
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", height: "85vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>{t("vault_screen.title")}</h2>
            <button onClick={() => setShowSettings(true)} className="secondary" style={{ padding: "0.4rem 0.6rem", background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }} title={t("settings.title")}>
              ⚙️
            </button>
          </div>
          <button onClick={onLock} className="danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
            {t("vault_screen.lock_vault")}
          </button>
        </div>

        <input
          type="text"
          placeholder={t("vault_screen.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filteredEntries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
              onClick={() => handleEdit(idx)}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{entry.name || t("vault_screen.unnamed")}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{entry.username}</div>
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div style={{ color: "var(--text-secondary)", marginTop: "2rem" }}>{t("vault_screen.no_entries")}</div>
          )}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="glass-panel" style={{ flex: 2, height: "85vh", overflowY: "auto" }}>
        <h2>{editingIndex !== null ? t("vault_screen.edit_entry") : t("vault_screen.new_entry")}</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2rem", textAlign: "left" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.name")}</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.url")}</label>
            <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.username")}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input required type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={{ flex: 1 }} />
              {editingIndex !== null && (
                <button type="button" className="secondary" onClick={() => navigator.clipboard.writeText(form.username)} title={t("vault_screen.copy_username")} style={{ padding: "0 0.8rem" }}>📋</button>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.password")}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowGenerator(true)} title={t("vault_screen.generate_password")} style={{ padding: "0 0.8rem", fontSize: "1.2rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)" }}>🔑</button>
              {editingIndex !== null && (
                <button type="button" className="secondary" onClick={() => navigator.clipboard.writeText(form.password)} title={t("vault_screen.copy_password")} style={{ padding: "0 0.8rem" }}>📋</button>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{
                width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)",
                background: "var(--bg-panel)", color: "var(--text-primary)", fontFamily: "inherit", minHeight: "100px"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" style={{ flex: 1 }}>{t("vault_screen.save_entry")}</button>
            {editingIndex !== null && (
              <>
                <button type="button" className="secondary" onClick={handleCancel}>{t("vault_screen.cancel")}</button>
                <button type="button" className="danger" onClick={() => handleDelete(form.id)}>{t("vault_screen.delete")}</button>
              </>
            )}
          </div>
        </form>
      </div>

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
                  <button type="button" className="secondary" onClick={() => navigator.clipboard.writeText(previewPassword)} title={t("vault_screen.copy_preview")} style={{ padding: "0 0.8rem" }}>📋</button>
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
