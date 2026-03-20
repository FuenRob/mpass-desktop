import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import StartScreen from "../components/StartScreen";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: "en" },
  }),
}));

describe("StartScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows create and open buttons in idle state", () => {
    render(<StartScreen onUnlock={vi.fn()} />);
    expect(screen.getByText("start_screen.create_new")).toBeInTheDocument();
    expect(screen.getByText("start_screen.open_vault")).toBeInTheDocument();
  });

  it("shows password form after selecting a create path", async () => {
    vi.mocked(save).mockResolvedValue("/vault.txt");
    const user = userEvent.setup();

    render(<StartScreen onUnlock={vi.fn()} />);
    await user.click(screen.getByText("start_screen.create_new"));

    const input = await screen.findByPlaceholderText(
      "start_screen.master_password"
    );
    expect(input).toBeInTheDocument();
  });

  it("shows error when submitting without a password", async () => {
    vi.mocked(save).mockResolvedValue("/vault.txt");
    const user = userEvent.setup();

    render(<StartScreen onUnlock={vi.fn()} />);
    await user.click(screen.getByText("start_screen.create_new"));
    await screen.findByPlaceholderText("start_screen.master_password");

    await user.click(
      screen.getByRole("button", { name: "start_screen.create_new" })
    );

    expect(
      screen.getByText("start_screen.error_required")
    ).toBeInTheDocument();
  });

  it("calls onUnlock after successful vault creation", async () => {
    vi.mocked(save).mockResolvedValue("/vault.txt");
    vi.mocked(invoke).mockResolvedValue(undefined);
    const onUnlock = vi.fn();
    const user = userEvent.setup();

    render(<StartScreen onUnlock={onUnlock} />);
    await user.click(screen.getByText("start_screen.create_new"));
    await screen.findByPlaceholderText("start_screen.master_password");

    await user.type(
      screen.getByPlaceholderText("start_screen.master_password"),
      "MyPass123!"
    );
    await user.type(
      screen.getByPlaceholderText("start_screen.confirm_master_password"),
      "MyPass123!"
    );
    await user.click(
      screen.getByRole("button", { name: "start_screen.create_new" })
    );

    await vi.waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith("/vault.txt", "MyPass123!", {
        folders: [],
        entries: [],
      });
    });
  });

  it("shows error when passwords do not match", async () => {
    vi.mocked(save).mockResolvedValue("/vault.txt");
    const user = userEvent.setup();

    render(<StartScreen onUnlock={vi.fn()} />);
    await user.click(screen.getByText("start_screen.create_new"));
    await screen.findByPlaceholderText("start_screen.master_password");

    await user.type(
      screen.getByPlaceholderText("start_screen.master_password"),
      "MyPass123!"
    );
    await user.type(
      screen.getByPlaceholderText("start_screen.confirm_master_password"),
      "DifferentPass!"
    );
    await user.click(
      screen.getByRole("button", { name: "start_screen.create_new" })
    );

    expect(
      screen.getByText("start_screen.error_passwords_mismatch")
    ).toBeInTheDocument();
  });

  it("shows error on wrong password when opening vault", async () => {
    vi.mocked(open).mockResolvedValue("/vault.txt");
    vi.mocked(invoke).mockRejectedValue("Wrong password or corrupted data!");
    const user = userEvent.setup();

    render(<StartScreen onUnlock={vi.fn()} />);
    await user.click(screen.getByText("start_screen.open_vault"));
    await screen.findByPlaceholderText("start_screen.master_password");

    await user.type(
      screen.getByPlaceholderText("start_screen.master_password"),
      "wrongpass"
    );
    await user.click(
      screen.getByRole("button", { name: "start_screen.open_vault" })
    );

    await screen.findByText("start_screen.error_wrong_password");
  });

  it("cancels form and returns to idle state", async () => {
    vi.mocked(save).mockResolvedValue("/vault.txt");
    const user = userEvent.setup();

    render(<StartScreen onUnlock={vi.fn()} />);
    await user.click(screen.getByText("start_screen.create_new"));
    await screen.findByPlaceholderText("start_screen.master_password");

    await user.click(screen.getByText("start_screen.cancel"));

    expect(screen.getByText("start_screen.create_new")).toBeInTheDocument();
    expect(screen.getByText("start_screen.open_vault")).toBeInTheDocument();
  });
});
