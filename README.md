# 🛡️ MPass

**MPass** is a modern, ultra-secure, local-first password manager. Built with **Tauri v2**, **React 19**, and **Rust**, it prioritizes your privacy through a zero-knowledge architecture.

[![Framework: Tauri](https://img.shields.io/badge/Framework-Tauri%20v2-blue.svg)](https://tauri.app/)
[![Language: Rust](https://img.shields.io/badge/Language-Rust-orange.svg)](https://www.rust-lang.org/)
[![UI: React](https://img.shields.io/badge/UI-React%2019-darkblue.svg)](https://react.dev/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-green.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

## 🚀 Key Features

### 🔒 Security & Privacy
- **Zero-Knowledge Architecture**: Your master password is never stored or transmitted. Encryption and decryption happen entirely locally.
- **Local-Only Storage**: Your vault is saved as an encrypted file on your machine. MPass does not use any cloud services.
- **RAM-Only Decryption**: Sensitive data exists in your RAM only when the vault is unlocked.
- **Auto-Lock**: The vault automatically locks and purges data from memory after 60 seconds of inactivity.
- **Clipboard Protection**: Copied credentials are automatically cleared from the system clipboard after 30 seconds.

### 🛠️ Functionality
- **Password Generator**: Create cryptographically secure, random passwords with customizable length and character sets.
- **Password Strength Indicator**: Real-time feedback on the strength of your stored passwords.
- **Organizational Folders**: Keep your vault tidy with collapsible folders.
- **Search & Filter**: Quickly find your credentials.
- **Multilingual Support**: Fully localized in **English** and **Spanish** using `i18next`.

### 🎨 Modern UX/UI
- **Glassmorphism Design**: A sleek, fast, and responsive interface.
- **Theme Selection**: Seamlessly switch between Light, Dark, and System modes.
- **Visibility Toggle**: Hide/reveal passwords with a single click.

## 🛡️ Security Deep Dive

MPass implements industry-leading cryptographic standards:

1.  **Key Derivation**: Uses **Argon2** (via the `argon2` crate) to derive encryption keys from your master password and a unique salt. This provides high resistance against GPU-based brute-force attacks.
2.  **Encryption Pipeline**:
    - The vault is stored as: `[Salt]:[Nonce]:[EncryptedData]` (Base64 encoded).
    - **AES-256-GCM** (authenticated encryption) ensures both confidentiality and integrity of your data.
3.  **Randomness**: All cryptographic primitives (salts, nonces, passwords) are generated using **OsRng** (OS-level entropy) in Rust and `window.crypto` in the frontend.

## 💻 Technology Stack

- **Backend**: [Rust](https://www.rust-lang.org/) (High performance, memory safety).
- **Frontend**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/).
- **Framework**: [Tauri v2](https://tauri.app/) (Lightweight alternative to Electron).
- **Styling**: Vanilla CSS with modern variables for theme management.
- **Localization**: [i18next](https://www.i18next.com/).

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/FuenRob/mpass-desktop.git
    cd mpass-desktop
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development
Start the development environment:
```bash
npm run tauri dev
```

### Production Build
Generate an optimized installer for your OS:
```bash
npm run tauri build
```

## 🧪 Testing

Maintain project stability with comprehensive tests:

- **Backend (Rust)**:
  ```bash
  cd src-tauri && cargo test
  ```
- **Frontend (React)**:
  ```bash
  npm test
  ```
