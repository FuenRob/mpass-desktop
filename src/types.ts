export type VaultData = {
  folders: string[];
  entries: PasswordEntry[];
};

export type PasswordEntry = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  folder: string;
};

export type ThemeMode = "light" | "dark" | "system";
