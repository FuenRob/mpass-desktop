import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import VaultScreen from "../components/VaultScreen";
import { PasswordEntry, VaultData } from "../types";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("../hooks/useAutoLock", () => ({ useAutoLock: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: "en" },
  }),
}));

const makeEntry = (overrides: Partial<PasswordEntry> = {}): PasswordEntry => ({
  id: "1",
  name: "GitHub",
  url: "https://github.com",
  username: "user@test.com",
  password: "Pass123!",
  notes: "",
  folder: "",
  ...overrides,
});

const defaultProps = (initialData: VaultData = { folders: [], entries: [] }) => ({
  dbPath: "/vault.txt",
  initialData,
  onLock: vi.fn(),
});

describe("VaultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("renders the vault title", () => {
    render(<VaultScreen {...defaultProps()} />);
    expect(screen.getByText("vault_screen.title")).toBeInTheDocument();
  });

  it("shows no-entries message with empty vault", () => {
    render(<VaultScreen {...defaultProps()} />);
    expect(screen.getByText("vault_screen.no_entries")).toBeInTheDocument();
  });

  it("displays entries from initialData", () => {
    const vault = { folders: [], entries: [makeEntry()] };
    render(<VaultScreen {...defaultProps(vault)} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("shows new-entry editor by default", () => {
    render(<VaultScreen {...defaultProps()} />);
    expect(screen.getByText("vault_screen.new_entry")).toBeInTheDocument();
  });

  it("switches to edit-entry editor after clicking a sidebar entry", async () => {
    const vault = { folders: [], entries: [makeEntry()] };
    const user = userEvent.setup();
    render(<VaultScreen {...defaultProps(vault)} />);

    await user.click(screen.getByText("GitHub"));

    expect(screen.getByText("vault_screen.edit_entry")).toBeInTheDocument();
  });

  it("filters sidebar entries by search term", async () => {
    const vault = {
      folders: [],
      entries: [
        makeEntry({ id: "1", name: "GitHub", username: "user@github.com" }),
        makeEntry({ id: "2", name: "Notion", url: "https://notion.so", username: "user@notion.so" }),
      ],
    };
    const user = userEvent.setup();
    render(<VaultScreen {...defaultProps(vault)} />);

    await user.type(
      screen.getByPlaceholderText("vault_screen.search"),
      "GitHub"
    );

    await vi.waitFor(() => {
      expect(screen.queryByText("Notion")).not.toBeInTheDocument();
    });
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("shows URL validation error for invalid URL", async () => {
    const user = userEvent.setup();
    render(<VaultScreen {...defaultProps()} />);

    await user.type(
      screen.getByPlaceholderText("https://example.com"),
      "not-a-url"
    );

    expect(screen.getByText("vault_screen.url_invalid")).toBeInTheDocument();
  });

  it("shows delete confirmation modal when delete is clicked", async () => {
    const vault = { folders: [], entries: [makeEntry()] };
    const user = userEvent.setup();
    render(<VaultScreen {...defaultProps(vault)} />);

    await user.click(screen.getByText("GitHub"));
    await user.click(screen.getByRole("button", { name: "vault_screen.delete" }));

    expect(
      screen.getByText("vault_screen.confirm_delete")
    ).toBeInTheDocument();
  });

  it("calls save_database with updated vault after confirm delete", async () => {
    const vault = { folders: [], entries: [makeEntry()] };
    const user = userEvent.setup();
    render(<VaultScreen {...defaultProps(vault)} />);

    await user.click(screen.getByText("GitHub"));
    await user.click(screen.getByRole("button", { name: "vault_screen.delete" }));

    await screen.findByText("vault_screen.confirm_delete");
    const deleteBtns = screen.getAllByRole("button", { name: "vault_screen.delete" });
    await user.click(deleteBtns[deleteBtns.length - 1]);

    await vi.waitFor(() => {
      expect(vi.mocked(invoke)).toHaveBeenCalledWith(
        "save_database",
        expect.objectContaining({
          path: "/vault.txt",
          vaultData: expect.objectContaining({ entries: [] }),
        })
      );
    });
  });
});
