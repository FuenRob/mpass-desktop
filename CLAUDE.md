# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MPass is a local-first password manager built with **Tauri v2** (React + TypeScript frontend, Rust backend). It uses a zero-knowledge architecture — the master password is never stored; all encryption/decryption is done locally.

## Commands

### Development
```bash
npm install            # Install frontend dependencies
npm run tauri dev      # Start full dev server (Vite on :1420 + Tauri hot reload)
npm run dev            # Frontend only (Vite)
```

### Build
```bash
npm run build          # Compile TypeScript + bundle frontend
npm run tauri build    # Produce OS-specific production binary/installer
```

### Tests
```bash
npm test                   # Frontend tests (Vitest + jsdom)
cd src-tauri && cargo test # Rust backend tests
```

## Architecture

### Data Flow
1. User unlocks vault with master password → Rust backend derives key via Argon2, decrypts file with AES-256-GCM
2. Decrypted `VaultData` is held in `AppState` (Mutex-protected Tauri State)
3. Frontend communicates via Tauri IPC commands (`invoke`) to CRUD entries
4. On lock or 60s inactivity, vault is cleared from memory

### Vault File Format
Base64-encoded: `salt:nonce:encrypted_data` (3 colon-separated fields)

### Key Modules

**Rust (`src-tauri/src/`):**
- `crypto.rs` — AES-256-GCM encryption, Argon2 key derivation, salt/nonce generation
- `commands.rs` — Tauri IPC handlers: `create_database`, `open_database`, `save_database`, `lock_vault`
- `models.rs` — Core types: `VaultData` (folders + entries), `PasswordEntry`
- `lib.rs` — Tauri app setup, state registration, command registration

**Frontend (`src/`):**
- `App.tsx` — Root state: vault locked/unlocked, theme; routes between `StartScreen` and `VaultScreen`
- `components/StartScreen.tsx` — Create/open vault UI
- `components/VaultScreen.tsx` — Entry management, folder management, password generator
- `hooks/useAutoLock.ts` — 60-second inactivity auto-lock
- `i18n.ts` + `locales/en.json`, `locales/es.json` — i18next configuration

## Critical Rules

### Security
- **Never log** passwords, keys, salts, or decrypted vault contents
- **Never change** encryption primitives (AES-256-GCM, Argon2) without explicit approval
- **Always use** cryptographically secure RNG: `OsRng` in Rust, `window.crypto.getRandomValues` in frontend
- **Do not break** the encrypted file format — if format changes, provide a migration path

### Frontend
- All user-facing strings **must** use i18next (`useTranslation()`) — add keys to both `en.json` and `es.json`
- No `any` types — TypeScript interfaces must match Rust structs exactly
- Styling via CSS variables in `App.css`; avoid inline styles

### Backend
- All Tauri IPC endpoints go in `commands.rs`; delegate crypto logic to `crypto.rs`
- Never `unwrap()` on user input or file I/O — return `Result<T, String>`
- New Rust unit tests go in `#[cfg(test)]` blocks; tests must clean up temp files

### Frontend
- Tests use **Vitest** + **jsdom** + `@testing-library/react`; test files go in `src/__tests__/`
- Run with `npm test` (`vitest run`)
