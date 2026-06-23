# opencode-tts

OpenCode plugin that speaks AI responses aloud using edge-tts (Microsoft neural voices). Free, no API key needed.

## Requirements

- Python 3.8+ with `edge-tts` installed:
  ```bash
  pip install edge-tts
  ```
- `edge-tts` must be on PATH

## Install

Place the `.js` file in `.opencode/plugins/` or list the npm package in your config:

```jsonc
{
  "plugin": ["opencode-tts"]
}
```

Run `opencode`, the plugin auto-loads on startup.

## Configuration

All config via environment variables:

| Variable | Default | Description |
|---|---|---|
| `OPENCODE_TTS_VOICE` | `en-US-AriaNeural` | edge-tts voice name |
| `OPENCODE_TTS_RATE` | `+0%` | Speech rate (e.g. `+10%`, `-15%`) |
| `OPENCODE_TTS_MAX_CHARS` | `800` | Skip responses longer than this |
| `OPENCODE_TTS_TRIGGER` | `session.idle` | When to speak: `session.idle` or `message.part.updated` |

Set them in your shell profile or pass inline:
```bash
OPENCODE_TTS_VOICE=en-GB-SoniaNeural opencode
```

List available voices: `edge-tts --list-voices`

## What gets spoken

Short conversational replies only. Skips:
- Responses > `maxChars` characters
- Code-heavy responses (>40% code fences)
- Responses with 3+ bullet points
- Tool output (file paths, JSON, diffs, tables)
- Responses under 3 chars after stripping markdown

## Platform

- **Windows**: MCI playback via PowerShell (built-in)
- **macOS/Linux**: requires `ffplay` (from ffmpeg)

## License

MIT
