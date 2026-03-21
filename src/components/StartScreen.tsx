import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { VaultData } from "../types";
import { createDatabase, openDatabase } from "../utils/tauriApi";
import PasswordStrengthBar from "./PasswordStrengthBar";
import PasswordGeneratorModal from "./PasswordGeneratorModal";

interface StartScreenProps {
  onUnlock: (path: string, data: VaultData) => void;
}

type ActionState = { type: "idle" } | { type: "create"; path: string } | { type: "open"; path: string };

export default function StartScreen({ onUnlock }: StartScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ActionState>({ type: "idle" });
  const { t } = useTranslation();
  const [showGenerator, setShowGenerator] = useState(false);

  const [recents, setRecents] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("recent_dbs") || "[]")
  );

  const saveRecent = (path: string) => {
    const updated = [path, ...recents.filter((p) => p !== path)].slice(0, 5);
    localStorage.setItem("recent_dbs", JSON.stringify(updated));
    setRecents(updated);
  };

  const handleCreateClick = async () => {
    setError("");
    try {
      const selectedPath = await save({
        filters: [{ name: "Text Database", extensions: ["txt"] }],
      });
      if (selectedPath) {
        setAction({ type: "create", path: selectedPath });
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
        filters: [{ name: "Text Database", extensions: ["txt"] }],
      });
      if (selectedPath && typeof selectedPath === "string") {
        setAction({ type: "open", path: selectedPath });
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
    if (action.type === "create" && password !== confirmPassword) {
      setError(t("start_screen.error_passwords_mismatch"));
      return;
    }

    if (action.type === "create") {
      try {
        setLoading(true);
        await createDatabase(action.path, password);
        saveRecent(action.path);
        onUnlock(action.path, { folders: [], entries: [] });
      } catch (err) {
        if (err === "Wrong password or corrupted data!") {
          setError(t("start_screen.error_wrong_password"));
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    } else if (action.type === "open") {
      try {
        setLoading(true);
        const data = await openDatabase(action.path, password);
        saveRecent(action.path);
        onUnlock(action.path, data);
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
    setAction({ type: "idle" });
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="glass-panel start-screen">
      <div className="start-screen-header">
        <h1 style={{ margin: 0 }}>{t("start_screen.title")}</h1>
      </div>

      {action.type === "idle" ? (
        <>
          <p className="start-screen-subtitle">{t("start_screen.subtitle")}</p>

          {error && <div className="error-text" style={{ marginBottom: "1rem" }}>{error}</div>}

          <div className="start-screen-actions">
            <button onClick={handleCreateClick} disabled={loading}>{t("start_screen.create_new")}</button>
            <button onClick={handleImportClick} className="secondary" disabled={loading}>{t("start_screen.open_vault")}</button>
          </div>

          {recents.length > 0 && (
            <div className="recent-vaults">
              <h4 className="recent-vaults-title">{t("start_screen.recent_vaults")}</h4>
              <div className="recent-vaults-list">
                {recents.map((path) => (
                  <button
                    key={path}
                    className="secondary recent-vault-btn"
                    onClick={() => {
                      setError("");
                      setAction({ type: "open", path });
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
        <form onSubmit={executeAction} className="form-column">
          <p className="start-screen-subtitle" style={{ marginBottom: "1rem" }}>
            {action.type === "create" ? t("start_screen.create_prompt") : t("start_screen.open_prompt")}
            <br />
            <span className="start-screen-path">{action.path}</span>
          </p>

          <div className="form-row">
            <input
              type="password"
              placeholder={t("start_screen.master_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {action.type === "create" && (
              <button
                type="button"
                onClick={() => setShowGenerator(true)}
                title={t("vault_screen.generate_password")}
                className="icon-btn generate-btn"
              >
                🔑
              </button>
            )}
          </div>

          {action.type === "create" && <PasswordStrengthBar password={password} />}

          {action.type === "create" && (
            <input
              type="password"
              placeholder={t("start_screen.confirm_master_password")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          )}

          {error && <div className="error-text">{error}</div>}

          <div className="start-screen-actions" style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={loading}>
              {action.type === "create" ? t("start_screen.create_new") : t("start_screen.open_vault")}
            </button>
            <button type="button" onClick={cancelAction} className="secondary" disabled={loading}>
              {t("start_screen.cancel")}
            </button>
          </div>
        </form>
      )}

      {showGenerator && (
        <PasswordGeneratorModal
          onApply={(pw) => {
            setPassword(pw);
            setConfirmPassword(pw);
            setShowGenerator(false);
          }}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}
