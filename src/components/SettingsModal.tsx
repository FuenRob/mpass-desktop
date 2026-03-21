import { useTranslation } from "react-i18next";
import { ThemeMode } from "../types";
import Modal from "./Modal";

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
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3 style={{ margin: "0" }}>{t("settings.title")}</h3>
        <button onClick={onClose} className="secondary icon-btn close-btn">✖</button>
      </div>

      <div className="form-column" style={{ marginBottom: "2rem" }}>
        <div className="form-group">
          <label className="form-label">{t("settings.language")}</label>
          <select
            value={i18n.resolvedLanguage || i18n.language}
            onChange={handleLanguageChange}
            className="form-select"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t("settings.theme")}</label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
            className="form-select"
          >
            <option value="light">{t("settings.light")}</option>
            <option value="dark">{t("settings.dark")}</option>
            <option value="system">{t("settings.system")}</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
