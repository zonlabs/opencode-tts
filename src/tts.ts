import { execFile, execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
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
  const ps = `
$mci = Add-Type -MemberDefinition @'
[DllImport("winmm.dll")] public static extern int mciSendString(string c, System.Text.StringBuilder r, int l, System.IntPtr h);
'@ -Name MCI -Namespace WinMM -PassThru;
try {
  $mci::mciSendString('open "${path}" type mpegvideo alias tts', $null, 0, [IntPtr]::Zero);
  $mci::mciSendString('play tts wait', $null, 0, [IntPtr]::Zero);
} finally {
  $mci::mciSendString('close tts', $null, 0, [IntPtr]::Zero);
}`;
  await run(["powershell", "-NoProfile", "-Command", ps]);
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
