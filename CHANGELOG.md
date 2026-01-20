# Change Log

All notable changes to the "postgirl" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 1.2.1 [01-19-2026]

### Fixed
- Fixed saved requests not loading when clicked from sidebar (added timing delay for webview readiness)

## 1.2.0 [01-19-2026]

### Added
- Request cancellation: Cancel button appears during active requests to abort long-running or stuck operations
- Console logging for variable replacement debugging

### Fixed
- Variable replacement now properly escapes special regex characters in variable names (fixes issues with variables containing `.`, `*`, `+`, etc.)
- Improved variable placeholder handling for more robust text replacement

## 1.1.0 [01-02-2026]

### Added
- Session export feature: Export your entire session (saved requests, variables, headers) to a binary `.pgrl` file
- Session import feature: Import previously exported session files with warning confirmation
- Binary file format for efficient storage
- Export/import buttons in the sidebar toolbar

## 1.0.1 [01-02-2026]

### Fixed
- Fixed variable loading functionality that was not working due to malformed switch statement

## 1.0.0 [01-01-2026]

- Initial release