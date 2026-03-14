import { useTranslation } from "react-i18next";
import { ThemeMode } from "../App";

interface SettingsModalProps {
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function SettingsModal({ onClose, theme, onThemeChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0" }}>{t("settings.title")}</h3>
          <button onClick={onClose} className="secondary" style={{ padding: "0.2rem 0.6rem", fontSize: "1.2rem", background: "transparent", border: "none" }}>✖</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left", marginBottom: "2rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("settings.language")}</label>
            <select
              value={i18n.resolvedLanguage || i18n.language}
              onChange={handleLanguageChange}
              style={{
                width: "100%", padding: "0.8rem", borderRadius: "8px",
                border: "1px solid var(--border-color)", background: "var(--input-bg)",
                color: "var(--text-primary)", fontSize: "1rem"
              }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("settings.theme")}</label>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
              style={{
                width: "100%", padding: "0.8rem", borderRadius: "8px",
                border: "1px solid var(--border-color)", background: "var(--input-bg)",
                color: "var(--text-primary)", fontSize: "1rem"
              }}
            >
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.dark")}</option>
              <option value="system">{t("settings.system")}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
