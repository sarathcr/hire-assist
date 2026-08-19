import { validateVerhoeff } from './verhoeff.utility';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const parseCsvToJson = (csv: string): Record<string, string>[] => {
  const lines = csv.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
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
  const emailMap = new Map<string, number[]>();
  const invalidAadhaars: number[] = [];

  candidates.forEach((c) => {
    // Check multiple potential keys for Aadhaar and Email
    const aadhaar = (c['Aadhaar Number'] || c['aadhaarNumber'] || c['Adhar Number'] || c['adharNumber'])?.trim();
    const email = (c['Email Id'] || c['email'] || c['Email address'] || c['emailId'])?.trim().toLowerCase();
    
    // Store detected values back for consistency
    (c as any)['_detectedAadhaar'] = aadhaar;
    (c as any)['_detectedEmail'] = email;

    if (!aadhaar || !/^\d{12}$/.test(aadhaar) || !validateVerhoeff(aadhaar)) {
      invalidAadhaars.push(c['_id']);
    } else {
      if (!aadhaarMap.has(aadhaar)) aadhaarMap.set(aadhaar, []);
      aadhaarMap.get(aadhaar)!.push(c['_id']);
    }

    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(c['_id']);
    }
  });

  const visited = new Set<number>();
  const groups: { groupId: string; key: string; candidates: Record<string, string>[] }[] = [];

  // Group by invalid Aadhaar
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
      const email = (curr as any)['_detectedEmail'];

      if (aadhaar && aadhaarMap.has(aadhaar)) {
        aadhaarMap.get(aadhaar)!.forEach((id) => {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        });
      }

      if (email && emailMap.has(email)) {
        emailMap.get(email)!.forEach((id) => {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        });
      }
    }

    if (group.length > 0) {
      const first = group[0];
      const aadhaarKey = (first as any)['_detectedAadhaar'];
      const emailKey = (first as any)['_detectedEmail'];
      const key = aadhaarKey || emailKey || 'Unknown';
      const groupId = `group_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      groups.push({ groupId, key, candidates: group });
    }
  });

  return groups;
};
