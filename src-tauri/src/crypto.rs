use aes_gcm::{
    aead::{rand_core::RngCore, Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::Argon2;
use base64::{engine::general_purpose, Engine as _};
use std::fs;

const SALT_LEN: usize = 32;
const NONCE_LEN: usize = 12;

pub fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    let argon2 = Argon2::default();
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Key derivation failed: {}", e))?;
    Ok(key)
}

pub fn encrypt_and_save(path: &str, password: &str, data: &str) -> Result<(), String> {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let nonce_bytes = Aes256Gcm::generate_nonce(&mut OsRng);

    let key_bytes = derive_key(password, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let encrypted_data = cipher
        .encrypt(&nonce_bytes, data.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    let salt_b64 = general_purpose::STANDARD.encode(salt);
    let nonce_b64 = general_purpose::STANDARD.encode(nonce_bytes);
    let data_b64 = general_purpose::STANDARD.encode(encrypted_data);

    let file_content = format!("{}:{}:{}", salt_b64, nonce_b64, data_b64);
    fs::write(path, file_content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

pub fn decrypt_file(path: &str, password: &str) -> Result<String, String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
    let parts: Vec<&str> = content.split(':').collect();
    if parts.len() != 3 {
        return Err("Invalid file format. Ensure it's a valid MPass database.".to_string());
    }

    let salt = general_purpose::STANDARD
        .decode(parts[0])
        .map_err(|_| "Failed to decode salt".to_string())?;
    let nonce_bytes = general_purpose::STANDARD
        .decode(parts[1])
        .map_err(|_| "Failed to decode nonce".to_string())?;
    if nonce_bytes.len() != NONCE_LEN {
        return Err("Invalid nonce length in file".to_string());
    }
    let encrypted_data = general_purpose::STANDARD
        .decode(parts[2])
        .map_err(|_| "Failed to decode data".to_string())?;

    let nonce = Nonce::from_slice(&nonce_bytes);

    let key_bytes = derive_key(password, &salt)?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let dec_bytes = cipher
        .decrypt(nonce, encrypted_data.as_ref())
        .map_err(|_| "Wrong password or corrupted data!".to_string())?;

    String::from_utf8(dec_bytes).map_err(|_| "Failed to parse decrypted data as UTF-8".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn get_temp_path(filename: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(filename);
        path
    }

    #[test]
    fn test_derive_key_consistency() {
        let password = "super_secret_password";
        let salt = b"this_is_a_32_byte_salt_123456789";

        let key1 = derive_key(password, salt).unwrap();
        let key2 = derive_key(password, salt).unwrap();

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_derive_key_different_passwords() {
        let salt = b"this_is_a_32_byte_salt_123456789";

        let key1 = derive_key("password_1", salt).unwrap();
        let key2 = derive_key("password_2", salt).unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_encrypt_and_decrypt() {
        let path = get_temp_path("test_vault_1.txt");
        let password = "my_strong_password";
        let data = "{\"entries\": []}";

        let enc_res = encrypt_and_save(path.to_str().unwrap(), password, data);
        assert!(enc_res.is_ok());

        let dec_res = decrypt_file(path.to_str().unwrap(), password);
        assert!(dec_res.is_ok());
        assert_eq!(dec_res.unwrap(), data);

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_decrypt_wrong_password() {
        let path = get_temp_path("test_vault_2.txt");
        let password = "correct_password";
        let wrong_password = "wrong_password";
        let data = "Sensitive Data";

        encrypt_and_save(path.to_str().unwrap(), password, data).unwrap();

        let dec_res = decrypt_file(path.to_str().unwrap(), wrong_password);
        assert!(dec_res.is_err());
        assert_eq!(dec_res.unwrap_err(), "Wrong password or corrupted data!");

        let _ = fs::remove_file(path);
    }

    #[test]
    fn test_decrypt_invalid_format() {
        let path = get_temp_path("test_vault_invalid.txt");
        let password = "password";
        fs::write(&path, "invalid_base64_data_without_colons").unwrap();

        let dec_res = decrypt_file(path.to_str().unwrap(), password);
        assert!(dec_res.is_err());
        assert_eq!(
            dec_res.unwrap_err(),
            "Invalid file format. Ensure it's a valid MPass database."
        );

        let _ = fs::remove_file(path);
    }
}
