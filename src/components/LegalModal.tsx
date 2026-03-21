import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getVersion } from "@tauri-apps/api/app";
import Modal from "./Modal";

const ISSUES_URL = "https://github.com/FuenRob/mpass-desktop/issues";

interface LegalModalProps {
  onClose: () => void;
}

export default function LegalModal({ onClose }: LegalModalProps) {
  const { t } = useTranslation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const handleOpenIssues = async (e: React.MouseEvent) => {
    e.preventDefault();
    await openUrl(ISSUES_URL);
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3 style={{ margin: "0" }}>{t("legal.title")}</h3>
        <button onClick={onClose} className="secondary icon-btn close-btn">✖</button>
      </div>

      <div className="legal-content">
        <div>
          <div className="legal-app-name">MPass</div>
          <div className="legal-version">{t("legal.version", { version })}</div>
        </div>

        <div className="legal-section">
          <div className="legal-label">{t("legal.developer")}</div>
          <div className="legal-value">Roberto Morais</div>
        </div>

        <div className="legal-section legal-copyright">
          {t("legal.copyright", { year: new Date().getFullYear() })}
        </div>

        <div className="legal-section">
          <div className="legal-label">{t("legal.bug_report_label")}</div>
          <a href={ISSUES_URL} onClick={handleOpenIssues} className="legal-link">
            {ISSUES_URL}
          </a>
        </div>
      </div>
    </Modal>
  );
}
