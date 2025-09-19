export const parseCsvToJson = (csv: string): Record<string, string>[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: Record<string, string> = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    return obj;
  });
};

export const groupCandidatesByContact = (
  data: Record<string, string>[],
): { key: string; candidates: Record<string, string>[] }[] => {
  const map = new Map<string, Record<string, string>[]>();

  data.forEach((candidate) => {
    const email = candidate['Email Id']?.trim().toLowerCase();
    const mobile = candidate['Mobile number']?.trim();

    const key = email || mobile;
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(candidate);
  });

  return Array.from(map.entries()).map(([key, candidates]) => ({
    key,
    candidates,
  }));
};
