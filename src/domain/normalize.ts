const PUNCTUATION_MAP: Record<string, string> = {
  "，": ",",
  "、": ",",
  "。": ".",
  "．": ".",
  "！": "!",
  "？": "?",
  "；": ";",
  "：": ":",
  "（": "(",
  "）": ")",
  "【": "[",
  "】": "]",
  "《": "<",
  "》": ">",
  "「": '"',
  "」": '"',
  "『": '"',
  "』": '"',
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "—": "-",
  "–": "-",
  "～": "~",
  "…": "...",
};

/**
 * The testimony fingerprint for a free-text reason.
 * PRD: remove spaces, unify punctuation; no semantic similarity.
 * We also lowercase Latin text and trim outer punctuation so that
 * "太累了。" and "太累了" are the same exact utterance.
 */
export function normalizeReason(input: string): string {
  let value = input.normalize("NFKC").trim().toLowerCase();
  value = value.replace(/\s+/gu, "");
  value = value.replace(
    /[，、。．！？；：（）【】《》「」『』“”‘’—–～…]/gu,
    (char) => PUNCTUATION_MAP[char] ?? char,
  );
  value = value.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "");
  return value;
}

export function reasonKeyForTag(branch: "A" | "B" | "C" | "D"): string {
  return `tag:${branch}`;
}
