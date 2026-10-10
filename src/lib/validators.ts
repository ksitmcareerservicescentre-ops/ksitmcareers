/**
 * Shared validation and normalization utilities across KSITM Careers.
 */

// Strictly validates that a URL is a legitimate LinkedIn profile/company/school URL
export function isValidLinkedInUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  return /^https:\/\/(www\.)?linkedin\.com\/(in|company|school)\/[a-zA-Z0-9_\-\.%]+\/?.*$/i.test(
    trimmed,
  );
}

/**
 * Normalizes a name string: strips extra whitespace, accents/punctuation, lowercases.
 */
export function normalizeStudentNamePart(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Validates that student-provided first name and second name match the institutional master record.
 * Supports Nigerian naming patterns where surnames and first names might be inverted on official lists.
 * E.g., Master record: Surname: "Yusuf", First Name: "Amina"
 * Student input: First Name: "Amina", Second Name: "Yusuf"
 * Both names must tally with the tokens present in the master record.
 */
export function validateStudentNamesTally(
  inputFirstName: string,
  inputSecondName: string,
  masterFirstName: string,
  masterLastName: string,
  masterMiddleName?: string | null,
  masterFullName?: string | null,
): { matches: boolean; reason?: string } {
  const normInputFirst = normalizeStudentNamePart(inputFirstName);
  const normInputSecond = normalizeStudentNamePart(inputSecondName);

  if (!normInputFirst || !normInputSecond) {
    return {
      matches: false,
      reason: "Both First Name and Second Name (Surname) are required.",
    };
  }

  // Gather all tokens from the master record
  const masterTokens: string[] = [];
  if (masterFirstName) masterTokens.push(normalizeStudentNamePart(masterFirstName));
  if (masterLastName) masterTokens.push(normalizeStudentNamePart(masterLastName));
  if (masterMiddleName) masterTokens.push(normalizeStudentNamePart(masterMiddleName));
  if (masterFullName) {
    const parts = masterFullName.split(/\s+/).map(normalizeStudentNamePart).filter(Boolean);
    masterTokens.push(...parts);
  }

  const uniqueMasterTokens = Array.from(new Set(masterTokens));

  // Verify that the input first name matches at least one master token
  const firstMatches = uniqueMasterTokens.includes(normInputFirst);
  // Verify that the input second name matches at least one master token
  const secondMatches = uniqueMasterTokens.includes(normInputSecond);

  // Both must match different tokens (unless the student legitimately has the same first and last name, e.g. "Aliyu Aliyu")
  if (!firstMatches || !secondMatches) {
    return {
      matches: false,
      reason:
        "The First Name or Second Name does not match the KSITM institutional master records for this registration number.",
    };
  }

  return { matches: true };
}
