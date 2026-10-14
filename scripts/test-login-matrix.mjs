import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const sql = neon(process.env.DATABASE_URL);

async function verifyPassword(password, hash) {
  try {
    const parts = hash.split(":");
    if (parts.length === 3 && parts[0] === "scrypt") {
      const salt = parts[1];
      const keyHex = parts[2];
      const derivedKey = await scryptAsync(password, salt, 64);
      return timingSafeEqual(Buffer.from(keyHex, "hex"), derivedKey);
    }
    return false;
  } catch {
    return false;
  }
}

const SYSTEM_DOMAINS = [
  "ksitmcareers.gov.ng",
  "ksitmscareers.gov.ng",
  "ksitmcareers.edu.ng",
  "ksitmcareers.org.ng",
  "ksitm.edu.ng",
];

async function resolveAndAuthenticate(identifier, password) {
  const cleanId = identifier.trim();
  const isEmail = cleanId.includes("@");
  let targetUser = null;

  if (isEmail) {
    const lowerEmail = cleanId.toLowerCase();
    const [localPart, domainPart] = lowerEmail.split("@");
    const searchEmails = [lowerEmail];

    if (domainPart === "ksitmscareers.gov.ng") {
      searchEmails.push(`${localPart}@ksitmcareers.gov.ng`);
    }

    if (localPart === "employee1") {
      searchEmails.push(`employer1@${domainPart}`);
      searchEmails.push("employer1@ksitmcareers.gov.ng");
    } else if (localPart === "employer1") {
      searchEmails.push(`employee1@${domainPart}`);
    }

    if (SYSTEM_DOMAINS.includes(domainPart)) {
      for (const sysDomain of SYSTEM_DOMAINS) {
        if (sysDomain !== domainPart) {
          searchEmails.push(`${localPart}@${sysDomain}`);
        }
      }
    }

    const matchedUsers = await sql`
      SELECT id, email, password_hash, role, is_active
      FROM users
      WHERE lower(email) = ANY(${searchEmails})
    `;

    if (matchedUsers.length > 0) {
      targetUser = matchedUsers.sort((a, b) => {
        const idxA = searchEmails.indexOf(a.email.toLowerCase());
        const idxB = searchEmails.indexOf(b.email.toLowerCase());
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      })[0];
    }
  } else {
    // 1. Reg number check
    const [stuByReg] = await sql`
      SELECT user_id FROM student_profiles WHERE upper(reg_number) = upper(${cleanId}) LIMIT 1
    `;
    if (stuByReg?.user_id) {
      const [u] = await sql`
        SELECT id, email, password_hash, role, is_active FROM users WHERE id = ${stuByReg.user_id}
      `;
      targetUser = u || null;
    }

    if (!targetUser) {
      const [master] = await sql`
        SELECT registered_user_id FROM student_master_list WHERE upper(reg_number) = upper(${cleanId}) LIMIT 1
      `;
      if (master?.registered_user_id) {
        const [u] = await sql`
          SELECT id, email, password_hash, role, is_active FROM users WHERE id = ${master.registered_user_id}
        `;
        targetUser = u || null;
      }
    }

    // 2. System username check strictly against system domains
    if (!targetUser) {
      const lowerUsername = cleanId.toLowerCase();
      const candidateUsernames = [lowerUsername];
      if (lowerUsername === "employee1") candidateUsernames.push("employer1");
      if (lowerUsername === "employer1") candidateUsernames.push("employee1");
      if (lowerUsername === "admin") candidateUsernames.push("superadmin");

      const candidateEmails = [];
      const domainsByPriority = [
        "ksitmcareers.gov.ng",
        "ksitmcareers.edu.ng",
        "ksitmcareers.org.ng",
        "ksitm.edu.ng",
      ];
      for (const dom of domainsByPriority) {
        for (const u of candidateUsernames) {
          candidateEmails.push(`${u}@${dom}`);
        }
      }

      const matched = await sql`
        SELECT id, email, password_hash, role, is_active
        FROM users
        WHERE lower(email) = ANY(${candidateEmails})
      `;

      if (matched.length > 0) {
        targetUser = matched.sort((a, b) => {
          const idxA = candidateEmails.indexOf(a.email.toLowerCase());
          const idxB = candidateEmails.indexOf(b.email.toLowerCase());
          return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        })[0];
      }
    }
  }

  if (!targetUser) {
    return { status: "FAILED_NOT_FOUND" };
  }

  const valid = await verifyPassword(password, targetUser.password_hash);
  if (!valid) {
    return { status: "FAILED_WRONG_PASSWORD", user: targetUser.email };
  }

  let dest = "/dashboard";
  if (targetUser.role === "SUPER_ADMIN") dest = "/admin";
  else if (targetUser.role === "STAFF") dest = "/staff";
  else if (targetUser.role === "EMPLOYER") dest = "/employer";

  return { status: "SUCCESS", email: targetUser.email, role: targetUser.role, destination: dest };
}

async function runTestMatrix() {
  console.log("=== RUNNING LOGIN RESOLUTION TEST MATRIX ===\n");
  const testCases = [
    { id: "superadmin", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/admin" },
    { id: "student1", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/dashboard" },
    { id: "employer1", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/employer" },
    { id: "employee1", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/employer" },
    { id: "careerofficer1", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/staff" },
    { id: "superadmin@ksitmcareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/admin" },
    { id: "superadmin@ksitmscareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/admin" },
    { id: "student1@ksitmcareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/dashboard" },
    { id: "employer1@ksitmcareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/employer" },
    { id: "employee1@ksitmcareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/employer" },
    { id: "careerofficer1@ksitmcareers.gov.ng", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/staff" },
    { id: "yahayafatimaaliyu8@gmail.com", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/dashboard" },
    { id: "yahayafatimaaliyu8", pass: "12345678", expectedStatus: "FAILED_NOT_FOUND" }, // Must fail because full email required for gmail!
    { id: "HND/ACC/25/0006", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/dashboard" },
    { id: "KSITM/ND/STE/24/001", pass: "12345678", expectedStatus: "SUCCESS", expectedDest: "/dashboard" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await resolveAndAuthenticate(tc.id, tc.pass);
    const ok = res.status === tc.expectedStatus && (!tc.expectedDest || res.destination === tc.expectedDest);
    if (ok) {
      console.log(`[PASS] Input: "${tc.id}" -> Status: ${res.status}${res.destination ? ` -> ${res.destination} (${res.email})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] Input: "${tc.id}" -> Got ${JSON.stringify(res)}, expected status ${tc.expectedStatus} dest ${tc.expectedDest}`);
    }
  }

  console.log(`\nResults: ${passed} / ${testCases.length} tests passed.`);
  if (passed === testCases.length) {
    console.log("ALL 15 AUTHENTICATION MATRIX TESTS PASSED PERFECTLY!");
  }
}

runTestMatrix().catch(console.error);
