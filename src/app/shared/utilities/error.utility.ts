/**
 * Safely extracts backend error message from HTTP error response.
 * Prioritizes rrorValue (used by HireAssist CustomException for business/domain errors),
 * followed by 	ype (formatted business error), message, and then fallback/detail.
 */
export function extractErrorMessage(err: any, fallback: string = 'An error occurred'): string {
  if (!err) return fallback;

  let errObj = err.error ?? err;
  if (typeof errObj === 'string') {
    try {
      errObj = JSON.parse(errObj);
    } catch {
      return errObj.trim() || fallback;
    }
  }

  const getCaseInsensitive = (obj: any, propName: string): any => {
    if (!obj || typeof obj !== 'object') return undefined;
    const target = propName.toLowerCase().replace(/[-_]/g, '');
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().replace(/[-_]/g, '') === target) {
        return obj[key];
      }
    }
    return undefined;
  };

  const toText = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    if (Array.isArray(val) && val.length > 0) {
      return toText(val[0]);
    }
    return null;
  };

  // Helper to filter out internal developer symbols like "DeleteInstructionAsync", file paths, or RFC error names
  const isInternalCodeSymbol = (val: string): boolean => {
    if (!val) return true;
    if (val.endsWith('Async') || val.endsWith('Controller') || val.endsWith('Handler')) return true;
    if (val.includes('.cs') || val.includes('.ts') || val.includes('\\') || (val.includes('/') && !val.includes(' '))) return true;
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    return false;
  };

  const searchTargets = [
    errObj,
    errObj?.error,
    errObj?.data,
    errObj?.response,
  ].filter((o) => o && typeof o === 'object');

  // 1. Highest Priority: errorValue (e.g. errorValue, ErrorValue, error_value, errorvalue)
  for (const target of searchTargets) {
    const errorVal = toText(getCaseInsensitive(target, 'errorValue'));
    if (errorVal && !isInternalCodeSymbol(errorVal)) {
      return errorVal;
    }
  }

  // 2. Next Priority: type (CustomException sets Type to the formatted business error text)
  for (const target of searchTargets) {
    const typeVal = toText(getCaseInsensitive(target, 'type'));
    if (typeVal && !isInternalCodeSymbol(typeVal)) {
      return typeVal;
    }
  }

  // 3. Next Priority: message
  for (const target of searchTargets) {
    const msg = toText(getCaseInsensitive(target, 'message'));
    if (msg && !isInternalCodeSymbol(msg)) {
      return msg;
    }
  }

  // 4. Fallback: detail / details only if errorValue, type, and message are absent AND not code symbols
  for (const target of searchTargets) {
    const detail =
      toText(getCaseInsensitive(target, 'detail')) ||
      toText(getCaseInsensitive(target, 'details'));
    if (detail && !isInternalCodeSymbol(detail)) {
      return detail;
    }
  }

  // 5. Fallback: title if it's a real user message
  for (const target of searchTargets) {
    const title = toText(getCaseInsensitive(target, 'title'));
    if (title && !isInternalCodeSymbol(title)) {
      return title;
    }
  }

  return fallback;
}
