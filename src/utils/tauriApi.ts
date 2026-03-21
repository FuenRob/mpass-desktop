import { invoke } from "@tauri-apps/api/core";
import { VaultData } from "../types";

export function createDatabase(path: string, masterPassword: string): Promise<void> {
  return invoke("create_database", { path, masterPassword });
}

export function openDatabase(path: string, masterPassword: string): Promise<VaultData> {
  return invoke("open_database", { path, masterPassword });
}

export function saveDatabase(path: string, vaultData: VaultData): Promise<void> {
  return invoke("save_database", { path, vaultData });
}

export function lockVault(): Promise<void> {
  return invoke("lock_vault");
}

export function copyToClipboard(text: string): Promise<void> {
  return invoke("copy_to_clipboard_with_timeout", { text });
}
