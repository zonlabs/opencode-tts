import { execFile, execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { promisify } from "util";

const exec = promisify(execFile);

function findPython(): string {
  const candidates = ["python", "python3", "py"];
  for (const exe of candidates) {
    try {
      const r = execFileSync(exe, ["--version"], { encoding: "utf8" });
      if (r.includes("Python")) return exe;
    } catch { /* try next */ }
  }
  return "python";
}

const pythonBin = findPython();

function run(args: string[]): Promise<void> {
  return exec(args[0], args.slice(1)).then(() => {});
}

async function playWindows(path: string): Promise<void> {
  const csPath = join(tmpdir(), `oc-tts-mci-${randomUUID()}.cs`);
  const csharp = `using System.Runtime.InteropServices;
using System.Text;
public class MciPlayer {
  [DllImport("winmm.dll")]
  public static extern int mciSendString(string c, StringBuilder r, int l, System.IntPtr h);
}`;
  const ps = `
Add-Type -Path "${csPath}";
try {
  [MciPlayer]::mciSendString('open "${path}" type mpegvideo alias tts', $null, 0, [IntPtr]::Zero) | Out-Null;
  [MciPlayer]::mciSendString('play tts wait', $null, 0, [IntPtr]::Zero) | Out-Null;
} finally {
  [MciPlayer]::mciSendString('close tts', $null, 0, [IntPtr]::Zero) | Out-Null;
}`;
  try {
    await writeFile(csPath, csharp);
    await run(["powershell", "-NoProfile", "-Command", ps]);
  } finally {
    await unlink(csPath).catch(() => {});
  }
}

async function playUnix(path: string): Promise<void> {
  await run(["ffplay", "-nodisp", "-autoexit", path]);
}

export let speaking = false;

export async function speak(
  text: string,
  voice: string,
  rate: string,
): Promise<void> {
  if (speaking) return;
  speaking = true;
  const tmpPath = join(tmpdir(), `oc-tts-${randomUUID()}.mp3`);
  try {
    await run([pythonBin, "-m", "edge_tts", "--text", text, "--voice", voice, "--rate", rate, "--write-media", tmpPath]);
    if (process.platform === "win32") {
      await playWindows(tmpPath);
    } else {
      await playUnix(tmpPath);
    }
  } catch {
    // silent — never block the agent
  } finally {
    speaking = false;
    await unlink(tmpPath).catch(() => {});
  }
}
