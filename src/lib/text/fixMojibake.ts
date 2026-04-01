const MOJIBAKE_PATTERN = /(Ã.|Â.|â.|ð.|Ð.|�)/;

function mojibakeScore(value: string) {
  return (value.match(/[ÃÂâðÐ�]/g) ?? []).length;
}

export function fixMojibake(value: string | null | undefined) {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value ?? "";
  }

  let current = value;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const decoded = Buffer.from(current, "latin1").toString("utf8");
      if (mojibakeScore(decoded) >= mojibakeScore(current)) {
        break;
      }
      current = decoded;
      if (!MOJIBAKE_PATTERN.test(current)) {
        break;
      }
    } catch {
      break;
    }
  }

  return current;
}
