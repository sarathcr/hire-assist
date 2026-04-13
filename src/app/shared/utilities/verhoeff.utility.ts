/**
 * Verhoeff algorithm for validating and generating checksums.
 * Used for Aadhaar Number validation.
 */

const multiplication_table = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const permutation_table = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// const inverse_table = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a number string using the Verhoeff algorithm.
 * @param value The number string to validate.
 * @returns true if valid, false otherwise.
 */
export function validateVerhoeff(value: string): boolean {
  if (!value || !/^[0-9]+$/.test(value)) return false;

  const digits = value.split('').map(Number);
  let c = 0;

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[digits.length - 1 - i];
    c = multiplication_table[c][permutation_table[i % 8][digit]];
  }

  return c === 0;
}
