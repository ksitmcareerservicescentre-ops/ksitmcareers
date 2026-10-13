"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  jobPostings,
  jobRecommendations,
  partnerEmployers,
  type JobPostingRecord,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type JobPostingItem = JobPostingRecord & {
  recommendationsCount: number;
  activePlacementsCount: number;
};

export type CreateJobInput = {
  title: string;
  employerId?: string;
  companyName: string;
  companyLogoUrl?: string;
  department: string;
  natureOfWork: string;
  duration: string;
  vacanciesCount: number;
  salaryRange?: string;
  location: string;
  summary: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string;
  applicationDeadline?: Date;
  contactEmail?: string;
  applicationUrl?: string;
  isPublished?: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List all Job Postings with search & filters
 */
export async function listJobPostingsAction(filter?: {
  search?: string;
  department?: string;
  natureOfWork?: string;
  publishedOnly?: boolean;
  employerId?: string;
}): Promise<JobPostingItem[]> {
  const conditions = [];

  if (filter?.employerId) {
    conditions.push(eq(jobPostings.employerId, filter.employerId));
  }
  if (filter?.publishedOnly) {
    conditions.push(eq(jobPostings.isPublished, true));
  }
  if (filter?.department && filter.department !== "ALL") {
    conditions.push(eq(jobPostings.department, filter.department));
  }
  if (filter?.natureOfWork && filter.natureOfWork !== "ALL") {
    conditions.push(eq(jobPostings.natureOfWork, filter.natureOfWork));
  }
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(jobPostings.title, pattern),
        ilike(jobPostings.companyName, pattern),
        ilike(jobPostings.summary, pattern),
        ilike(jobPostings.location, pattern),
        ilike(jobPostings.skills, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(jobPostings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobPostings.createdAt));

  // Compute metrics: recommendations and active placements
  const recStats = await db
    .select({
      jobId: jobRecommendations.jobId,
      totalCount: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(case when ${jobRecommendations.status} = 'IN_PROGRESS' then 1 end)::int`,
    })
    .from(jobRecommendations)
    .groupBy(jobRecommendations.jobId);

  const statMap = new Map<string, { total: number; active: number }>();
  for (const s of recStats) {
    statMap.set(s.jobId, { total: s.totalCount, active: s.activeCount });
  }

  return rows.map((r) => {
    const stats = statMap.get(r.id) || { total: 0, active: 0 };
    return {
      ...r,
      recommendationsCount: stats.total,
      activePlacementsCount: stats.active,
    };
  });
}

/**
 * Get single job posting details
 */
export async function getJobPostingAction(idOrSlug: string): Promise<JobPostingItem | null> {
  const [job] = await db
    .select()
    .from(jobPostings)
    .where(
      or(
        eq(jobPostings.id, idOrSlug as never),
        eq(jobPostings.slug, idOrSlug),
      ),
    )
    .limit(1);

  if (!job) return null;

  const [recStat] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(case when ${jobRecommendations.status} = 'IN_PROGRESS' then 1 end)::int`,
    })
    .from(jobRecommendations)
    .where(eq(jobRecommendations.jobId, job.id));

  return {
    ...job,
    recommendationsCount: recStat?.totalCount || 0,
    activePlacementsCount: recStat?.activeCount || 0,
  };
}

/**
 * Super Admin & Staff: Create a new job vacancy
 */
export async function createJobPostingAction(
  input: CreateJobInput,
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== "SUPER_ADMIN" &&
        currentUser.role !== "STAFF" &&
        currentUser.role !== "EMPLOYER")
    ) {
      throw new Error(
        "Unauthorized. Only Career Staff, Administrators, and verified Employers can post jobs.",
      );
    }

    let employerId = input.employerId || null;
    let companyName = input.companyName.trim();
    let companyLogoUrl = input.companyLogoUrl?.trim() || null;

    if (currentUser.role === "EMPLOYER") {
      const [emp] = await db
        .select()
        .from(partnerEmployers)
        .where(eq(partnerEmployers.userId, currentUser.id))
        .limit(1);
      if (!emp) throw new Error("Employer organization profile not found.");
      employerId = emp.id;
      companyName = emp.name;
      companyLogoUrl = emp.logoUrl || companyLogoUrl;
    }

    if (!input.title.trim()) throw new Error("Job title is required.");
    if (!companyName) throw new Error("Company / Employer name is required.");
    if (!input.summary.trim()) throw new Error("Job summary is required.");
    if (!input.description.trim()) throw new Error("Job description is required.");

    const baseSlug = slugify(`${companyName}-${input.title}`);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db
        .select({ id: jobPostings.id })
        .from(jobPostings)
        .where(eq(jobPostings.slug, uniqueSlug))
        .limit(1);
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [inserted] = await db
      .insert(jobPostings)
      .values({
        title: input.title.trim(),
        slug: uniqueSlug,
        employerId,
        companyName,
        companyLogoUrl,
        department: input.department || "ALL",
        natureOfWork: input.natureOfWork || "Full-Time",
        duration: input.duration || "Permanent",
        vacanciesCount: Number(input.vacanciesCount) || 1,
        salaryRange: input.salaryRange?.trim() || null,
        location: input.location?.trim() || "Katsina, Nigeria",
        summary: input.summary.trim(),
        description: input.description.trim(),
        requirements: input.requirements || [],
        responsibilities: input.responsibilities || [],
        skills: input.skills?.trim() || null,
        applicationDeadline: input.applicationDeadline || null,
        contactEmail: input.contactEmail?.trim() || null,
        applicationUrl: input.applicationUrl?.trim() || null,
        isPublished: input.isPublished ?? true,
      })
      .returning({ id: jobPostings.id });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "JOB_POSTING_CREATE",
      entityType: "job_postings",
      entityId: inserted.id,
      details: { title: input.title, company: companyName },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/staff");
    revalidatePath("/employer");
    return { success: true, jobId: inserted.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create job posting.",
    };
  }
}

/**
 * Super Admin & Staff: Update existing job vacancy
 */
export async function updateJobPostingAction(
  id: string,
  input: Partial<CreateJobInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== "SUPER_ADMIN" &&
        currentUser.role !== "STAFF" &&
        currentUser.role !== "EMPLOYER")
    ) {
      throw new Error("Unauthorized.");
    }

    const [existing] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id))
      .limit(1);

    if (!existing) throw new Error("Job posting not found.");

    if (currentUser.role === "EMPLOYER") {
      const [emp] = await db
        .select({ id: partnerEmployers.id })
        .from(partnerEmployers)
        .where(eq(partnerEmployers.userId, currentUser.id))
        .limit(1);
      if (!emp || existing.employerId !== emp.id) {
        throw new Error("You are not authorized to update this job vacancy.");
      }
    }

    await db
      .update(jobPostings)
      .set({
        title: input.title ? input.title.trim() : existing.title,
        employerId: input.employerId !== undefined ? input.employerId : existing.employerId,
        companyName: input.companyName ? input.companyName.trim() : existing.companyName,
        companyLogoUrl: input.companyLogoUrl !== undefined ? input.companyLogoUrl : existing.companyLogoUrl,
        department: input.department ?? existing.department,
        natureOfWork: input.natureOfWork ?? existing.natureOfWork,
        duration: input.duration ?? existing.duration,
        vacanciesCount: input.vacanciesCount !== undefined ? Number(input.vacanciesCount) : existing.vacanciesCount,
        salaryRange: input.salaryRange !== undefined ? input.salaryRange : existing.salaryRange,
        location: input.location ? input.location.trim() : existing.location,
        summary: input.summary ? input.summary.trim() : existing.summary,
        description: input.description ? input.description.trim() : existing.description,
        requirements: input.requirements ?? existing.requirements,
        responsibilities: input.responsibilities ?? existing.responsibilities,
        skills: input.skills !== undefined ? input.skills : existing.skills,
        applicationDeadline: input.applicationDeadline !== undefined ? input.applicationDeadline : existing.applicationDeadline,
        contactEmail: input.contactEmail !== undefined ? input.contactEmail : existing.contactEmail,
        applicationUrl: input.applicationUrl !== undefined ? input.applicationUrl : existing.applicationUrl,
        isPublished: input.isPublished !== undefined ? input.isPublished : existing.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(jobPostings.id, id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "JOB_POSTING_UPDATE",
      entityType: "job_postings",
      entityId: id,
      details: { title: input.title || existing.title },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/staff");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update job posting.",
    };
  }
}

/**
 * Super Admin & Staff: Delete job vacancy
 */
export async function deleteJobPostingAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== "SUPER_ADMIN" &&
        currentUser.role !== "STAFF" &&
        currentUser.role !== "EMPLOYER")
    ) {
      throw new Error("Unauthorized.");
    }

    const [existing] = await db
      .select({ id: jobPostings.id, employerId: jobPostings.employerId })
      .from(jobPostings)
      .where(eq(jobPostings.id, id))
      .limit(1);

    if (!existing) throw new Error("Job posting not found.");

    if (currentUser.role === "EMPLOYER") {
      const [emp] = await db
        .select({ id: partnerEmployers.id })
        .from(partnerEmployers)
        .where(eq(partnerEmployers.userId, currentUser.id))
        .limit(1);
      if (!emp || existing.employerId !== emp.id) {
        throw new Error("You are not authorized to delete this job vacancy.");
      }
    }

    await db.delete(jobPostings).where(eq(jobPostings.id, id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "JOB_POSTING_DELETE",
      entityType: "job_postings",
      entityId: id,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/staff");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete job posting.",
    };
  }
}

/**
 * Seed realistic, high-standard job postings
 */
export async function seedStandardJobsAction(): Promise<{
  success: boolean;
  seededCount: number;
  error?: string;
}> {
  try {
    const existing = await db.select({ id: jobPostings.id }).from(jobPostings).limit(1);
    if (existing.length > 0) {
      return { success: true, seededCount: 0 };
    }

    const sampleJobs: CreateJobInput[] = [
      {
        title: "Junior Cloud & Infrastructure Support Engineer",
        companyName: "Katsina State ICT Directorate / Tech Hub",
        department: "Computer Software Engineering",
        natureOfWork: "Full-Time (Hybrid)",
        duration: "Permanent",
        vacanciesCount: 3,
        salaryRange: "₦220,000 - ₦280,000 / month",
        location: "Katsina, Nigeria",
        summary: "Assist in administering state cloud infrastructure, monitoring public service portals, and deploying containerized applications.",
        description: `Katsina State Directorate of Information and Communication Technology (ICT) in collaboration with Katsina Tech Hub invites applications from motivated KSITM diploma graduates for the position of Junior Cloud & Infrastructure Support Engineer.

The role offers accelerated mentorship in Linux administration, Google Cloud Platform (GCP) workload management, and enterprise server maintenance. You will collaborate directly with seasoned systems architects to maintain high availability for e-government digital public infrastructure.`,
        responsibilities: [
          "Monitor uptime and latency of state digital services using Grafana and GCP Cloud Monitoring.",
          "Assist in automating routine backup tasks and disaster recovery protocols.",
          "Provide tier-2 technical resolution for municipal agency web portals.",
          "Collaborate with security engineers to patch vulnerabilities and audit user access logs.",
        ],
        requirements: [
          "National Diploma (ND) or Higher National Diploma (HND) in Computer Software Engineering, Computer Science, or Electrical/Electronic Engineering.",
          "Working familiarity with Linux shell commands, SSH, and basic networking (TCP/IP, DNS).",
          "Demonstrated coursework or virtual internship completion in Cloud Technologies or System Administration.",
          "Strong communication skills and analytical problem-solving mindset.",
        ],
        skills: "Linux, GCP, Docker, Bash Scripting, Network Troubleshooting",
        contactEmail: "careers@katsinaict.gov.ng",
        applicationUrl: "https://katsina.gov.ng/careers",
      },
      {
        title: "Graduate Network & Cybersecurity Operations Analyst",
        companyName: "MTN Nigeria Communications PLC",
        department: "Networking & System Security",
        natureOfWork: "Full-Time (On-Site)",
        duration: "12 Months (Renewable)",
        vacanciesCount: 4,
        salaryRange: "₦280,000 - ₦380,000 / month",
        location: "Kano / Katsina Regional Operations, Nigeria",
        summary: "Join the regional Network Operations Center (NOC) and Security Operations Center (SOC) to monitor enterprise telecom infrastructure.",
        description: `MTN Nigeria Communications is seeking highly disciplined, ambitious technology graduates for our Northern Regional Operations Center.

As a Network & Cybersecurity Operations Analyst, you will be stationed at the forefront of telecommunications infrastructure, safeguarding data transmission lines, analyzing firewall event logs, and escalating security incidents in real-time.`,
        responsibilities: [
          "Perform 24/7 surveillance of microwave transmission links and fiber-optic backbone circuits.",
          "Triage intrusion detection system (IDS/IPS) alerts and mitigate DDoS traffic anomalies.",
          "Document incident post-mortems and coordinate field repair dispatch.",
          "Verify adherence to ISO 27001 cybersecurity frameworks across regional base stations.",
        ],
        requirements: [
          "ND/HND in Networking & System Security or Telecommunications Technology.",
          "Understanding of Cisco routing and switching protocols (OSPF, BGP, VLANs).",
          "Hands-on experience with packet analysis tools such as Wireshark.",
          "Readiness to operate in a rotational shift schedule with dedicated on-call allowances.",
        ],
        skills: "Cisco Routing, Wireshark, Firewall Management, Intrusion Detection, Subnetting",
        contactEmail: "recruitment.ng@mtn.com",
        applicationUrl: "https://www.mtn.ng/careers",
      },
      {
        title: "FinTech Digital Banking Operations Associate",
        companyName: "Moniepoint Microfinance Bank",
        department: "Banking Operations & FinTech",
        natureOfWork: "Full-Time (On-Site)",
        duration: "Permanent",
        vacanciesCount: 5,
        salaryRange: "₦200,000 - ₦260,000 / month + Performance Bonus",
        location: "Katsina Central & Daura Branches, Nigeria",
        summary: "Drive merchant terminal onboarding, reconciliation audits, and digital banking settlement operations across commercial hubs.",
        description: `Moniepoint MFB is expanding its financial inclusion infrastructure across Katsina State. We are onboarding forward-thinking graduates who understand both financial ledgers and modern point-of-sale (POS) terminal technologies.

In this role, you will interface directly with business owners, resolve transaction disputes, and ensure liquidity compliance across designated agent networks.`,
        responsibilities: [
          "Audit daily automated clearinghouse (ACH) and NIBSS Instant Payment (NIP) settlement logs.",
          "Configure and deploy biometric-enabled smart merchant payment terminals.",
          "Train local SMEs on utilizing cash-flow analytics and merchant working capital loans.",
          "Investigate chargeback requests and execute fraud mitigation verification.",
        ],
        requirements: [
          "ND or HND in Banking Operations, Accounting, or Business Administration.",
          "Solid knowledge of Nigerian payment systems (NIBSS, Interswitch, Remita).",
          "Proficiency in Microsoft Excel / Google Sheets (VLOOKUP, Pivot Tables).",
          "Fluency in Hausa and English for effective merchant engagement.",
        ],
        skills: "Financial Reconciliation, POS Configuration, NIP Settlements, Excel, Merchant Support",
        contactEmail: "careers@moniepoint.com",
        applicationUrl: "https://moniepoint.com/careers",
      },
      {
        title: "Corporate Communications & Digital Content Strategist",
        companyName: "Katsina State Enterprise Development Agency (KASEDA)",
        department: "Mass Communication",
        natureOfWork: "Full-Time (On-Site)",
        duration: "24 Months",
        vacanciesCount: 2,
        salaryRange: "₦180,000 - ₦240,000 / month",
        location: "Katsina, Nigeria",
        summary: "Develop media releases, broadcast announcements, and documentary spotlights showcasing local entrepreneurs and youth innovators.",
        description: `KASEDA is the apex state body driving youth entrepreneurship and industrial investment. We are seeking creative Mass Communication graduates with exceptional storytelling ability to lead our corporate messaging and digital broadcast channels.`,
        responsibilities: [
          "Draft executive press releases, quarterly journals, and official media statements.",
          "Manage KASEDA social platforms and capture video interviews of funded entrepreneurs.",
          "Coordinate press conferences and liaise with regional radio and television broadcasters.",
          "Monitor public media sentiment and generate impact reports for donor agencies.",
        ],
        requirements: [
          "ND/HND in Mass Communication, Journalism, or Public Relations.",
          "Strong portfolio of published writing, broadcast scripts, or video productions.",
          "Working proficiency with multimedia editing tools (Canva, Premiere Pro, Audacity).",
          "High editorial standards with impeccable English and Hausa copywriting.",
        ],
        skills: "Copywriting, Media Relations, Video Editing, Social Media Management, Press Releases",
        contactEmail: "media@kaseda.kt.gov.ng",
      },
      {
        title: "Junior Backend Developer (Node.js & Postgres)",
        companyName: "Paystack (A Stripe Company)",
        department: "Computer Science",
        natureOfWork: "Full-Time (Remote)",
        duration: "Permanent",
        vacanciesCount: 2,
        salaryRange: "₦350,000 - ₦500,000 / month",
        location: "Remote (Nigeria)",
        summary: "Build scalable API services handling millions of financial transactions with automated test suites and high availability.",
        description: `Paystack accelerates commerce across Africa. As a Junior Backend Engineer, you will join our core payments infrastructure engineering squad. You will write clean, well-tested TypeScript and SQL code that powers real-time checkout experiences for thousands of merchants.`,
        responsibilities: [
          "Design RESTful and Webhook event pipelines with Node.js and TypeScript.",
          "Write optimized SQL queries and index strategies on PostgreSQL.",
          "Implement unit and integration tests with Jest and Playwright.",
          "Participate in agile peer code reviews and sprint retrospectives.",
        ],
        requirements: [
          "ND/HND in Computer Science or Software Engineering.",
          "Sound knowledge of JavaScript/TypeScript, relational database schemas, and Git.",
          "Demonstrated personal GitHub projects or virtual internship artifacts.",
          "Ability to thrive in an autonomous, highly collaborative remote work culture.",
        ],
        skills: "TypeScript, Node.js, PostgreSQL, REST APIs, Git, Unit Testing",
        contactEmail: "jobs@paystack.com",
        applicationUrl: "https://paystack.com/careers",
      },
      {
        title: "Administrative Operations & Executive Accounts Trainee",
        companyName: "Katsina Investment Promotion Agency (KIPA)",
        department: "Business Administration",
        natureOfWork: "Internship / SIWES (On-Site)",
        duration: "6 Months (With Conversion Path)",
        vacanciesCount: 3,
        salaryRange: "₦120,000 / month Monthly Stipend",
        location: "Katsina, Nigeria",
        summary: "Support investor document processing, procurement filing, and executive correspondence for foreign and domestic trade missions.",
        description: `KIPA facilitates multi-million dollar investments into Katsina State's agriculture, solid minerals, and renewable energy sectors. We are selecting top-tier Business Administration graduates for an intensive executive trainee placement.`,
        responsibilities: [
          "Manage digital archiving of bilateral MoUs and investor registration dossiers.",
          "Assist the Director of Operations in organizing investor roundtables and trade expos.",
          "Prepare official correspondence, expense vouchers, and meeting minutes.",
          "Liaise with ministry delegates to ensure seamless protocol execution.",
        ],
        requirements: [
          "ND in Business Administration, Public Administration, or Secretarial Studies.",
          "Proficiency in Microsoft Office Suite (Word, Excel, PowerPoint).",
          "Exemplary organizational ethics and attention to procedural protocol.",
          "Punctuality, professional demeanor, and discreet handling of confidential files.",
        ],
        skills: "Executive Correspondence, Records Archiving, Office 365, Protocol Management",
        contactEmail: "info@kipa.kt.gov.ng",
      },
    ];

    let seededCount = 0;
    for (const job of sampleJobs) {
      const res = await createJobPostingAction(job);
      if (res.success) seededCount++;
    }

    revalidatePath("/admin");
    return { success: true, seededCount };
  } catch (err: unknown) {
    return {
      success: false,
      seededCount: 0,
      error: err instanceof Error ? err.message : "Failed to seed jobs.",
    };
  }
}
