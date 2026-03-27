# Changelog

## [0.2.0] - 2026-03-27

### Added
- Clipboard output mode — transcribed text copied to clipboard for pasting anywhere
- Terminal output mode — transcribed text typed directly into active terminal
- Grammar cleanup enabled by default with improved prompt
- Configurable grammar model (`one-voice.grammarModel`) — default gpt-4o-mini
- Configurable grammar prompt (`one-voice.grammarPrompt`) — fully customizable
- Recording timer in status bar showing elapsed time
- Max duration warning with link to settings
- Default Whisper prompt with common tech brand names
- Secondary keybinding Ctrl+Shift+R

### Changed
- Default grammar cleanup is now enabled (was disabled)
- Status bar moved to left side for better visibility
- Idle state shows green text for recognizability
- Branding: "ONE voice" consistent naming

## [0.1.0] - 2026-03-27

### Added
- Initial release
- Toggle recording with Pause/Break key
- OpenAI Whisper API transcription (whisper-1, gpt-4o-transcribe)
- Status bar indicator (idle, recording, transcribing)
- API key from VS Code settings or OPENAI_API_KEY environment variable
