import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PasswordEntry } from "../types";
import { copyToClipboard } from "../utils/tauriApi";
import PasswordStrengthBar from "./PasswordStrengthBar";
import { useState } from "react";

const NO_FOLDER = "";

interface EntryFormProps {
  form: PasswordEntry;
  onFormChange: (form: PasswordEntry) => void;
  editingIndex: number | null;
  folders: string[];
  entries: PasswordEntry[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onShowGenerator: () => void;
}

export default function EntryForm({
  form,
  onFormChange,
  editingIndex,
  folders,
  entries,
  onSubmit,
  onCancel,
  onDelete,
  onShowGenerator,
}: EntryFormProps) {
  const { t } = useTranslation();
  const [urlError, setUrlError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const uniqueFolders = useMemo(() => {
    const set = new Set([NO_FOLDER, ...folders, ...entries.map((e) => (!e.folder || e.folder === "Sin carpeta" ? NO_FOLDER : e.folder))]);
    return Array.from(set).sort();
  }, [entries, folders]);

  const isValidUrl = useCallback((url: string) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  const copyWithClear = useCallback(async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidUrl(form.url)) {
        setUrlError(t("vault_screen.url_invalid"));
        return;
      }
      setUrlError(null);
      onSubmit(e);
    },
    [form.url, isValidUrl, onSubmit, t]
  );

  return (
    <div className="glass-panel vault-main">
      <h2>{editingIndex !== null ? t("vault_screen.edit_entry") : t("vault_screen.new_entry")}</h2>

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label className="form-label">{t("vault_screen.folder")}</label>
          <select
            value={form.folder || NO_FOLDER}
            onChange={(e) => onFormChange({ ...form, folder: e.target.value })}
            className="form-select"
          >
            <option value={NO_FOLDER}>{t("vault_screen.no_folder")}</option>
            {uniqueFolders.filter((f) => f !== NO_FOLDER).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t("vault_screen.name")}</label>
          <input required type="text" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">{t("vault_screen.url")}</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => {
              const val = e.target.value;
              onFormChange({ ...form, url: val });
              setUrlError(val && !isValidUrl(val) ? t("vault_screen.url_invalid") : null);
            }}
            style={urlError ? { borderColor: "var(--danger-color)" } : undefined}
            placeholder="https://example.com"
          />
          {urlError && <span className="error-text">{urlError}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">{t("vault_screen.username")}</label>
          <div className="form-row">
            <input required type="text" value={form.username} onChange={(e) => onFormChange({ ...form, username: e.target.value })} style={{ flex: 1 }} />
            {editingIndex !== null && (
              <button type="button" className="secondary icon-btn" onClick={() => copyWithClear(form.username, "username")} title={t("vault_screen.copy_username")}>
                {copiedField === "username" ? "\u2714" : "\uD83D\uDCCB"}
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t("vault_screen.password")}</label>
          <div className="form-row">
            <input required type="password" value={form.password} onChange={(e) => onFormChange({ ...form, password: e.target.value })} style={{ flex: 1 }} />
            <button type="button" onClick={onShowGenerator} title={t("vault_screen.generate_password")} className="icon-btn generate-btn">
              🔑
            </button>
            {editingIndex !== null && (
              <button type="button" className="secondary icon-btn" onClick={() => copyWithClear(form.password, "password")} title={t("vault_screen.copy_password")}>
                {copiedField === "password" ? "\u2714" : "\uD83D\uDCCB"}
              </button>
            )}
          </div>
          <PasswordStrengthBar password={form.password} />
        </div>

        <div className="form-group">
          <label className="form-label">{t("vault_screen.notes")}</label>
          <textarea
            value={form.notes}
            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            className="form-textarea"
          />
        </div>

        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button type="submit" style={{ flex: 1 }}>{t("vault_screen.save_entry")}</button>
          {editingIndex !== null && (
            <>
              <button type="button" className="secondary" onClick={onCancel}>{t("vault_screen.cancel")}</button>
              <button type="button" className="danger" onClick={() => onDelete(form.id)}>{t("vault_screen.delete")}</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
