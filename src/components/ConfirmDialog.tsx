import { useTranslation } from "react-i18next";
import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal onClose={onCancel}>
      <h3 className={variant === "danger" ? "confirm-dialog-title-danger" : ""} style={{ marginBottom: "1rem" }}>
        {title}
      </h3>
      <p style={{ marginBottom: "1.5rem" }}>{message}</p>
      <div className="form-actions">
        <button
          type="button"
          className={variant === "danger" ? "danger" : ""}
          onClick={onConfirm}
          style={{ flex: 1 }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {cancelLabel || t("vault_screen.cancel")}
        </button>
      </div>
    </Modal>
  );
}
