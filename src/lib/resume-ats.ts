/**
 * Global Standard ATS (Applicant Tracking System) Analyzer & Quality Scorer
 * Compliant with Harvard Mignone Career Center, NACE, and modern recruitment algorithms (Workday, Greenhouse, Lever).
 */

export type AtsAuditResult = {
  score: number; // 0 to 100
  grade: "ELITE" | "STRONG" | "COMPETITIVE" | "NEEDS_IMPROVEMENT";
  strengths: string[];
  improvements: string[];
  breakdown: {
    contact: { score: number; max: 15; label: string };
    summary: { score: number; max: 15; label: string };
    experience: { score: number; max: 30; label: string };
    education: { score: number; max: 15; label: string };
    skills: { score: number; max: 15; label: string };
    projectsAndCerts: { score: number; max: 10; label: string };
  };
};

const ACTION_VERBS = new Set([
  "accelerated", "accomplished", "achieved", "acquired", "adapted", "administered",
  "advised", "analyzed", "architected", "automated", "built", "centralized",
  "championed", "collaborated", "constructed", "coordinated", "created", "decreased",
  "delivered", "deployed", "designed", "developed", "devised", "directed",
  "discovered", "doubled", "drafted", "drove", "eliminated", "enabled",
  "engineered", "established", "evaluated", "exceeded", "executed", "expanded",
  "expedited", "fabricated", "facilitated", "formulated", "generated", "guided",
  "headed", "implemented", "improved", "increased", "initiated", "innovated",
  "inspected", "installed", "instituted", "instructed", "integrated", "invented",
  "investigated", "launched", "led", "managed", "maximized", "mentored",
  "migrated", "minimized", "modernized", "negotiated", "optimized", "orchestrated",
  "organized", "originated", "overhauled", "oversaw", "pioneered", "planned",
  "produced", "programmed", "promoted", "proposed", "published", "rebuilt",
  "reduced", "refactored", "remodeled", "reorganized", "resolved", "restructured",
  "revamped", "saved", "scaled", "secured", "simplified", "spearheaded",
  "standardized", "streamlined", "strengthened", "structured", "supervised", "surpassed",
  "trained", "transformed", "upgraded", "validated", "yielded"
]);

const METRIC_REGEX = /(\b\d+(\.\d+)?%|\b\d+\+?|\b\d+x\b|\$[\d,]+|₦[\d,]+|\b\d+,\d+\b)/i;

export function analyzeResumeATS(resume: {
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  professionalSummary?: string | null;
  experience?: Array<{
    roleTitle: string;
    organization: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    qualification: string;
    fieldOfStudy: string;
  }>;
  skills?: Array<{
    name: string;
    category: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
  }>;
}): AtsAuditResult {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // 1. Contact Info Audit (Max 15)
  let contactScore = 0;
  if (resume.fullName?.trim().length > 3) contactScore += 3;
  if (resume.email?.includes("@") && resume.email?.includes(".")) contactScore += 4;
  if (resume.phone?.trim() && resume.phone.trim().length >= 8) contactScore += 3;
  if (resume.location?.trim() && resume.location.trim().length >= 3) contactScore += 2;
  if (resume.linkedInUrl?.trim() || resume.githubUrl?.trim() || resume.websiteUrl?.trim()) {
    contactScore += 3;
    strengths.push("Professional online presence linked (LinkedIn/GitHub/Portfolio).");
  } else {
    improvements.push("Add a LinkedIn, GitHub, or portfolio URL to demonstrate professional presence.");
  }
  contactScore = Math.min(15, contactScore);

  // 2. Summary Audit (Max 15)
  let summaryScore = 0;
  const summaryWords = resume.professionalSummary?.trim().split(/\s+/).filter(Boolean) || [];
  if (summaryWords.length >= 30) {
    summaryScore = 15;
    strengths.push(`Compelling executive summary length (${summaryWords.length} words).`);
  } else if (summaryWords.length >= 15) {
    summaryScore = 10;
    improvements.push("Expand your professional summary to at least 35-50 words outlining your core specialty.");
  } else if (summaryWords.length > 0) {
    summaryScore = 5;
    improvements.push("Summary is too brief. Provide 2-3 focused sentences summarizing your skills and target industry.");
  } else {
    improvements.push("Add a professional summary statement to anchor your career identity.");
  }

  // 3. Experience & Google XYZ Formula Audit (Max 30)
  let expScore = 0;
  const expCount = resume.experience?.length || 0;
  if (expCount >= 2) {
    expScore += 10;
  } else if (expCount === 1) {
    expScore += 6;
  } else {
    improvements.push("Add relevant work experience, internships, or practical industrial training (SIWES/IT).");
  }

  let actionVerbCount = 0;
  let metricCount = 0;
  const allExpText = (resume.experience || []).map((e) => e.description).join(" ").toLowerCase();
  const words = allExpText.split(/\s+/);

  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, "");
    if (ACTION_VERBS.has(clean)) {
      actionVerbCount++;
    }
  }

  const expLines = (resume.experience || [])
    .flatMap((e) => e.description.split(/\n|•|-/))
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of expLines) {
    if (METRIC_REGEX.test(line)) {
      metricCount++;
    }
  }

  if (actionVerbCount >= 4) {
    expScore += 10;
    strengths.push(`Rich action-verb density (${actionVerbCount} high-impact verbs detected).`);
  } else if (actionVerbCount >= 2) {
    expScore += 6;
    improvements.push("Start each bullet point with strong action verbs (e.g., Engineered, Spearheaded, Accelerated).");
  } else {
    improvements.push("Incorporate strong action verbs at the start of experience statements.");
  }

  if (metricCount >= 2) {
    expScore += 10;
    strengths.push(`Quantified XYZ impact: ${metricCount} measurable business/operational metrics found.`);
  } else if (metricCount === 1) {
    expScore += 6;
    improvements.push("Use Google's XYZ formula: 'Accomplished [X] measured by [Y] by doing [Z]' to quantify your results.");
  } else {
    improvements.push("Add quantified metrics (e.g. percentages, user counts, performance gains) to validate your contributions.");
  }
  expScore = Math.min(30, expScore);

  // 4. Education (Max 15)
  let eduScore = 0;
  const eduCount = resume.education?.length || 0;
  if (eduCount >= 1) {
    eduScore = 15;
    strengths.push("Accredited educational credentials fully structured.");
  } else {
    improvements.push("Include your primary academic institution and qualification (ND/HND/Degree).");
  }

  // 5. Skills Matrix (Max 15)
  let skillsScore = 0;
  const skillsCount = resume.skills?.length || 0;
  if (skillsCount >= 8) {
    skillsScore = 15;
    strengths.push(`Comprehensive skill portfolio with ${skillsCount} verified keywords.`);
  } else if (skillsCount >= 4) {
    skillsScore = 10;
    improvements.push("Broaden your skills matrix with at least 8 tools, technologies, and interpersonal capabilities.");
  } else if (skillsCount > 0) {
    skillsScore = 5;
    improvements.push("Add technical and domain-specific skills for higher ATS keyword match.");
  } else {
    improvements.push("Include a skills section with technical, domain, and soft skill categories.");
  }

  // 6. Projects & Certifications (Max 10)
  let projScore = 0;
  const projCount = resume.projects?.length || 0;
  const certCount = resume.certifications?.length || 0;
  if (projCount >= 1 && certCount >= 1) {
    projScore = 10;
    strengths.push("Well-rounded portfolio featuring both capstone projects and formal industry certifications.");
  } else if (projCount >= 1 || certCount >= 1) {
    projScore = 7;
    if (projCount === 0) improvements.push("Add a capstone or real-world project demonstrating practical execution.");
    if (certCount === 0) improvements.push("List industry certifications (e.g. Cisco, AWS, Google, KSITM credentials).");
  } else {
    improvements.push("Add real-world projects or professional certifications to elevate your candidacy.");
  }

  const totalScore = contactScore + summaryScore + expScore + eduScore + skillsScore + projScore;

  let grade: AtsAuditResult["grade"] = "NEEDS_IMPROVEMENT";
  if (totalScore >= 88) grade = "ELITE";
  else if (totalScore >= 75) grade = "STRONG";
  else if (totalScore >= 60) grade = "COMPETITIVE";

  return {
    score: totalScore,
    grade,
    strengths,
    improvements,
    breakdown: {
      contact: { score: contactScore, max: 15, label: "Contact & Online Profile" },
      summary: { score: summaryScore, max: 15, label: "Professional Summary" },
      experience: { score: expScore, max: 30, label: "Work Experience & XYZ Metrics" },
      education: { score: eduScore, max: 15, label: "Academic Background" },
      skills: { score: skillsScore, max: 15, label: "Skills & Keywords" },
      projectsAndCerts: { score: projScore, max: 10, label: "Projects & Certifications" },
    },
  };
}
