import type { Plugin, PluginOptions } from "@opencode-ai/plugin";
import { parseConfig, type TTSConfig } from "./config";
import { shouldSkip, stripForSpeech } from "./filter";
import { speak } from "./tts";

async function getLastAssistantText(client: any, sessionID: string): Promise<string | null> {
  try {
    const res = await client.session.messages({ path: { id: sessionID }, query: { limit: 5 } });
    const data: any[] = res?.data ?? res;
    if (!Array.isArray(data)) return null;
    for (let i = data.length - 1; i >= 0; i--) {
      const entry = data[i];
      if (entry?.info?.role !== "assistant") continue;
      const parts: any[] = entry.parts ?? [];
      for (let j = parts.length - 1; j >= 0; j--) {
        if (parts[j]?.type === "text" && parts[j]?.text) {
          return parts[j].text;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getPartText(part: any): string | null {
  return part?.type === "text" ? (part.text ?? null) : null;
}

export const TTSPlugin: Plugin = async (pluginCtx, options) => {
  const config = parseConfig(options ?? {});
  const client = pluginCtx.client as any;

  client.app.log({
    body: { service: "opencode-tts", level: "info", message: `Plugin loaded (voice=${config.voice}, trigger=${config.trigger})` },
  }).catch(() => {});

  return {
    event: async (input: { event: any }) => {
      const event = input?.event;
      if (!event) return;

      try {
        client.app.log({
          body: { service: "opencode-tts", level: "debug", message: `Event received: ${event.type}` },
        }).catch(() => {});

        if (config.trigger === "session.idle" && event.type === "session.idle") {
          const sessionID = event.properties?.sessionID;
          if (!sessionID) return;
          const text = await getLastAssistantText(client, sessionID);
          if (!text) return;
          const skip = shouldSkip(text, config.maxChars);
          if (skip) {
            await client.app.log({
              body: { service: "opencode-tts", level: "debug", message: `Skipped: ${skip}` },
            });
            return;
          }
          const cleaned = stripForSpeech(text);
          if (!cleaned) return;
          await speak(cleaned, config.voice, config.rate);
        }

        if (config.trigger === "message.part.updated" && event.type === "message.part.updated") {
          const text = getPartText(event.properties?.part);
          if (!text) return;
          const skip = shouldSkip(text, config.maxChars);
          if (skip) return;
          const cleaned = stripForSpeech(text);
          if (!cleaned) return;
          await speak(cleaned, config.voice, config.rate);
        }
      } catch {
        // Never block the agent on TTS errors
      }
    },
  };
};

export default TTSPlugin;
export const server = TTSPlugin;
