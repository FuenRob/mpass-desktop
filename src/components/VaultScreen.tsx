import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PasswordEntry, VaultData } from "../App";
import { useAutoLock } from "../hooks/useAutoLock";

interface VaultScreenProps {
  dbPath: string;
  masterPassword: string;
  initialData: VaultData;
  onLock: () => void;
}

export default function VaultScreen({ dbPath, masterPassword, initialData, onLock }: VaultScreenProps) {
  const [vault, setVault] = useState<VaultData>(initialData);
  const entries = vault.entries;
  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [previewPassword, setPreviewPassword] = useState("");

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<PasswordEntry>({
    id: "",
    name: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    folder: "Sin carpeta"
  });

  useAutoLock(60000, onLock);

  const handleSaveData = async (newVault: VaultData) => {
    try {
      await invoke("save_database", {
        path: dbPath,
        masterPassword,
        vaultData: newVault
      });
      setVault(newVault);
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

    let updatedFolders = [...vault.folders];
    if (form.folder && form.folder !== "Sin carpeta" && !updatedFolders.includes(form.folder)) {
      updatedFolders.push(form.folder);
    }

    handleSaveData({ folders: updatedFolders, entries: updatedEntries });
    handleCancel();
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setForm(entries[index]);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("vault_screen.confirm_delete"))) {
      const updatedEntries = entries.filter((e) => e.id !== id);
      handleSaveData({ ...vault, entries: updatedEntries });
      if (editingIndex !== null && entries[editingIndex]?.id === id) {
        handleCancel();
      }
    }
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === "Sin carpeta") return;
    setFolderToDelete(folderName);
  };

  const confirmDeleteFolder = () => {
    if (!folderToDelete) return;
    
    const updatedFolders = vault.folders.filter(f => f !== folderToDelete);
    const updatedEntries = entries.filter(e => (e.folder || "Sin carpeta") !== folderToDelete);
    
    handleSaveData({ folders: updatedFolders, entries: updatedEntries });
    
    if (editingIndex !== null && (entries[editingIndex]?.folder || "Sin carpeta") === folderToDelete) {
      handleCancel();
    }
    setFolderToDelete(null);
  };

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const handleAddFolderClick = () => {
    setNewFolderName("");
    setShowFolderModal(true);
  };

  const confirmAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName && newFolderName.trim() !== "") {
      const folderName = newFolderName.trim();
      if (!vault.folders.includes(folderName) && folderName !== "Sin carpeta") {
         handleSaveData({ ...vault, folders: [...vault.folders, folderName] });
      }
    }
    setShowFolderModal(false);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setForm({ id: "", name: "", url: "", username: "", password: "", notes: "", folder: "Sin carpeta" });
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

  // Extract unique folders
  const uniqueFoldersSet = new Set(["Sin carpeta", ...vault.folders, ...entries.map(e => e.folder || "Sin carpeta")]);
  const uniqueFolders = Array.from(uniqueFoldersSet).sort();

  // Group filtered entries by folder
  const groupedEntries = uniqueFolders.reduce((acc, fn) => {
    acc[fn] = [];
    return acc;
  }, {} as Record<string, PasswordEntry[]>);

  filteredEntries.forEach(entry => {
    const fn = entry.folder || "Sin carpeta";
    if (groupedEntries[fn]) {
      groupedEntries[fn].push(entry);
    } else {
      groupedEntries[fn] = [entry];
    }
  });

  const finalGroupedEntries = Object.entries(groupedEntries).filter(([_fn, list]) => {
     if (search.trim() !== "") return list.length > 0;
     return true;
  });

  return (
    <div style={{ display: "flex", gap: "2rem", width: "100%", maxWidth: "1200px" }}>
      {/* Sidebar: List */}
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", height: "85vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>{t("vault_screen.title")}</h2>
            <button 
              onClick={handleAddFolderClick} 
              title={t("vault_screen.add_folder")}
              style={{ padding: "0.2rem 0.5rem", fontSize: "1.2rem", background: "transparent", border: "1px solid var(--border-color)", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              +
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
          {finalGroupedEntries.sort(([a], [b]) => a.localeCompare(b)).map(([folderName, folderEntries]) => (
            <div key={folderName} style={{ marginBottom: "1rem" }}>
              <div 
                onClick={() => toggleFolder(folderName)}
                style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "bold", 
                color: "var(--text-secondary)", 
                marginBottom: "0.5rem", 
                marginLeft: "0.5rem",
                marginRight: "0.5rem",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
                userSelect: "none"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {collapsedFolders[folderName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  {folderName === "Sin carpeta" ? t("vault_screen.no_folder") : folderName}
                </span>
                {folderName !== "Sin carpeta" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folderName); }}
                    title={t("vault_screen.delete_folder")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--danger-color)",
                      cursor: "pointer",
                      padding: "0.2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {!collapsedFolders[folderName] && folderEntries.map((entry) => {
                  const originalIndex = entries.findIndex(e => e.id === entry.id);
                  return (
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
                      onClick={() => handleEdit(originalIndex)}
                    >
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{entry.name || t("vault_screen.unnamed")}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{entry.username}</div>
                      </div>
                    </div>
                  );
                })}
                {!collapsedFolders[folderName] && folderEntries.length === 0 && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: "0.5rem", fontStyle: "italic" }}>
                    {t("vault_screen.empty_folder") || "Carpeta vacía"}
                  </div>
                )}
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
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("vault_screen.folder")}</label>
            <select
              value={form.folder || "Sin carpeta"}
              onChange={(e) => setForm({ ...form, folder: e.target.value })}
              style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", color: "var(--text-primary)" }}
            >
              <option value="Sin carpeta">{t("vault_screen.no_folder")}</option>
              {uniqueFolders.filter(f => f !== "Sin carpeta").map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
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

      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>{t("vault_screen.add_folder") || "Añadir Carpeta"}</h3>
            <form onSubmit={confirmAddFolder} style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  {t("vault_screen.add_folder_prompt") || "Nombre de la nueva carpeta:"}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-panel)", color: "var(--text-primary)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" style={{ flex: 1 }}>{t("vault_screen.apply") || "Crear"}</button>
                <button type="button" className="secondary" onClick={() => setShowFolderModal(false)}>{t("vault_screen.cancel") || "Cancelar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {folderToDelete && (
        <div className="modal-overlay" onClick={() => setFolderToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", color: "var(--danger-color)" }}>{t("vault_screen.delete_folder")}</h3>
            <p style={{ marginBottom: "1.5rem" }}>
              {t("vault_screen.confirm_delete_folder", { folder: folderToDelete })}
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button 
                type="button" 
                className="danger" 
                onClick={confirmDeleteFolder} 
                style={{ flex: 1 }}
              >
                {t("vault_screen.delete") || "Eliminar"}
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => setFolderToDelete(null)}
              >
                {t("vault_screen.cancel") || "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
