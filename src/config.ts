export interface TTSConfig {
  voice: string;
  rate: string;
  maxChars: number;
  trigger: "session.idle" | "message.part.updated";
}

export const DEFAULTS: TTSConfig = {
  voice: "en-US-AriaNeural",
  rate: "+30%",
  maxChars: 800,
  trigger: "session.idle",
};

export function parseConfig(options: Record<string, unknown> = {}): TTSConfig {
  return {
    voice: (options.voice as string) ?? process.env.OPENCODE_TTS_VOICE ?? DEFAULTS.voice,
    rate: (options.rate as string) ?? process.env.OPENCODE_TTS_RATE ?? DEFAULTS.rate,
    maxChars: Number(options.maxChars ?? process.env.OPENCODE_TTS_MAX_CHARS) || DEFAULTS.maxChars,
    trigger: (options.trigger as TTSConfig["trigger"]) ?? process.env.OPENCODE_TTS_TRIGGER ?? DEFAULTS.trigger,
  };
}
