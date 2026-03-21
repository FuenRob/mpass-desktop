import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { generatePassword } from "../utils/passwordUtils";
import { copyToClipboard } from "../utils/tauriApi";

interface PasswordGeneratorModalProps {
  onApply: (password: string) => void;
  onClose: () => void;
}

export default function PasswordGeneratorModal({ onApply, onClose }: PasswordGeneratorModalProps) {
  const { t } = useTranslation();
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [previewPassword, setPreviewPassword] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const regenerate = useCallback(() => {
    setPreviewPassword(generatePassword(genLength, genNumbers, genSymbols));
  }, [genLength, genNumbers, genSymbols]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const copyWithClear = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: "0" }}>{t("vault_screen.generate_password")}</h3>

      <div className="form-column">
        <div>
          <label className="form-label-flex">
            <span>{t("vault_screen.length", { val: genLength })}</span>
          </label>
          <input
            type="range"
            min="8"
            max="64"
            value={genLength}
            onChange={(e) => setGenLength(Number(e.target.value))}
            style={{ padding: "0" }}
          />
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={genNumbers}
            onChange={(e) => setGenNumbers(e.target.checked)}
            style={{ width: "auto" }}
          />
          {t("vault_screen.include_numbers")}
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={genSymbols}
            onChange={(e) => setGenSymbols(e.target.checked)}
            style={{ width: "auto" }}
          />
          {t("vault_screen.include_symbols")}
        </label>

        <div style={{ marginTop: "0.5rem" }}>
          <label className="preview-label">{t("vault_screen.preview")}</label>
          <div className="form-row">
            <input
              type="text"
              readOnly
              value={previewPassword}
              style={{ flex: 1, fontFamily: "monospace", fontSize: "1.1rem" }}
            />
            <button
              type="button"
              className="secondary icon-btn"
              onClick={() => copyWithClear(previewPassword, "preview")}
              title={t("vault_screen.copy_preview")}
            >
              {copiedField === "preview" ? "\u2714" : "\uD83D\uDCCB"}
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => onApply(previewPassword)} style={{ flex: 1 }}>
          {t("vault_screen.apply")}
        </button>
        <button type="button" className="secondary" onClick={onClose}>
          {t("vault_screen.cancel")}
        </button>
      </div>
    </Modal>
  );
}
