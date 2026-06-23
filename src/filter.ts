export function stripForSpeech(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`[^`]+`/g, "");
  t = t.replace(/#{1,6}\s+/g, "");
  t = t.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  t = t.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");
  t = t.replace(/~~([^~]+)~~/g, "$1");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/https?:\/\/\S+/g, "");
  t = t.replace(/^\|.*\|$/gm, "");
  t = t.replace(/^[-*_]{3,}$/gm, "");
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  t = t.replace(/^\s*\d+\.\s+/gm, "");
  t = t.replace(/\u2014/g, ", ");
  t = t.replace(/\u2013/g, ", ");
  t = t.replace(/\u2012/g, ", ");
  t = t.replace(/\u2212/g, ", ");
  t = t.replace(/\s+-\s+/g, ", ");
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\s+$/, "");
  t = t.replace(/\u20ac/g, " euros ");
  t = t.replace(/\u00a3/g, " pounds ");
  t = t.replace(/\$/g, " dollars ");
  t = t.replace(/%/g, " percent ");
  const abbrs: [RegExp, string][] = [
    [/\bJSON\b/g, "jason"], [/\bWACC\b/g, "wack"],
    [/\bLLM\b/g, "L L M"], [/\bMCP\b/g, "M C P"],
    [/\bAPI\b/g, "A P I"], [/\bTTS\b/g, "T T S"],
    [/\bHTML\b/g, "H T M L"], [/\bURL\b/g, "U R L"],
    [/\bPR\b/g, "P R"],
  ];
  for (const [pat, repl] of abbrs) t = t.replace(pat, repl);
  return t;
}

export function shouldSkip(text: string, maxChars: number): string | null {
  if (text.length > maxChars) return `exceeds ${maxChars} chars`;
  const stripped = stripForSpeech(text);
  if (stripped.length < 3) return `too short (${stripped.length} chars)`;
  const codeBlocks = [...text.matchAll(/```[\s\S]*?```/g)];
  const codeChars = codeBlocks.reduce((s, m) => s + m[0].length, 0);
  if (text.length > 0 && codeChars / text.length > 0.4) return ">40% code fences";
  const bullets = text.match(/^\s*[-*+]\s+|^\s*\d+\.\s+/gm);
  if (bullets && bullets.length >= 3) return `${bullets.length} bullet points`;
  const lines = text.trim().split("\n");
  if (lines.length > 3) {
    const noisy = lines.filter(l => /^(\/|C:\\|\||\+|-|\{|\[|modified:|new file:)/.test(l));
    if (noisy.length / lines.length > 0.5) return "looks like tool output";
  }
  return null;
}
