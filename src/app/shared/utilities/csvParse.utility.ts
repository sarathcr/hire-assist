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
): { groupId: string; key: string; candidates: Record<string, string>[] }[] => {
  const candidates = data.map((d, index) => ({ ...d, _id: index }) as Record<string, any>);
  const emailMap = new Map<string, number[]>();
  const mobileMap = new Map<string, number[]>();

  candidates.forEach((c) => {
    const email = c['Email Id']?.trim().toLowerCase();
    const mobile = c['Mobile number']?.trim();
    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(c['_id']);
    }
    if (mobile) {
      if (!mobileMap.has(mobile)) mobileMap.set(mobile, []);
      mobileMap.get(mobile)!.push(c['_id']);
    }
  });

  const visited = new Set<number>();
  const groups: { groupId: string; key: string; candidates: Record<string, string>[] }[] = [];

  candidates.forEach((c) => {
    if (visited.has(c['_id'])) return;

    const group: Record<string, string>[] = [];
    const queue = [c['_id']];
    visited.add(c['_id']);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const curr = candidates[currId];
      // Clean up internal _id before adding to group
      const { _id, ...candidateData } = curr;
      group.push(candidateData);

      const email = curr['Email Id']?.trim().toLowerCase();
      const mobile = curr['Mobile number']?.trim();

      if (email && emailMap.has(email)) {
        emailMap.get(email)!.forEach((id) => {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        });
      }
      if (mobile && mobileMap.has(mobile)) {
        mobileMap.get(mobile)!.forEach((id) => {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        });
      }
    }

    const first = group[0];
    const key = first['Email Id'] || first['Mobile number'] || 'Unknown';
    // Generate a simple unique groupId
    const groupId = `group_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    
    groups.push({ groupId, key, candidates: group });
  });

  return groups;
};
