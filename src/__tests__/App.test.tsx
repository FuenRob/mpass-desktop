import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: "en" },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("../components/StartScreen", () => ({
  default: (props: { onUnlock: (a: string, b: string, c: object) => void }) => (
    <button
      onClick={() =>
        props.onUnlock("/test.txt", "pass", { folders: [], entries: [] })
      }
    >
      mock-start
    </button>
  ),
}));

vi.mock("../components/VaultScreen", () => ({
  default: (props: { onLock: () => void }) => (
    <div>
      <span>mock-vault</span>
      <button onClick={props.onLock}>mock-lock</button>
    </div>
  ),
}));

vi.mock("../components/SettingsModal", () => ({
  default: (props: { onClose: () => void }) => (
    <div data-testid="settings-modal">
      <button onClick={props.onClose}>close-settings</button>
    </div>
  ),
}));

vi.mock("../components/LegalModal", () => ({
  default: (props: { onClose: () => void }) => (
    <div data-testid="legal-modal">
      <button onClick={props.onClose}>close-legal</button>
    </div>
  ),
}));

describe("App", () => {
  it("shows StartScreen when locked", () => {
    render(<App />);
    expect(screen.getByText("mock-start")).toBeInTheDocument();
  });

  it("transitions to VaultScreen after unlock", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("mock-start"));
    expect(screen.getByText("mock-vault")).toBeInTheDocument();
  });

  it("returns to StartScreen after lock", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("mock-start"));
    await user.click(screen.getByText("mock-lock"));
    expect(screen.getByText("mock-start")).toBeInTheDocument();
  });

  it("opens and closes SettingsModal", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("settings.title"));
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    await user.click(screen.getByText("close-settings"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("opens and closes LegalModal", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("legal.title"));
    expect(screen.getByTestId("legal-modal")).toBeInTheDocument();
    await user.click(screen.getByText("close-legal"));
    expect(screen.queryByTestId("legal-modal")).not.toBeInTheDocument();
  });
});
