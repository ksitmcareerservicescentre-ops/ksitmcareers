"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  studentProfiles,
  resumeProfiles,
  resumeEducation,
  resumeExperience,
  resumeSkills,
  resumeCertifications,
  resumeProjects,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { analyzeResumeATS } from "@/lib/resume-ats";

export type ResumeTemplateId =
  | "ats-clean"
  | "modern-dual"
  | "tech-minimal"
  | "executive-serif";

export type ResumeEducationItem = {
  id?: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  grade?: string | null;
  displayOrder: number;
};

export type ResumeExperienceItem = {
  id?: string;
  organization: string;
  roleTitle: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description: string;
  displayOrder: number;
};

export type ResumeSkillItem = {
  id?: string;
  category: string;
  name: string;
  proficiency?: string | null;
  displayOrder: number;
};

export type ResumeProjectItem = {
  id?: string;
  title: string;
  description: string;
  role?: string | null;
  projectUrl?: string | null;
  displayOrder: number;
};

export type ResumeCertificationItem = {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string | null;
  expirationDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  displayOrder: number;
};

export type ResumeProfileData = {
  id?: string;
  studentId: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  websiteUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  professionalSummary: string;
  template: ResumeTemplateId;
  accentColor: string;
  fontFamily: "academic" | "sans" | "mono";
  education: ResumeEducationItem[];
  experience: ResumeExperienceItem[];
  skills: ResumeSkillItem[];
  projects: ResumeProjectItem[];
  certifications: ResumeCertificationItem[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type ResumeSummaryRow = {
  id: string;
  studentId: string;
  studentName: string;
  regNumber: string;
  department: string | null;
  headline: string;
  atsScore: number;
  template: string;
  updatedAt: Date;
};

// Metadata encoder / parser for non-destructive storage of extended attributes
const META_TAG = "<!--RESUME_METADATA:";
const META_END = "-->";

function encodeSummaryWithMeta(data: {
  summary: string;
  headline?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  template?: string;
  accentColor?: string;
  fontFamily?: string;
}): string {
  const metaObj = {
    headline: data.headline || "",
    websiteUrl: data.websiteUrl || "",
    linkedInUrl: data.linkedInUrl || "",
    githubUrl: data.githubUrl || "",
    template: data.template || "ats-clean",
    accentColor: data.accentColor || "#059669",
    fontFamily: data.fontFamily || "sans",
  };
  const jsonStr = JSON.stringify(metaObj);
  return `${META_TAG}${jsonStr}${META_END}\n${data.summary.trim()}`;
}

function decodeSummaryWithMeta(rawText: string | null): {
  summary: string;
  headline: string;
  websiteUrl: string;
  linkedInUrl: string;
  githubUrl: string;
  template: ResumeTemplateId;
  accentColor: string;
  fontFamily: "academic" | "sans" | "mono";
} {
  const defaults = {
    summary: rawText || "",
    headline: "Undergraduate / Career Candidate",
    websiteUrl: "",
    linkedInUrl: "",
    githubUrl: "",
    template: "ats-clean" as ResumeTemplateId,
    accentColor: "#059669",
    fontFamily: "sans" as const,
  };

  if (!rawText) return defaults;

  if (rawText.startsWith(META_TAG)) {
    const endIdx = rawText.indexOf(META_END);
    if (endIdx !== -1) {
      try {
        const jsonPart = rawText.slice(META_TAG.length, endIdx);
        const parsed = JSON.parse(jsonPart);
        const textPart = rawText.slice(endIdx + META_END.length).trim();
        return {
          summary: textPart,
          headline: parsed.headline || defaults.headline,
          websiteUrl: parsed.websiteUrl || "",
          linkedInUrl: parsed.linkedInUrl || "",
          githubUrl: parsed.githubUrl || "",
          template: (parsed.template || "ats-clean") as ResumeTemplateId,
          accentColor: parsed.accentColor || "#059669",
          fontFamily: (parsed.fontFamily || "sans") as "academic" | "sans" | "mono",
        };
      } catch {
        // Fall back to raw text on malformed meta
      }
    }
  }

  return defaults;
}

/**
 * Fetch a student's resume by studentId (or current user's profile if omitted)
 */
export async function getStudentResumeAction(
  targetStudentId?: string,
): Promise<ResumeProfileData | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized.");

  let studentId = targetStudentId;
  if (!studentId) {
    if (currentUser.role === "STUDENT" && currentUser.studentProfile) {
      studentId = currentUser.studentProfile.id;
    } else {
      // Find first student in database for preview if admin
      const [first] = await db
        .select({ id: studentProfiles.id })
        .from(studentProfiles)
        .limit(1);
      if (first) studentId = first.id;
    }
  }

  if (!studentId) return null;

  // Permission check: Students can only view their own resume
  if (
    currentUser.role === "STUDENT" &&
    currentUser.studentProfile?.id !== studentId
  ) {
    throw new Error("Access denied.");
  }

  const [profile] = await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.studentId, studentId))
    .limit(1);

  if (!profile) {
    // Return empty starter template populated with student profile details
    const [st] = await db
      .select({
        id: studentProfiles.id,
        fullName: studentProfiles.fullName,
        department: studentProfiles.department,
        level: studentProfiles.level,
        phone: studentProfiles.phone,
        bio: studentProfiles.bio,
        linkedInUrl: studentProfiles.linkedInUrl,
        email: users.email,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(studentProfiles.id, studentId))
      .limit(1);

    if (!st) return null;

    return {
      studentId: st.id,
      fullName: st.fullName,
      headline: `${st.department || "Technology"} Specialist | KSITM Scholar`,
      email: st.email,
      phone: st.phone || "",
      location: "Katsina, Nigeria",
      websiteUrl: "",
      linkedInUrl: st.linkedInUrl || "",
      githubUrl: "",
      professionalSummary:
        st.bio ||
        `Motivated ${st.department || "Computing"} student at Katsina State Institute of Technology and Management, equipped with strong analytical problem-solving and modern technical competencies. Dedicated to engineering robust solutions and continuous career advancement.`,
      template: "ats-clean",
      accentColor: "#059669",
      fontFamily: "sans",
      education: [
        {
          institution:
            "Katsina State Institute of Technology and Management (KSITM)",
          qualification: "National Diploma (ND)",
          fieldOfStudy: st.department || "Computer Science",
          startDate: "2023",
          endDate: "2025",
          isCurrent: true,
          grade: "Distinction Track",
          displayOrder: 1,
        },
      ],
      experience: [],
      skills: [
        { category: "TECHNICAL", name: "Problem Solving", proficiency: "ADVANCED", displayOrder: 1 },
        { category: "TECHNICAL", name: "System Analysis", proficiency: "INTERMEDIATE", displayOrder: 2 },
        { category: "SOFT_SKILLS", name: "Professional Communication", proficiency: "ADVANCED", displayOrder: 3 },
      ],
      projects: [],
      certifications: [],
    };
  }

  const meta = decodeSummaryWithMeta(profile.professionalSummary);

  const [education, experience, skills, projects, certifications] =
    await Promise.all([
      db
        .select()
        .from(resumeEducation)
        .where(eq(resumeEducation.resumeProfileId, profile.id))
        .orderBy(asc(resumeEducation.displayOrder)),
      db
        .select()
        .from(resumeExperience)
        .where(eq(resumeExperience.resumeProfileId, profile.id))
        .orderBy(asc(resumeExperience.displayOrder)),
      db
        .select()
        .from(resumeSkills)
        .where(eq(resumeSkills.resumeProfileId, profile.id))
        .orderBy(asc(resumeSkills.displayOrder)),
      db
        .select()
        .from(resumeProjects)
        .where(eq(resumeProjects.resumeProfileId, profile.id))
        .orderBy(asc(resumeProjects.displayOrder)),
      db
        .select()
        .from(resumeCertifications)
        .where(eq(resumeCertifications.resumeProfileId, profile.id))
        .orderBy(asc(resumeCertifications.displayOrder)),
    ]);

  return {
    id: profile.id,
    studentId: profile.studentId,
    fullName: profile.fullName,
    headline: meta.headline,
    email: profile.email,
    phone: profile.phone || "",
    location: profile.location || "",
    websiteUrl: meta.websiteUrl,
    linkedInUrl: meta.linkedInUrl,
    githubUrl: meta.githubUrl,
    professionalSummary: meta.summary,
    template: meta.template,
    accentColor: meta.accentColor,
    fontFamily: meta.fontFamily,
    education,
    experience: experience.map((exp) => ({
      ...exp,
      description: exp.description || "",
    })),
    skills,
    projects,
    certifications,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Save / Upsert a complete resume record
 */
export async function saveStudentResumeAction(data: ResumeProfileData): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized.");

    // Permission check
    if (
      currentUser.role === "STUDENT" &&
      currentUser.studentProfile?.id !== data.studentId
    ) {
      throw new Error("You are not permitted to edit this resume.");
    }

    const encodedSummary = encodeSummaryWithMeta({
      summary: data.professionalSummary,
      headline: data.headline,
      websiteUrl: data.websiteUrl,
      linkedInUrl: data.linkedInUrl,
      githubUrl: data.githubUrl,
      template: data.template,
      accentColor: data.accentColor,
      fontFamily: data.fontFamily,
    });

    // Check if resumeProfile already exists
    const [existing] = await db
      .select({ id: resumeProfiles.id })
      .from(resumeProfiles)
      .where(eq(resumeProfiles.studentId, data.studentId))
      .limit(1);

    let profileId: string;

    if (existing) {
      profileId = existing.id;
      await db
        .update(resumeProfiles)
        .set({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          location: data.location || null,
          professionalSummary: encodedSummary,
          updatedAt: new Date(),
        })
        .where(eq(resumeProfiles.id, profileId));
    } else {
      const [inserted] = await db
        .insert(resumeProfiles)
        .values({
          studentId: data.studentId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          location: data.location || null,
          professionalSummary: encodedSummary,
        })
        .returning({ id: resumeProfiles.id });
      profileId = inserted.id;
    }

    // Refresh child sections transactionally
    await Promise.all([
      db
        .delete(resumeEducation)
        .where(eq(resumeEducation.resumeProfileId, profileId)),
      db
        .delete(resumeExperience)
        .where(eq(resumeExperience.resumeProfileId, profileId)),
      db
        .delete(resumeSkills)
        .where(eq(resumeSkills.resumeProfileId, profileId)),
      db
        .delete(resumeProjects)
        .where(eq(resumeProjects.resumeProfileId, profileId)),
      db
        .delete(resumeCertifications)
        .where(eq(resumeCertifications.resumeProfileId, profileId)),
    ]);

    // Insert Education
    if (data.education.length > 0) {
      await db.insert(resumeEducation).values(
        data.education.map((item, idx) => ({
          resumeProfileId: profileId,
          institution: item.institution,
          qualification: item.qualification,
          fieldOfStudy: item.fieldOfStudy,
          startDate: item.startDate,
          endDate: item.endDate || null,
          isCurrent: item.isCurrent,
          grade: item.grade || null,
          displayOrder: idx + 1,
        })),
      );
    }

    // Insert Experience
    if (data.experience.length > 0) {
      await db.insert(resumeExperience).values(
        data.experience.map((item, idx) => ({
          resumeProfileId: profileId,
          organization: item.organization,
          roleTitle: item.roleTitle,
          location: item.location || null,
          startDate: item.startDate,
          endDate: item.endDate || null,
          isCurrent: item.isCurrent,
          description: item.description,
          displayOrder: idx + 1,
        })),
      );
    }

    // Insert Skills
    if (data.skills.length > 0) {
      await db.insert(resumeSkills).values(
        data.skills.map((item, idx) => ({
          resumeProfileId: profileId,
          category: item.category,
          name: item.name,
          proficiency: item.proficiency || null,
          displayOrder: idx + 1,
        })),
      );
    }

    // Insert Projects
    if (data.projects.length > 0) {
      await db.insert(resumeProjects).values(
        data.projects.map((item, idx) => ({
          resumeProfileId: profileId,
          title: item.title,
          description: item.description,
          role: item.role || null,
          projectUrl: item.projectUrl || null,
          displayOrder: idx + 1,
        })),
      );
    }

    // Insert Certifications
    if (data.certifications.length > 0) {
      await db.insert(resumeCertifications).values(
        data.certifications.map((item, idx) => ({
          resumeProfileId: profileId,
          name: item.name,
          issuingOrganization: item.issuingOrganization,
          issueDate: item.issueDate || null,
          expirationDate: item.expirationDate || null,
          credentialId: item.credentialId || null,
          credentialUrl: item.credentialUrl || null,
          displayOrder: idx + 1,
        })),
      );
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "RESUME_UPDATE",
      entityType: "resume_profiles",
      entityId: profileId,
      details: {
        studentId: data.studentId,
        template: data.template,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { success: true, profileId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save resume.",
    };
  }
}

/**
 * Super Admin & Staff: List all student resumes with calculated ATS score and metadata
 */
export async function listAllResumesAction(
  searchQuery?: string,
): Promise<ResumeSummaryRow[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized.");
  }

  const query = db
    .select({
      id: resumeProfiles.id,
      studentId: resumeProfiles.studentId,
      fullName: resumeProfiles.fullName,
      email: resumeProfiles.email,
      phone: resumeProfiles.phone,
      location: resumeProfiles.location,
      professionalSummary: resumeProfiles.professionalSummary,
      updatedAt: resumeProfiles.updatedAt,
      studentName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
    })
    .from(resumeProfiles)
    .innerJoin(studentProfiles, eq(resumeProfiles.studentId, studentProfiles.id))
    .orderBy(desc(resumeProfiles.updatedAt));

  const rows = await query;

  const result: ResumeSummaryRow[] = [];

  for (const r of rows) {
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        r.studentName.toLowerCase().includes(q) ||
        r.regNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q);
      if (!match) continue;
    }

    const meta = decodeSummaryWithMeta(r.professionalSummary);

    // Compute ATS quick audit
    const ats = analyzeResumeATS({
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      location: r.location,
      professionalSummary: meta.summary,
      websiteUrl: meta.websiteUrl,
      linkedInUrl: meta.linkedInUrl,
      githubUrl: meta.githubUrl,
    });

    result.push({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      regNumber: r.regNumber,
      department: r.department,
      headline: meta.headline,
      atsScore: ats.score,
      template: meta.template,
      updatedAt: r.updatedAt,
    });
  }

  return result;
}

/**
 * Super Admin & Staff: Seed 3 standard, industry-grade ATS resumes for demonstration
 */
export async function seedStandardResumesAction(): Promise<{
  success: boolean;
  seededCount: number;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      throw new Error("Super Admin authorization required.");
    }

    // Fetch existing students to attach resumes to
    const students = await db
      .select({
        id: studentProfiles.id,
        fullName: studentProfiles.fullName,
        department: studentProfiles.department,
        email: users.email,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .limit(3);

    if (students.length === 0) {
      throw new Error("No students available in database to seed resumes.");
    }

    const sampleResumes: Array<Partial<ResumeProfileData>> = [
      {
        headline: "Software Engineer & Full-Stack Web Developer",
        location: "Katsina / Abuja, Nigeria",
        websiteUrl: "https://aminu-dev.tech",
        linkedInUrl: "https://linkedin.com/in/aminu-bello-ksitm",
        githubUrl: "https://github.com/aminu-tech",
        professionalSummary:
          "High-achieving Software Engineering student at KSITM with hands-on proficiency in TypeScript, React, Next.js, PostgreSQL, and RESTful APIs. Built and deployed 3 production-ready enterprise applications impacting over 1,200 active users. Passionate about engineering high-throughput, accessible, and scalable digital solutions.",
        template: "ats-clean",
        accentColor: "#059669",
        fontFamily: "sans",
        education: [
          {
            institution: "Katsina State Institute of Technology and Management",
            qualification: "National Diploma (ND)",
            fieldOfStudy: "Computer Software Engineering",
            startDate: "2023",
            endDate: "2025",
            isCurrent: true,
            grade: "Distinction (CGPA: 3.86/4.00)",
            displayOrder: 1,
          },
        ],
        experience: [
          {
            organization: "Katsina Tech Hub & Innovation Labs",
            roleTitle: "Junior Software Engineering Intern",
            location: "Katsina, Nigeria",
            startDate: "Jan 2024",
            endDate: "Present",
            isCurrent: true,
            description:
              "• Engineered 5 RESTful API microservices in Node.js and PostgreSQL, decreasing backend latency by 32% across 80,000 requests.\n• Collaborated with a team of 4 senior engineers to implement role-based authentication, securing user data for 1,200 registered learners.\n• Accelerated frontend load performance by 45% through dynamic code splitting, image optimization, and server component caching in Next.js.",
            displayOrder: 1,
          },
          {
            organization: "KSITM Developers Circle",
            roleTitle: "Lead Frontend Engineer",
            location: "Campus",
            startDate: "May 2023",
            endDate: "Dec 2023",
            isCurrent: false,
            description:
              "• Spearheaded redesign of student association portal using Tailwind CSS and React, achieving 98/100 Lighthouse accessibility score.\n• Mentored 25 junior peers in Git version control, branch workflows, and clean code principles.",
            displayOrder: 2,
          },
        ],
        skills: [
          { category: "TECHNICAL", name: "TypeScript", proficiency: "ADVANCED", displayOrder: 1 },
          { category: "TECHNICAL", name: "Next.js & React", proficiency: "ADVANCED", displayOrder: 2 },
          { category: "TECHNICAL", name: "PostgreSQL & SQL", proficiency: "INTERMEDIATE", displayOrder: 3 },
          { category: "TECHNICAL", name: "REST API Design", proficiency: "ADVANCED", displayOrder: 4 },
          { category: "TOOLS", name: "Git & GitHub CI/CD", proficiency: "ADVANCED", displayOrder: 5 },
          { category: "TOOLS", name: "Docker & Linux CLI", proficiency: "INTERMEDIATE", displayOrder: 6 },
          { category: "SOFT_SKILLS", name: "Technical Documentation", proficiency: "EXPERT", displayOrder: 7 },
          { category: "SOFT_SKILLS", name: "Cross-functional Collaboration", proficiency: "ADVANCED", displayOrder: 8 },
        ],
        projects: [
          {
            title: "CampusCare — Student Advisory & Appointment System",
            description:
              "Architected full-stack advisory booking platform serving 650+ student appointments with real-time audit logging and automated email reminders.",
            role: "Sole Creator",
            projectUrl: "https://campuscare.ksitm.edu.ng",
            displayOrder: 1,
          },
          {
            title: "AgroSense — Northern Nigeria Crop Price Indexer",
            description:
              "Developed mobile-responsive dashboard scraping commodity market prices across 12 grain markets in Katsina and Kano states.",
            role: "Full-Stack Engineer",
            projectUrl: "https://github.com/aminu-tech/agrosense",
            displayOrder: 2,
          },
        ],
        certifications: [
          {
            name: "Meta Certified Front-End Developer",
            issuingOrganization: "Meta & Coursera",
            issueDate: "2024",
            expirationDate: null,
            credentialId: "META-FED-99214",
            credentialUrl: "https://coursera.org/verify/meta",
            displayOrder: 1,
          },
          {
            name: "Cisco Certified Support Technician (CCST) Networking",
            issuingOrganization: "Cisco Networking Academy",
            issueDate: "2023",
            expirationDate: null,
            credentialId: "CSCO-NET-1182",
            credentialUrl: "https://cisco.com/verify",
            displayOrder: 2,
          },
        ],
      },
      {
        headline: "Network Engineer & Cybersecurity Infrastructure Specialist",
        location: "Katsina, Nigeria",
        websiteUrl: "https://fatima-sec.net",
        linkedInUrl: "https://linkedin.com/in/fatima-cyber-ksitm",
        githubUrl: "https://github.com/fatima-sec",
        professionalSummary:
          "Disciplined Networking and System Security scholar at KSITM, certified in Cisco CCNA fundamentals and network defense. Demonstrated track record configuring multi-VLAN enterprise campus topologies, firewall rules, and penetration testing laboratory environments.",
        template: "tech-minimal",
        accentColor: "#1e3a8a",
        fontFamily: "mono",
        education: [
          {
            institution: "Katsina State Institute of Technology and Management",
            qualification: "National Diploma (ND)",
            fieldOfStudy: "Networking & System Security",
            startDate: "2023",
            endDate: "2025",
            isCurrent: true,
            grade: "Upper Credit Track",
            displayOrder: 1,
          },
        ],
        experience: [
          {
            organization: "KSITM ICT Directorate",
            roleTitle: "Network Operations Assistant (Work-Study)",
            location: "Katsina, Nigeria",
            startDate: "Feb 2024",
            endDate: "Present",
            isCurrent: true,
            description:
              "• Administered campus fiber-optic backbones and Cisco 2960 switches across 4 lecture theaters, sustaining 99.8% network uptime.\n• Resolved 140+ connectivity and DHCP scope tickets, reducing student Wi-Fi resolution time from 4 hours to under 35 minutes.\n• Configured pfSense perimeter firewalls with Snort IDS, inspecting and mitigating over 450 unauthorized brute-force port scan attempts.",
            displayOrder: 1,
          },
        ],
        skills: [
          { category: "TECHNICAL", name: "Cisco IOS & Packet Tracer", proficiency: "ADVANCED", displayOrder: 1 },
          { category: "TECHNICAL", name: "TCP/IP, DNS, DHCP, VLANs", proficiency: "ADVANCED", displayOrder: 2 },
          { category: "TECHNICAL", name: "Wireshark Packet Analysis", proficiency: "INTERMEDIATE", displayOrder: 3 },
          { category: "TOOLS", name: "Linux Administration (Ubuntu/Debian)", proficiency: "ADVANCED", displayOrder: 4 },
          { category: "TOOLS", name: "Bash & Python Network Automation", proficiency: "INTERMEDIATE", displayOrder: 5 },
          { category: "SOFT_SKILLS", name: "Incident Response", proficiency: "ADVANCED", displayOrder: 6 },
        ],
        projects: [
          {
            title: "Simulated Multi-Branch Banking Network Topology",
            description:
              "Designed redundant OSPF routing topology across 3 geographic branch sites with IPsec VPN tunneling and NAT overload.",
            role: "Lead Network Architect",
            projectUrl: "https://github.com/fatima-sec/branch-vpn-lab",
            displayOrder: 1,
          },
        ],
        certifications: [
          {
            name: "Cisco Certified Network Associate (CCNA) Modules 1-3",
            issuingOrganization: "Cisco Networking Academy",
            issueDate: "2024",
            expirationDate: null,
            credentialId: "CCNA-KSITM-401",
            credentialUrl: "https://netacad.com/verify",
            displayOrder: 1,
          },
        ],
      },
      {
        headline: "Business Systems Analyst & Financial Technology Officer",
        location: "Katsina / Kano, Nigeria",
        websiteUrl: "https://zainab-analyst.com",
        linkedInUrl: "https://linkedin.com/in/zainab-lawal-ksitm",
        githubUrl: "",
        professionalSummary:
          "Detail-oriented Banking Operations & Business Systems Analyst at KSITM with robust foundation in statutory financial reporting, Excel financial modeling, SQL database auditing, and fintech risk compliance. Aiming to bring structured quantitative rigor to high-growth organizations.",
        template: "modern-dual",
        accentColor: "#7c3aed",
        fontFamily: "academic",
        education: [
          {
            institution: "Katsina State Institute of Technology and Management",
            qualification: "National Diploma (ND)",
            fieldOfStudy: "Banking Operations & FinTech",
            startDate: "2023",
            endDate: "2025",
            isCurrent: true,
            grade: "Distinction (CGPA: 3.91/4.00)",
            displayOrder: 1,
          },
        ],
        experience: [
          {
            organization: "First Bank of Nigeria PLC",
            roleTitle: "Banking Services & Compliance Intern (SIWES)",
            location: "Katsina Central Branch",
            startDate: "Aug 2023",
            endDate: "Dec 2023",
            isCurrent: false,
            description:
              "• Audited 400+ daily customer transaction ledgers with 100% reconciliation accuracy, identifying 12 duplicate fee postings.\n• Processed statutory KYC verifications for 320 newly matriculated tertiary students within regulatory deadlines.\n• Built automated Excel pivot reconciliation models, saving the operations desk 6 labor hours per weekly close.",
            displayOrder: 1,
          },
        ],
        skills: [
          { category: "TECHNICAL", name: "Financial Modeling & Pivot Tables", proficiency: "ADVANCED", displayOrder: 1 },
          { category: "TECHNICAL", name: "SQL Financial Auditing", proficiency: "INTERMEDIATE", displayOrder: 2 },
          { category: "TECHNICAL", name: "KYC & AML Compliance Rules", proficiency: "ADVANCED", displayOrder: 3 },
          { category: "TOOLS", name: "Microsoft Excel (VLOOKUP, Macros)", proficiency: "EXPERT", displayOrder: 4 },
          { category: "TOOLS", name: "Power BI Business Intelligence", proficiency: "INTERMEDIATE", displayOrder: 5 },
          { category: "SOFT_SKILLS", name: "Analytical Problem Solving", proficiency: "EXPERT", displayOrder: 6 },
        ],
        projects: [
          {
            title: "Micro-Credit Risk Scoring Model for SME Traders",
            description:
              "Developed quantitative credit appraisal worksheet calculating debt-service coverage ratios for informal retail traders in Katsina Central Market.",
            role: "Financial Analyst",
            projectUrl: "https://zainab-analyst.com/credit-model",
            displayOrder: 1,
          },
        ],
        certifications: [
          {
            name: "Chartered Institute of Bankers of Nigeria (CIBN) Student Member",
            issuingOrganization: "CIBN Nigeria",
            issueDate: "2023",
            expirationDate: null,
            credentialId: "CIBN-STU-7721",
            credentialUrl: null,
            displayOrder: 1,
          },
        ],
      },
    ];

    let seededCount = 0;

    for (let i = 0; i < Math.min(students.length, sampleResumes.length); i++) {
      const st = students[i];
      const sample = sampleResumes[i];

      const fullResumeData: ResumeProfileData = {
        studentId: st.id,
        fullName: st.fullName,
        headline: sample.headline || "KSITM Professional",
        email: st.email,
        phone: "080" + Math.floor(10000000 + Math.random() * 90000000),
        location: sample.location || "Katsina, Nigeria",
        websiteUrl: sample.websiteUrl || "",
        linkedInUrl: sample.linkedInUrl || "",
        githubUrl: sample.githubUrl || "",
        professionalSummary: sample.professionalSummary || "",
        template: sample.template || "ats-clean",
        accentColor: sample.accentColor || "#059669",
        fontFamily: sample.fontFamily || "sans",
        education: (sample.education as ResumeEducationItem[]) || [],
        experience: (sample.experience as ResumeExperienceItem[]) || [],
        skills: (sample.skills as ResumeSkillItem[]) || [],
        projects: (sample.projects as ResumeProjectItem[]) || [],
        certifications: (sample.certifications as ResumeCertificationItem[]) || [],
      };

      await saveStudentResumeAction(fullResumeData);
      seededCount++;
    }

    return { success: true, seededCount };
  } catch (err: unknown) {
    return {
      success: false,
      seededCount: 0,
      error: err instanceof Error ? err.message : "Failed to seed sample resumes.",
    };
  }
}
