export interface TTSConfig {
  voice: string;
  rate: string;
  maxChars: number;
  trigger: "session.idle" | "message.part.updated";
}

export const DEFAULTS: TTSConfig = {
  voice: "en-US-AriaNeural",
  rate: "+0%",
  maxChars: 800,
  trigger: "session.idle",
};

export function parseConfig(_ctx: any): TTSConfig {
  return {
    voice: process.env.OPENCODE_TTS_VOICE ?? DEFAULTS.voice,
    rate: process.env.OPENCODE_TTS_RATE ?? DEFAULTS.rate,
    maxChars: Number(process.env.OPENCODE_TTS_MAX_CHARS) || DEFAULTS.maxChars,
    trigger:
      (process.env.OPENCODE_TTS_TRIGGER as TTSConfig["trigger"]) ??
      DEFAULTS.trigger,
  };
}
