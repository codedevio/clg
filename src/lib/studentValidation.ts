// ─────────────────────────────────────────────────────────────────────────────
// Student Identity Field Validation
// ─────────────────────────────────────────────────────────────────────────────

/** Roll Number: {Section}-{RollNumber}
 *  Section = A | B | C  (uppercase)
 *  RollNumber = 1–60, no leading zeros
 *  Regex: ^[ABC]-(?:[1-9]|[1-5][0-9]|60)$
 */
export const ROLL_NUMBER_REGEX = /^[ABC]-(?:[1-9]|[1-5][0-9]|60)$/;

/** Batch: {Course}-{University}-B-{Number}
 *  Course = letters + dots (BCA, BSc.IT, MBA, MCA …)
 *  University = AKU | PPU
 *  B = fixed literal
 *  Number = positive integer, no leading zeros
 *  Regex: ^[A-Za-z.]+-(?:AKU|PPU)-B-[1-9][0-9]*$
 */
export const BATCH_REGEX = /^[A-Za-z.]+-(?:AKU|PPU)-B-[1-9][0-9]*$/;

/** College ID: {CollegeCode}-{StudentID}
 *  CollegeCode = 444 | 445 | 452 | 310 | 710
 *  StudentID = 4–6 digit integer
 *  Regex: ^(444|445|452|310|710)-[0-9]{4,6}$
 */
export const COLLEGE_ID_REGEX = /^(444|445|452|310|710)-[0-9]{4,6}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Per-field validators — return an error string, or '' when valid
// ─────────────────────────────────────────────────────────────────────────────

export function validateFullName(value: string): string {
  const v = value.trim();
  if (!v) return 'Full name is required.';
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (v.length > 80) return 'Name must be 80 characters or fewer.';
  return '';
}

export function validateRollNumber(value: string): string {
  const v = value.trim();
  if (!v) return 'Roll number is required.';
  if (!ROLL_NUMBER_REGEX.test(v))
    return 'Format: A/B/C-<1–60>  (e.g. A-12, B-60). No leading zeros.';
  return '';
}

export function validateBatch(value: string): string {
  const v = value.trim();
  if (!v) return 'Batch is required.';
  if (!BATCH_REGEX.test(v))
    return 'Format: Course-AKU/PPU-B-<number>  (e.g. BCA-AKU-B-1, MCA-PPU-B-23). No leading zeros.';
  return '';
}

export function validateCollegeId(value: string): string {
  const v = value.trim();
  if (!v) return 'College ID is required.';
  if (!COLLEGE_ID_REGEX.test(v))
    return 'Format: <code>-<4–6 digits>. Valid codes: 444, 445, 452, 310, 710  (e.g. 444-1234).';
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Types & aggregate helper
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentFieldErrors {
  full_name: string;
  roll_number: string;
  batch: string;
  college_id: string;
}

export function validateStudentFields(fields: {
  full_name: string;
  roll_number: string;
  batch: string;
  college_id: string;
}): StudentFieldErrors {
  return {
    full_name: validateFullName(fields.full_name),
    roll_number: validateRollNumber(fields.roll_number),
    batch: validateBatch(fields.batch),
    college_id: validateCollegeId(fields.college_id),
  };
}

export function isStudentFormValid(errors: StudentFieldErrors): boolean {
  return Object.values(errors).every((e) => e === '');
}
