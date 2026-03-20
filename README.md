# MPass

MPass is a modern, secure, and cross-platform desktop password manager application built with a focus on local privacy and zero-data persistence. 

It locally encrypts all your passwords using robust cryptographic standards, ensuring your sensitive data is never written to disk in plain text.

## Features

- **Local Storage Only**: Your vault is saved exclusively on your local machine as an encrypted `.txt` file.
- **High Security Ciphers**: Master password key derivation uses **Argon2** and the vault is encrypted with **AES-256-GCM**.
- **Zero-Persistence**: Decrypted passwords live exclusively in your RAM. `[Salt]:[Nonce]:[Encrypted Data]` is the only format written to memory.
- **Auto-Lock Security**: Automatic vault locking mechanism that purges RAM data after 60 seconds of inactivity.
- **Clipboard Protection**: Automatically clears copied passwords and usernames from the system clipboard after 30 seconds to prevent unauthorized access.
- **Built-in Generator**: Create strong, random passwords specifying length, numbers, and symbols directly in the app.
- **Modern UI & UX**:
  - Glassmorphism design with a fast, reactive interface.
  - Theme selection (Light, Dark, and System preference).
  - Collapsible folder organization for better vault management.
  - Password visibility toggles.
- **Internationalization (i18n)**: Fully localized in English and Spanish.

## Technology Stack

* **Backend**: Rust (via Tauri) handles OS file structures, cryptographic algorithms (`aes-gcm`, `argon2`), and state management.
* **Frontend**: React 19, TypeScript, and Vite handle a fast, reactive UI layer, using `i18next` for localization.
* **Framework**: Tauri v2 binding the backend with the frontend in a lightweight WebView.

## Requirements

To run this project locally, you must have the following developer tools installed on your machine:
- [Node.js](https://nodejs.org/) (v16+) and `npm`
- [Rust](https://www.rust-lang.org/tools/install) (`cargo`)
- Tauri OS-specific prerequisites (e.g., MSVC C++ Build Tools on Windows). See the [Tauri Prerequisites Documentation](https://tauri.app/v1/guides/getting-started/prerequisites).

## Getting Started

### 1. Install Dependencies
Navigate to the root directory and install the Node frontend modules:
```bash
npm install
```

### 2. Run in Development Mode
To start the Vite development server and the Tauri Rust backend simultaneously, run:
```bash
npm run tauri dev
```
*(Note: The first compilation of the Rust backend might take a couple of minutes while it downloads the required crates).*

### 3. Build for Production
To generate a compiled installer/executable for your operating system:
```bash
npm run tauri build
```
Once completed, the production bundles will be located in the `src-tauri/target/release/bundle` directory.

## Contributing

When making changes to the Rust backend (`src-tauri/src/`), run unit tests to ensure cryptographic functionalities are intact:
```bash
cd src-tauri
cargo test
```
