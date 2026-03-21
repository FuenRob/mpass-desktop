import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PasswordEntry, VaultData } from "../types";
import { saveDatabase } from "../utils/tauriApi";
import { useAutoLock } from "../hooks/useAutoLock";
import EntryList from "./EntryList";
import EntryForm from "./EntryForm";
import PasswordGeneratorModal from "./PasswordGeneratorModal";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";

const NO_FOLDER = "";

const getFolderKey = (folder: string | undefined): string =>
  !folder || folder === "Sin carpeta" ? NO_FOLDER : folder;

interface VaultScreenProps {
  dbPath: string;
  initialData: VaultData;
  onLock: () => void;
}

export default function VaultScreen({ dbPath, initialData, onLock }: VaultScreenProps) {
  const [vault, setVault] = useState<VaultData>(initialData);
  const entries = vault.entries;
  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const [showGenerator, setShowGenerator] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<PasswordEntry>({
    id: "",
    name: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    folder: NO_FOLDER,
  });

  useAutoLock(60000, onLock);

  const handleSaveData = useCallback(
    async (newVault: VaultData) => {
      try {
        await saveDatabase(dbPath, newVault);
        setVault(newVault);
        setSaveError(null);
      } catch (err) {
        setSaveError(t("vault_screen.save_error", { error: String(err) }));
      }
    },
    [dbPath, t]
  );

  const handleCancel = useCallback(() => {
    setEditingIndex(null);
    setForm({ id: "", name: "", url: "", username: "", password: "", notes: "", folder: NO_FOLDER });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      let updatedEntries = [...entries];

      if (editingIndex !== null) {
        updatedEntries[editingIndex] = form;
      } else {
        updatedEntries.push({ ...form, id: crypto.randomUUID() });
      }

      let updatedFolders = [...vault.folders];
      if (form.folder && form.folder !== NO_FOLDER && !updatedFolders.includes(form.folder)) {
        updatedFolders.push(form.folder);
      }

      handleSaveData({ folders: updatedFolders, entries: updatedEntries });
      handleCancel();
    },
    [entries, editingIndex, form, vault.folders, handleSaveData, handleCancel]
  );

  const handleEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setForm(entries[index]);
    },
    [entries]
  );

  const handleDelete = useCallback((id: string) => {
    setEntryToDelete(id);
  }, []);

  const confirmDeleteEntry = useCallback(() => {
    if (!entryToDelete) return;
    const updatedEntries = entries.filter((e) => e.id !== entryToDelete);
    handleSaveData({ ...vault, entries: updatedEntries });
    if (editingIndex !== null && entries[editingIndex]?.id === entryToDelete) {
      handleCancel();
    }
    setEntryToDelete(null);
  }, [entryToDelete, entries, vault, editingIndex, handleSaveData, handleCancel]);

  const handleDeleteFolder = useCallback((folderName: string) => {
    if (folderName === NO_FOLDER) return;
    setFolderToDelete(folderName);
  }, []);

  const confirmDeleteFolder = useCallback(() => {
    if (!folderToDelete) return;
    const updatedFolders = vault.folders.filter((f) => f !== folderToDelete);
    const updatedEntries = entries.filter((e) => getFolderKey(e.folder) !== folderToDelete);
    handleSaveData({ folders: updatedFolders, entries: updatedEntries });
    if (editingIndex !== null && getFolderKey(entries[editingIndex]?.folder) === folderToDelete) {
      handleCancel();
    }
    setFolderToDelete(null);
  }, [folderToDelete, vault.folders, entries, editingIndex, handleSaveData, handleCancel]);

  const toggleFolder = useCallback((folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  }, []);

  const handleAddFolderClick = useCallback(() => {
    setNewFolderName("");
    setShowFolderModal(true);
  }, []);

  const confirmAddFolder = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newFolderName && newFolderName.trim() !== "") {
        const folderName = newFolderName.trim();
        if (!vault.folders.includes(folderName) && folderName !== NO_FOLDER) {
          handleSaveData({ ...vault, folders: [...vault.folders, folderName] });
        }
      }
      setShowFolderModal(false);
    },
    [newFolderName, vault, handleSaveData]
  );

  const handleApplyPassword = useCallback(
    (password: string) => {
      setForm((prev) => ({ ...prev, password }));
      setShowGenerator(false);
    },
    []
  );

  return (
    <div className="vault-layout">
      <EntryList
        entries={entries}
        folders={vault.folders}
        search={search}
        onSearchChange={setSearch}
        collapsedFolders={collapsedFolders}
        onToggleFolder={toggleFolder}
        onEditEntry={handleEdit}
        onDeleteFolder={handleDeleteFolder}
        onAddFolder={handleAddFolderClick}
        onLock={onLock}
        saveError={saveError}
      />

      <EntryForm
        form={form}
        onFormChange={setForm}
        editingIndex={editingIndex}
        folders={vault.folders}
        entries={entries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onShowGenerator={() => setShowGenerator(true)}
      />

      {showGenerator && (
        <PasswordGeneratorModal onApply={handleApplyPassword} onClose={() => setShowGenerator(false)} />
      )}

      {showFolderModal && (
        <Modal onClose={() => setShowFolderModal(false)}>
          <h3 style={{ marginBottom: "1rem" }}>{t("vault_screen.add_folder")}</h3>
          <form onSubmit={confirmAddFolder} className="form-column" style={{ textAlign: "left" }}>
            <div>
              <label className="form-label">{t("vault_screen.add_folder_prompt")}</label>
              <input
                type="text"
                autoFocus
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button type="submit" style={{ flex: 1 }}>{t("vault_screen.apply")}</button>
              <button type="button" className="secondary" onClick={() => setShowFolderModal(false)}>
                {t("vault_screen.cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {entryToDelete && (
        <ConfirmDialog
          title={t("vault_screen.delete")}
          message={t("vault_screen.confirm_delete")}
          confirmLabel={t("vault_screen.delete")}
          onConfirm={confirmDeleteEntry}
          onCancel={() => setEntryToDelete(null)}
        />
      )}

      {folderToDelete && (
        <ConfirmDialog
          title={t("vault_screen.delete_folder")}
          message={t("vault_screen.confirm_delete_folder", { folder: folderToDelete })}
          confirmLabel={t("vault_screen.delete")}
          onConfirm={confirmDeleteFolder}
          onCancel={() => setFolderToDelete(null)}
        />
      )}
    </div>
  );
}
