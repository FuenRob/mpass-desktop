import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";

const APP_VERSION = "0.3.2";
const ISSUES_URL = "https://github.com/FuenRob/mpass-desktop/issues";

interface LegalModalProps {
  onClose: () => void;
}

export default function LegalModal({ onClose }: LegalModalProps) {
  const { t } = useTranslation();

  const handleOpenIssues = async (e: React.MouseEvent) => {
    e.preventDefault();
    await openUrl(ISSUES_URL);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0" }}>{t("legal.title")}</h3>
          <button onClick={onClose} className="secondary" style={{ padding: "0.2rem 0.6rem", fontSize: "1.2rem", background: "transparent", border: "none" }}>✖</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>MPass Desktop</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{t("legal.version", { version: APP_VERSION })}</div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <div style={{ fontSize: "0.95rem" }}>{t("legal.developer")}</div>
            <div style={{ fontWeight: "500" }}>Roberto Morais</div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {t("legal.copyright", { year: new Date().getFullYear() })}
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <div style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}>{t("legal.bug_report_label")}</div>
            <a
              href={ISSUES_URL}
              onClick={handleOpenIssues}
              style={{ color: "var(--accent-color)", fontSize: "0.9rem", wordBreak: "break-all" }}
            >
              {ISSUES_URL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
