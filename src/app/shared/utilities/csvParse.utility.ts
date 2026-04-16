import { validateVerhoeff } from './verhoeff.utility';

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
  const aadhaarMap = new Map<string, number[]>();
  const invalidAadhaars: number[] = [];

  candidates.forEach((c) => {
    // Check multiple potential keys for Aadhaar
    const aadhaar = (c['Aadhaar Number'] || c['aadhaarNumber'] || c['Adhar Number'] || c['adharNumber'])?.trim();
    
    // Store detected aadhaar back for consistency in labels later
    (c as any)['_detectedAadhaar'] = aadhaar;

    if (!aadhaar || !/^\d{12}$/.test(aadhaar) || !validateVerhoeff(aadhaar)) {
      invalidAadhaars.push(c['_id']);
    } else {
      if (!aadhaarMap.has(aadhaar)) aadhaarMap.set(aadhaar, []);
      aadhaarMap.get(aadhaar)!.push(c['_id']);
    }
  });

  const visited = new Set<number>();
  const groups: { groupId: string; key: string; candidates: Record<string, string>[] }[] = [];

  // Group by invalid Aadhaar (each invalid record is its own group or grouped together?)
  // User says "listing the failed records", so I'll group them by "Invalid Aadhaar" if they are invalid
  invalidAadhaars.forEach((id) => {
    if (visited.has(id)) return;
    const curr = candidates[id];
    const { _id, ...candidateData } = curr;
    visited.add(id);
    groups.push({
      groupId: `invalid_${id}_${Date.now()}`,
      key: `Invalid Aadhaar: ${(curr as any)['_detectedAadhaar'] || 'Empty'}`,
      candidates: [{ ...candidateData, isInvalid: 'true' }]
    });
  });

  candidates.forEach((c) => {
    if (visited.has(c['_id'])) return;

    const group: Record<string, string>[] = [];
    const queue = [c['_id']];
    visited.add(c['_id']);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const curr = candidates[currId];
      const { _id, ...candidateData } = curr;
      group.push(candidateData);

      const aadhaar = (curr as any)['_detectedAadhaar'];

      if (aadhaar && aadhaarMap.has(aadhaar)) {
        aadhaarMap.get(aadhaar)!.forEach((id) => {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        });
      }
    }

    // Only add as duplicate group if there's more than one candidate or it's a known duplicate from BE (not handled here)
    if (group.length > 1) {
      const first = group[0];
      const key = (first as any)['_detectedAadhaar'] || 'Unknown';
      const groupId = `group_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      groups.push({ groupId, key, candidates: group });
    }
  });

  return groups;
};
