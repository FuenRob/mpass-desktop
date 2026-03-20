use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

pub fn default_folder() -> String {
    "Sin carpeta".to_string()
}

// ZeroizeOnDrop ensures every field is overwritten with zeros when the struct
// is dropped — this guarantees plaintext passwords are erased from memory
// when entries go out of scope (e.g. when the vault is locked).
#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
pub struct PasswordEntry {
    pub id: String,
    pub name: String,
    pub url: String,
    pub username: String,
    pub password: String,
    pub notes: String,
    #[serde(default = "default_folder")]
    pub folder: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
pub struct VaultData {
    pub folders: Vec<String>,
    pub entries: Vec<PasswordEntry>,
}
