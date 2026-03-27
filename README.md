# ONE voice

Voice-to-text for VS Code powered by OpenAI Whisper API with optional GPT grammar cleanup.

Press a key, speak, press again — your words appear at the cursor, in your clipboard, or directly in the terminal. Same Whisper model that powers ChatGPT voice input, with optional grammar post-processing that fixes punctuation, filler words, repeated words, and broken sentences while preserving your original wording.

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
2. Press **Ctrl+Shift+R** (or **Pause/Break**) to start recording
3. Speak
4. Press **Ctrl+Shift+R** (or **Pause/Break**) to stop and transcribe
5. Text appears at your cursor / clipboard / terminal (configurable)

Keybindings are fully customizable via VS Code Keyboard Shortcuts.

## Output Targets

Choose where transcribed text goes (`one-voice.outputTarget`):

- **clipboard** (default) — copies to clipboard, paste anywhere with Ctrl+V
- **editor** — inserts at cursor in the active file
- **terminal** — types into the active terminal (for Claude Code, Copilot, or any CLI)

## Grammar Cleanup

When enabled (`one-voice.grammarCleanup`), transcriptions are post-processed by GPT to:

- Fix grammar, punctuation, and capitalization
- Remove filler words (um, uh, like, you know)
- Remove repeated words and stutters
- Construct complete sentences from fragmented speech
- Correct misheard brand names (e.g., "chachapiti" → "ChatGPT")

The grammar model, prompt, and behavior are fully configurable.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `one-voice.apiKey` | `""` | OpenAI API key |
| `one-voice.model` | `gpt-4o-transcribe` | Whisper model (`gpt-4o-transcribe` or `whisper-1`) |
| `one-voice.language` | `en` | Language code ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)) |
| `one-voice.outputTarget` | `clipboard` | Output destination: `clipboard`, `editor`, or `terminal` |
| `one-voice.grammarCleanup` | `false` | Post-process with GPT for grammar cleanup |
| `one-voice.grammarModel` | `gpt-4o-mini` | GPT model for grammar cleanup |
| `one-voice.grammarPrompt` | *(built-in)* | Custom system prompt for grammar processing |
| `one-voice.maxDuration` | `300` | Max recording duration in seconds |
| `one-voice.soxPath` | `sox` | Path to sox binary |

## Install

**From VS Code Marketplace:**

Search "ONE voice" in the Extensions panel, or install from the [marketplace page](https://marketplace.visualstudio.com/items?itemName=expl-one.one-voice).

**From GitHub (manual):**

```bash
# Download the latest .vsix from GitHub releases
code --install-extension one-voice-x.x.x.vsix
```

## Status Bar

- **$(mic) ONE voice** — idle, ready to record (green text)
- **$(record) ONE voice 1:23** — recording with elapsed timer
- **$(sync~spin) ONE voice transcribing...** — processing audio

## License

MIT

---

**ONE voice** is part of the [ONE Ecosystem](https://expl.one) // powered by [EXPL Nodes](https://node.expl.one)
