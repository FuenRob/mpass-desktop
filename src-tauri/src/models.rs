use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

pub fn default_folder() -> String {
    "Sin carpeta".to_string()
}

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
