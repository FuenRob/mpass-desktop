# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-24

### Added
- Release GitHub Action workflow to generate installers for all OS.
- Minimum window size enforced.
- Confirmation step for master password during creation.
- Vitest configuration for comprehensive component testing.
- Password strength level indicator keys.
- About Us and Legal pages.
- Core vault management with Tauri commands, data models, and React UI components.
- Navbar with links to settings and a more professional style.
- Settings view and internationalization (i18n) support for English and Spanish.
- Collapsible folders functionality in the sidebar.
- Functionality to delete folders.
- Password generator in the start view.
- URL field validation.

### Changed
- App name changed from `mpass-desktop` to `mpass`.
- Updated background inputs in the white theme.
- Centered the application name in the UI.
- Pinned Argon2id KDF parameters explicitly for cryptography.

### Security
- Added secure automatic clipboard clearing timeout (30 seconds) using Tokio.
- Implemented zeroizing of sensitive data in memory upon dropping to prevent leakage.

### Refactored
- Optimized core functions and frontend across the entire codebase.

### Fixed
- Replaced deprecated Node.js 20 actions in CI.
- Confirmation dialog for deleting passwords.
- Converted identifiers to snake_case format.
