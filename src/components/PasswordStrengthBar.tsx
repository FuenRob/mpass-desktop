import { useTranslation } from "react-i18next";
import { getPasswordStrength } from "../utils/passwordUtils";

interface PasswordStrengthBarProps {
  password: string;
}

const STRENGTH_COLORS = ["#e11d48", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { t } = useTranslation();

  if (!password) return null;

  const { score, labelKey } = getPasswordStrength(password);
  const color = STRENGTH_COLORS[Math.min(score, 4)];

  return (
    <div className="strength-bar">
      <div className="strength-bar-segments">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="strength-segment"
            style={{
              background: i <= score ? color : "var(--border-color)",
            }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color }}>{t(labelKey)}</span>
    </div>
  );
}
