# ONE Voice

Voice-to-text transcription for VS Code, powered by OpenAI Whisper.

Press a key, speak, press again -- your words appear at the cursor. Same Whisper model that powers ChatGPT voice input.

## Requirements

- **sox** audio tool: `sudo apt install sox` (Linux) or `brew install sox` (macOS)
- **OpenAI API key** with Whisper access

## Setup

1. Install sox (see above)
2. Set your OpenAI API key:
   - VS Code Settings: `one-voice.apiKey`
   - Or environment variable: `OPENAI_API_KEY`

## Usage

1. Open any text file
2. Press **Pause/Break** to start recording
3. Speak
4. Press **Pause/Break** to stop and transcribe
5. Text appears at your cursor

The keybinding is fully customizable via VS Code Keyboard Shortcuts.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `one-voice.apiKey` | `""` | OpenAI API key |
| `one-voice.model` | `whisper-1` | Transcription model (`whisper-1` or `gpt-4o-transcribe`) |
| `one-voice.language` | `en` | Language code ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)) |
| `one-voice.maxDuration` | `300` | Max recording duration in seconds |
| `one-voice.soxPath` | `sox` | Path to sox binary |

## Status Bar

The status bar shows the current state:
- **$(mic) ONE Voice** -- idle, ready to record
- **$(record) Recording...** -- recording in progress
- **$(sync~spin) Transcribing...** -- sending audio to Whisper API

Click the status bar item or press Pause/Break to toggle recording.

## License

MIT

---

**ONE Voice** is part of the [ONE Ecosystem](https://expl.one) // powered by [EXPL Nodes](https://node.expl.one)
