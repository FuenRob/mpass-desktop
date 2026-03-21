import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PasswordEntry } from "../types";

const NO_FOLDER = "";

const getFolderKey = (folder: string | undefined): string =>
  !folder || folder === "Sin carpeta" ? NO_FOLDER : folder;

interface EntryListProps {
  entries: PasswordEntry[];
  folders: string[];
  search: string;
  onSearchChange: (value: string) => void;
  collapsedFolders: Record<string, boolean>;
  onToggleFolder: (folderName: string) => void;
  onEditEntry: (index: number) => void;
  onDeleteFolder: (folderName: string) => void;
  onAddFolder: () => void;
  onLock: () => void;
  saveError: string | null;
}

export default function EntryList({
  entries,
  folders,
  search,
  onSearchChange,
  collapsedFolders,
  onToggleFolder,
  onEditEntry,
  onDeleteFolder,
  onAddFolder,
  onLock,
  saveError,
}: EntryListProps) {
  const { t } = useTranslation();

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.url.toLowerCase().includes(search.toLowerCase()) ||
          e.username.toLowerCase().includes(search.toLowerCase())
      ),
    [entries, search]
  );

  const uniqueFolders = useMemo(() => {
    const set = new Set([NO_FOLDER, ...folders, ...entries.map((e) => getFolderKey(e.folder))]);
    return Array.from(set).sort();
  }, [entries, folders]);

  const finalGroupedEntries = useMemo(() => {
    const grouped = uniqueFolders.reduce(
      (acc, fn) => {
        acc[fn] = [];
        return acc;
      },
      {} as Record<string, PasswordEntry[]>
    );

    filteredEntries.forEach((entry) => {
      const fn = getFolderKey(entry.folder);
      if (grouped[fn]) {
        grouped[fn].push(entry);
      } else {
        grouped[fn] = [entry];
      }
    });

    return Object.entries(grouped)
      .filter(([, list]) => {
        if (search.trim() !== "") return list.length > 0;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [uniqueFolders, filteredEntries, search]);

  return (
    <div className="glass-panel vault-sidebar">
      <div className="vault-sidebar-header">
        <div className="vault-sidebar-title">
          <h2 style={{ margin: 0 }}>{t("vault_screen.title")}</h2>
          <button onClick={onAddFolder} title={t("vault_screen.add_folder")} className="icon-btn add-folder-btn">
            +
          </button>
        </div>
        <button onClick={onLock} className="danger lock-btn">
          {t("vault_screen.lock_vault")}
        </button>
      </div>

      {saveError && <div className="save-error">{saveError}</div>}

      <input
        type="text"
        placeholder={t("vault_screen.search")}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />

      <div className="entry-list-scroll">
        {finalGroupedEntries.map(([folderName, folderEntries]) => (
          <div key={folderName} style={{ marginBottom: "1rem" }}>
            <div className="folder-header" onClick={() => onToggleFolder(folderName)}>
              <span className="folder-header-label">
                {collapsedFolders[folderName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                {folderName === NO_FOLDER || folderName === "Sin carpeta"
                  ? t("vault_screen.no_folder")
                  : folderName}
              </span>
              {folderName !== NO_FOLDER && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folderName);
                  }}
                  title={t("vault_screen.delete_folder")}
                  className="icon-btn folder-delete-btn"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="folder-entries">
              {!collapsedFolders[folderName] &&
                folderEntries.map((entry) => {
                  const originalIndex = entries.findIndex((e) => e.id === entry.id);
                  return (
                    <div key={entry.id} className="entry-card" onClick={() => onEditEntry(originalIndex)}>
                      <div style={{ textAlign: "left" }}>
                        <div className="entry-card-name">{entry.name || t("vault_screen.unnamed")}</div>
                        <div className="entry-card-username">{entry.username}</div>
                      </div>
                    </div>
                  );
                })}
              {!collapsedFolders[folderName] && folderEntries.length === 0 && (
                <div className="empty-folder-msg">{t("vault_screen.empty_folder")}</div>
              )}
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="no-entries-msg">{t("vault_screen.no_entries")}</div>
        )}
      </div>
    </div>
  );
}
