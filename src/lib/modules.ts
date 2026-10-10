export const moduleCatalog = [
  { slug: "readiness", title: "Job Readiness Assessment" },
  { slug: "training", title: "Employability skills training" },
  { slug: "resume", title: "Resume builder" },
  { slug: "internship", title: "Virtual Internship" },
  { slug: "employers", title: "Employer engagement" },
  { slug: "jobs", title: "Job board" },
  { slug: "career-fair", title: "Career Fair Management" },
  { slug: "appointments", title: "Appointment Scheduler" },
] as const;

export type ModuleContent = {
  instructions: string;
  questions: {
    id: string;
    prompt: string;
    type: "TEXT" | "MULTIPLE_CHOICE" | "SCALE_1_5";
    required: boolean;
    options?: string[];
  }[];
  resources: { title: string; url: string }[];
};
export type ModuleStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
export const statusLabels: Record<ModuleStatus, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export type ModuleMetadataInfo = {
  framework: string;
  category: string;
  badge: string;
  description: string;
  requirements: {
    prompts: string;
    format: string;
    resources: string;
    outcome: string;
    estDuration: string;
  };
};

export const moduleMetadata: Record<string, ModuleMetadataInfo> = {
  readiness: {
    framework: "NACE 8 Competencies & Self-Efficacy",
    category: "Diagnostic Core",
    badge: "Readiness Benchmark",
    description: "Evaluates workplace readiness across 8 employer competencies with diagnostic staging.",
    requirements: {
      prompts: "3 Diagnostic Prompts (2 Required)",
      format: "Text Reflection & 1–5 Scale",
      resources: "3 Curated Framework Guides",
      outcome: "Quantified competency baseline & 30-day action plan",
      estDuration: "15–20 Mins",
    },
  },
  training: {
    framework: "Kolb Experiential Cycle & STAR Method",
    category: "Skill Development",
    badge: "Behavioral Mastery",
    description: "Scaffolds high-impact workplace challenge narratives using the STAR behavioral framework.",
    requirements: {
      prompts: "3 Competency Prompts (1 Required)",
      format: "Structured STAR Text & Scale",
      resources: "3 Practical Toolkits & Rubrics",
      outcome: "Articulated interview behavioral proof points",
      estDuration: "20–25 Mins",
    },
  },
  resume: {
    framework: "ATS Compliance & Google XYZ Formula",
    category: "Career Assets",
    badge: "ATS Optimized",
    description: "Crafts recruiter-ready bullet points with measurable impact metrics and ATS keyword alignment.",
    requirements: {
      prompts: "3 Drafting Prompts (1 Required)",
      format: "Target Role Text & XYZ Formula",
      resources: "3 ATS Checklists & Impact Guides",
      outcome: "High-converting summary & quantified achievement inventory",
      estDuration: "25–30 Mins",
    },
  },
  internship: {
    framework: "TELM Remote Placement (Forage Model)",
    category: "Experiential Learning",
    badge: "Industry Simulation",
    description: "Simulates asynchronous workplace projects with client deliverables and domain tooling.",
    requirements: {
      prompts: "3 Placement Prompts (1 Required)",
      format: "Client Brief Analysis & Tooling Stack",
      resources: "3 Virtual Placement Guides",
      outcome: "Demonstrated remote problem-solving & deliverable portfolio",
      estDuration: "30–45 Mins",
    },
  },
  employers: {
    framework: "Granovetter Weak Ties & Bolles Model",
    category: "Professional Networking",
    badge: "Networking Outreach",
    description: "Prepares research-driven employer engagement, 30-second pitches, and informational interviews.",
    requirements: {
      prompts: "3 Strategic Prompts (1 Required)",
      format: "Company Target & 30-Sec Pitch Text",
      resources: "3 Informational Interview Guides",
      outcome: "Actionable recruiter inquiry roadmap & 24hr follow-up",
      estDuration: "15–20 Mins",
    },
  },
  jobs: {
    framework: "Cognitive Information Processing (CIP)",
    category: "Search & Strategy",
    badge: "Opportunity Pipeline",
    description: "Deconstructs employer job postings, extracts core ATS keywords, and maps qualifications.",
    requirements: {
      prompts: "3 Pipeline Prompts (1 Required)",
      format: "Job Posting Deconstruction & Pitch",
      resources: "3 Search & Tracking Guides",
      outcome: "Tailored application strategy & multi-stage pipeline",
      estDuration: "15–20 Mins",
    },
  },
  "career-fair": {
    framework: "Goffman Impression Mgmt & 3-Phase Model",
    category: "Event Strategy",
    badge: "Event Conversion",
    description: "Maximizes career fair ROI through pre-event research, booth pitches, and rapid follow-up.",
    requirements: {
      prompts: "3 Event Prompts (1 Required)",
      format: "Target Booth Selection & Elevator Pitch",
      resources: "3 Career Fair Strategy Guides",
      outcome: "Structured 3-phase fair action plan & recruiter conversion",
      estDuration: "15–20 Mins",
    },
  },
  appointments: {
    framework: "Solution-Focused Counseling (SFCC) & SMART",
    category: "Advisory Coaching",
    badge: "Targeted Coaching",
    description: "Prepares high-yield career advising sessions with structured agendas and milestone accountability.",
    requirements: {
      prompts: "3 Coaching Prompts (1 Required)",
      format: "Session Agenda Focus & Materials Prep",
      resources: "3 Advising Prep Worksheets",
      outcome: "Focused session intake, adviser alignment & SMART milestones",
      estDuration: "10–15 Mins",
    },
  },
};

export function getModuleMeta(slug: string): ModuleMetadataInfo {
  return (
    moduleMetadata[slug] || {
      framework: "Career Readiness Framework",
      category: "Student Activity",
      badge: "Curriculum Standard",
      description: "Interactive professional development activity.",
      requirements: {
        prompts: "Structured Prompts",
        format: "Guided Questions",
        resources: "Curated Resources",
        outcome: "Verified professional competency",
        estDuration: "15–20 Mins",
      },
    }
  );
}

export function parseModuleContent(raw: string): ModuleContent {
  if (raw.length > 100000) throw new Error("Module data must be under 100 KB.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Enter valid JSON. Check commas, quotes and brackets.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Module data must be a JSON object.");
  const item = value as Record<string, unknown>;
  if (typeof item.instructions !== "string" || item.instructions.length > 10000)
    throw new Error("Instructions must be text, up to 10,000 characters.");
  if (!Array.isArray(item.questions) || item.questions.length > 100)
    throw new Error("Provide a questions array with up to 100 questions.");
  const ids = new Set<string>();
  const questions = item.questions.map((entry: unknown) => {
    if (!entry || typeof entry !== "object")
      throw new Error("Every question must be an object.");
    const q = entry as Record<string, unknown>;
    if (
      typeof q.id !== "string" ||
      !/^[a-zA-Z][\w-]{0,63}$/.test(q.id) ||
      ids.has(q.id)
    )
      throw new Error("Question IDs must be unique and start with a letter.");
    ids.add(q.id);
    if (
      typeof q.prompt !== "string" ||
      !q.prompt.trim() ||
      q.prompt.length > 2000
    )
      throw new Error(
        "Each question needs a prompt of up to 2,000 characters.",
      );
    if (
      q.type !== "TEXT" &&
      q.type !== "MULTIPLE_CHOICE" &&
      q.type !== "SCALE_1_5"
    )
      throw new Error(
        "Question type must be TEXT, MULTIPLE_CHOICE or SCALE_1_5.",
      );
    if (typeof q.required !== "boolean")
      throw new Error("Each question needs required: true or false.");
    let options: string[] | undefined;
    if (q.type === "MULTIPLE_CHOICE") {
      if (
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.length > 20 ||
        q.options.some(
          (o) => typeof o !== "string" || !o.trim() || o.length > 300,
        ) ||
        new Set(q.options).size !== q.options.length
      )
        throw new Error(
          "Multiple-choice questions need 2–20 different, non-empty options.",
        );
      options = q.options as string[];
    }
    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      required: q.required,
      ...(options ? { options } : {}),
    } as ModuleContent["questions"][number];
  });
  if (!Array.isArray(item.resources) || item.resources.length > 30)
    throw new Error("Provide a resources array with up to 30 links.");
  const resources = item.resources.map((entry: unknown) => {
    if (!entry || typeof entry !== "object")
      throw new Error("Each resource needs a title and URL.");
    const resource = entry as Record<string, unknown>;
    if (
      typeof resource.title !== "string" ||
      !resource.title.trim() ||
      resource.title.length > 200 ||
      typeof resource.url !== "string" ||
      resource.url.length > 2000
    )
      throw new Error("Each resource needs a title and URL.");
    if (!/^\/(?!\/)/.test(resource.url)) {
      let url: URL;
      try {
        url = new URL(resource.url);
      } catch {
        throw new Error("Resource URLs must use HTTPS or a local /path.");
      }
      if (url.protocol !== "https:" || url.username || url.password)
        throw new Error("Resource URLs must use HTTPS or a local /path.");
    }
    if (resource.url.includes("\\") || /[\u0000-\u001f]/.test(resource.url))
      throw new Error("Invalid resource URL.");
    return { title: resource.title, url: resource.url };
  });
  return { instructions: item.instructions, questions, resources };
}

export function validateAnswers(
  content: ModuleContent,
  input: unknown,
  complete: boolean,
) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Answers must be an object.");
  const answers: Record<string, string> = {};
  const record = input as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) => !content.questions.some((q) => q.id === key),
    )
  )
    throw new Error("An answer does not match this module.");
  for (const q of content.questions) {
    const value = record[q.id] ?? "";
    if (typeof value !== "string" || value.length > 10000)
      throw new Error("Each answer must be text under 10,000 characters.");
    if (complete && q.required && !value.trim())
      throw new Error(`Answer required: ${q.prompt}`);
    if (value && q.type === "MULTIPLE_CHOICE" && !q.options?.includes(value))
      throw new Error(`Choose a listed option for: ${q.prompt}`);
    if (value && q.type === "SCALE_1_5" && !/^[1-5]$/.test(value))
      throw new Error(`Choose 1–5 for: ${q.prompt}`);
    answers[q.id] = value;
  }
  return answers;
}

export function starterContent(slug: string): ModuleContent {
  switch (slug) {
    case "readiness":
      return {
        instructions:
          "Evaluate your professional readiness across core career competencies defined by NACE (National Association of Colleges and Employers) and higher education career standards. This assessment identifies your competitive strengths and priority areas for targeted skill building before entering the job market.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Describe your career goal. Detail your primary target role and industry sector (e.g., Software Engineering in Fintech, Cloud Infrastructure, Data Analysis).",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt:
              "How confident are you about preparing for an interview and presenting your technical and interpersonal skills? (1 = Low, 5 = Highly Confident)",
            type: "SCALE_1_5",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "Critical Thinking & Problem Solving: Rate your ability to analyze complex workplace scenarios, interpret data, and propose sound solutions (1 = Beginning, 5 = Expert).",
            type: "SCALE_1_5",
            required: false,
          },
          {
            id: "question_4",
            prompt:
              "Communication & Professional Expression: Rate your confidence articulating ideas clearly across technical writing, team discussions, and presentations (1 = Beginning, 5 = Expert).",
            type: "SCALE_1_5",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "Teamwork & Cross-functional Collaboration: Rate your capability to build collaborative relationships and work productively within diverse teams (1 = Beginning, 5 = Expert).",
            type: "SCALE_1_5",
            required: false,
          },
          {
            id: "question_6",
            prompt:
              "Digital Technology Fluency: Rate your proficiency in leveraging modern development tools, platforms, and workplace technologies (1 = Beginning, 5 = Expert).",
            type: "SCALE_1_5",
            required: false,
          },
          {
            id: "question_7",
            prompt: "Select your current job readiness stage:",
            type: "MULTIPLE_CHOICE",
            required: false,
            options: [
              "Exploring (Researching career options & requirements)",
              "Developing (Acquiring essential skills & portfolio projects)",
              "Prepared (Portfolio, resume, and pitch ready for applications)",
              "Competitive (Actively interviewing & seeking offers)",
            ],
          },
          {
            id: "question_8",
            prompt:
              "Competency Gap Analysis & 30-Day Plan: Identify 1-2 skills you need to strengthen before entering the job market and detail your specific 30-day action plan.",
            type: "TEXT",
            required: false,
          },
        ],
        resources: [
          {
            title: "NACE Career Readiness Competency Framework",
            url: "https://www.naceweb.org/career-readiness/competencies/career-readiness-defined",
          },
          {
            title: "KSITM Career Advising & Services",
            url: "/services/career-advising",
          },
          {
            title: "Self-Efficacy in Career Transitions Guide",
            url: "https://www.mindtools.com/pages/article/self-efficacy.htm",
          },
        ],
      };

    case "training":
      return {
        instructions:
          "Develop and articulate high-demand workplace competencies using the STAR method (Situation, Task, Action, Result) and Kolb's experiential learning cycle. Practice translating academic projects and practical tasks into compelling evidence of your professional capabilities.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Which core employability competency are you developing in this training cycle?",
            type: "MULTIPLE_CHOICE",
            required: true,
            options: [
              "Critical Problem Solving & Debugging",
              "Collaborative Team Dynamics & Agile Workflows",
              "Professional Written & Verbal Communication",
              "Time Management & Sprint Prioritization",
              "Adaptability & Navigating Ambiguity",
            ],
          },
          {
            id: "question_2",
            prompt:
              "STAR - Situation & Task: Describe a specific academic challenge, team project dilemma, or technical problem you tackled, detailing the context and your objective.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "STAR - Action Taken: Detail the concrete actions, tools, and methodologies you implemented to address the situation. Focus specifically on your individual contribution.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_4",
            prompt:
              "STAR - Result & Reflection: What was the measurable outcome? What did you learn, and how does this experience demonstrate your readiness for an employer?",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "Rate your confidence articulating this STAR experience in a behavioral job interview (1 = Low, 5 = High).",
            type: "SCALE_1_5",
            required: false,
          },
        ],
        resources: [
          {
            title: "STAR Method Behavioral Interview Guide",
            url: "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique",
          },
          {
            title: "KSITM Training Media Center",
            url: "/training",
          },
          {
            title: "NACE Competencies in Action",
            url: "https://www.naceweb.org/career-readiness/competencies",
          },
        ],
      };

    case "resume":
      return {
        instructions:
          "Construct an ATS-optimized, outcome-focused resume tailored to modern recruitment systems. Structure each section with strong action verbs, quantifiable metrics using Google's XYZ formula ('Accomplished [X] measured by [Y] by doing [Z]'), and standardized headings.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Professional Headline & Summary: Write your targeted role title followed by a 3-4 sentence professional summary highlighting your core technical proficiencies and career value proposition.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt:
              "Education & Academic Credentials: List your institution, degree/diploma, major, expected graduation date, relevant coursework, and notable academic honors.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "Core Skills Inventory: List your technical skills (programming languages, frameworks, cloud tools) and professional competencies, formatted as comma-separated keywords for ATS optimization.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_4",
            prompt:
              "Flagship Project / Work Experience (Bullet 1 - XYZ Formula): Write an achievement bullet using: 'Accomplished [X], as measured by [Y], by doing [Z]' with a strong active verb.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "Flagship Project / Work Experience (Bullet 2 - Technical Context): Write a second bullet describing technical implementation, team collaboration, and tools used.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_6",
            prompt:
              "ATS Formatting & Quality Checklist: Select the verification level of your resume draft:",
            type: "MULTIPLE_CHOICE",
            required: false,
            options: [
              "Standard chronological format with clean headings",
              "No tables, text boxes, or graphics that break ATS parsing",
              "All bullets start with strong action verbs and metrics",
              "Full audit completed - Ready for submission",
            ],
          },
        ],
        resources: [
          {
            title: "Harvard University Career Services Resume Guide",
            url: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume",
          },
          {
            title: "Action Verbs for High-Impact Resumes",
            url: "https://www.themuse.com/advice/185-powerful-verbs-that-will-make-your-resume-awesome",
          },
          {
            title: "ATS Optimization Best Practices",
            url: "https://www.jobscan.co/blog/ats-resume",
          },
        ],
      };

    case "internship":
      return {
        instructions:
          "Engage in a structured virtual internship simulation. Document your workplace deliverables, remote collaboration practices, and problem-solving strategies in simulated professional environments modeled after top industry programs.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Internship Program & Host Organization: Name the virtual internship track, host company/simulation provider (e.g., Forage / Virtual Internships / Industry Partner), and your role title.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt: "Select your virtual internship specialization domain:",
            type: "MULTIPLE_CHOICE",
            required: true,
            options: [
              "Software Engineering & Web Development",
              "Data Analysis & Business Intelligence",
              "Cybersecurity & Network Administration",
              "Cloud Infrastructure & DevOps",
              "Digital Product Management & UX/UI",
              "IT Support & Systems Engineering",
            ],
          },
          {
            id: "question_3",
            prompt:
              "Client Brief & Task Objectives: Summarize the primary client brief or problem statement assigned during your virtual placement.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_4",
            prompt:
              "Deliverable Submission & Technical Implementation: Describe the project deliverable you produced (e.g., code repository, architectural diagram, audit report, presentation deck).",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "Rate your confidence managing deliverables and communicating asynchronously in a distributed/remote work environment (1 = Low, 5 = High).",
            type: "SCALE_1_5",
            required: false,
          },
          {
            id: "question_6",
            prompt:
              "Experiential Reflection: What workplace challenge did you encounter while working independently, and how did you resolve it?",
            type: "TEXT",
            required: false,
          },
        ],
        resources: [
          {
            title: "Forage Virtual Work Experience Programs",
            url: "https://www.theforage.com",
          },
          {
            title: "Remote Work Collaboration Standards",
            url: "https://about.gitlab.com/company/culture/all-remote/guide",
          },
          {
            title: "KSITM Internship Placement Services",
            url: "/services/internship-placement",
          },
        ],
      };

    case "employers":
      return {
        instructions:
          "Plan and conduct strategic employer outreach and informational interviews. Expand your professional network, uncover the hidden job market, and articulate your unique value proposition to industry representatives using Granovetter's weak-ties methodology.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Target Employer & Industry Profile: Identify the organization you are engaging with, their core industry focus, and why you selected them.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt:
              "Professional Contact & Channel: Record the name, job title, and platform through which you initiated contact (e.g., LinkedIn, Alumni Directory, Tech Meetup, Career Fair).",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "Tailored 30-Second Elevator Pitch: Draft the concise professional introduction and value proposition you presented to this employer.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_4",
            prompt:
              "Strategic Informational Questions: List 2-3 thoughtful questions you asked regarding their team dynamics, engineering culture, or hiring trajectory.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt: "Current Engagement Stage:",
            type: "MULTIPLE_CHOICE",
            required: false,
            options: [
              "Initial Outreach Sent",
              "Informational Interview Completed",
              "Thank-You Email Sent (within 24 hours)",
              "Added to LinkedIn Network",
              "Referred to Open Position / Hiring Team",
            ],
          },
          {
            id: "question_6",
            prompt:
              "Key Insights & Follow-Up Action: Summarize the most valuable advice or intelligence gathered, along with your planned next step to maintain this professional relationship.",
            type: "TEXT",
            required: false,
          },
        ],
        resources: [
          {
            title: "Stanford Life Design Lab Informational Interviewing Guide",
            url: "https://lifedesignlab.stanford.edu/resources",
          },
          {
            title: "Harvard Business Review: How to Network Authentically",
            url: "https://hbr.org/2016/05/learn-to-love-networking",
          },
          {
            title: "Professional Email & LinkedIn Outreach Templates",
            url: "https://www.themuse.com/advice/the-37-best-networking-email-subject-lines",
          },
        ],
      };

    case "jobs":
      return {
        instructions:
          "Track, deconstruct, and strategically execute job applications. Analyze job postings for ATS keywords, map your qualifications to employer needs, and manage your pipeline from prospect to offer.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Opportunity Overview: Record the job title, employer name, application portal URL, and application deadline.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt: "Application Pipeline Status:",
            type: "MULTIPLE_CHOICE",
            required: true,
            options: [
              "Prospect (Researching & Tailoring)",
              "Applied (Application Submitted)",
              "Screening (Recruiter / Technical Screen)",
              "Interviewing (Technical or Behavioral Rounds)",
              "Offer Received / Accepted",
              "Archived / Learning Retrospective",
            ],
          },
          {
            id: "question_3",
            prompt:
              "Job Specification Keyword Deconstruction: Identify the top 3-5 required technical competencies, software tools, and qualifications prioritized in the job posting.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_4",
            prompt:
              "Qualification Alignment Pitch: How do your specific academic coursework, hands-on projects, or certifications satisfy the employer's core requirements?",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "Tailored Assets & Application Customization: What specific adaptations did you make to your resume and cover letter for this particular position?",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_6",
            prompt:
              "Networking & Follow-Up Strategy: Identify a recruiter or team lead at the company you contacted or plan to connect with to follow up on your submission.",
            type: "TEXT",
            required: false,
          },
        ],
        resources: [
          {
            title: "Modern Job Search Strategy & Pipeline Guide",
            url: "https://www.themuse.com/advice/the-ultimate-guide-to-organizing-your-job-search",
          },
          {
            title: "Deconstructing Job Descriptions for ATS",
            url: "https://www.jobscan.co/blog/how-to-read-a-job-description",
          },
          {
            title: "KSITM Job Placement Services",
            url: "/services/job-placement",
          },
        ],
      };

    case "career-fair":
      return {
        instructions:
          "Maximize your outcomes at campus and industry career fairs. Navigate the complete 3-phase lifecycle: pre-fair company research, day-of pitch delivery and dialogue, and 24-48 hour post-fair conversion.",
        questions: [
          {
            id: "question_1",
            prompt:
              "Career Fair Event Profile: Name the career fair, host institution/organization, date, and venue format (In-Person or Virtual).",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_2",
            prompt:
              "Tier-1 Priority Employer Targets: List your top 3 target companies attending the fair, including the specific open roles they are recruiting for.",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "Elevator Pitch (Career Fair Edition): Draft the 45-60 second introduction you delivered (or prepared) for booth recruiters, linking your background to their company mission.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_4",
            prompt:
              "Booth Debrief & Contacts Collected: Record the recruiter names, notes from conversations, and specific application instructions or referral links received.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt: "Career Fair Execution Milestones Completed:",
            type: "MULTIPLE_CHOICE",
            required: false,
            options: [
              "Company Research Completed Prior to Event",
              "Elevator Pitch Delivered to Target Employers",
              "Booth Notes & Business Cards Recorded",
              "Personalized LinkedIn Follow-Ups Sent within 24 Hours",
              "Formal Job Applications Submitted",
            ],
          },
          {
            id: "question_6",
            prompt:
              "Rate your overall confidence presenting yourself to recruiters at this career fair (1 = Low, 5 = High).",
            type: "SCALE_1_5",
            required: false,
          },
        ],
        resources: [
          {
            title: "National Career Development Association Career Fair Prep",
            url: "https://www.ncda.org",
          },
          {
            title: "Career Fair 60-Second Elevator Pitch Guide",
            url: "https://careerservices.fas.harvard.edu/resources/how-to-talk-to-employers-at-career-fairs",
          },
          {
            title: "Post-Career Fair Follow-Up Email Templates",
            url: "https://www.themuse.com/advice/the-postcareer-fair-followup-email-you-should-send-every-single-time",
          },
        ],
      };

    case "appointments":
      return {
        instructions:
          "Prepare for and capitalize on one-on-one career advising consultations. Define your session agenda in advance, capture expert feedback, and establish a SMART action plan (Specific, Measurable, Achievable, Relevant, Time-bound).",
        questions: [
          {
            id: "question_1",
            prompt: "Primary Focus Area for Career Advising Consultation:",
            type: "MULTIPLE_CHOICE",
            required: true,
            options: [
              "Career Exploration & Pathway Assessment",
              "Resume & Cover Letter Critique",
              "Mock Interview & Technical Screening Prep",
              "Job Search & Networking Strategy",
              "Internship Search & Placement Advisory",
              "Graduate School & Certification Planning",
            ],
          },
          {
            id: "question_2",
            prompt:
              "Pre-Session Intake & Agenda: What specific questions, obstacles, or career decisions do you want to address with your career adviser?",
            type: "TEXT",
            required: true,
          },
          {
            id: "question_3",
            prompt:
              "Preparation & Materials Brought: Detail the documents or links reviewed during the consultation (e.g., current resume, job posting link, portfolio, LinkedIn profile).",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_4",
            prompt:
              "Adviser Guidance & Key Takeaways: Summarize the core feedback, strategic suggestions, and insights provided by your adviser.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_5",
            prompt:
              "SMART Action Plan: Formulate 2-3 specific, measurable, achievable, relevant, and time-bound action steps you will execute based on this session.",
            type: "TEXT",
            required: false,
          },
          {
            id: "question_6",
            prompt:
              "Rate how effectively this advising session clarified your career path and immediate next steps (1 = Low, 5 = High).",
            type: "SCALE_1_5",
            required: false,
          },
        ],
        resources: [
          {
            title: "KSITM Career Advising Services & Appointments",
            url: "/services/career-advising",
          },
          {
            title: "SMART Career Goal Setting Framework",
            url: "https://www.mindtools.com/pages/article/smart-goals.htm",
          },
          {
            title: "Maximizing Career Counseling Sessions Guide",
            url: "https://www.naceweb.org/career-development/best-practices",
          },
        ],
      };

    default:
      return {
        instructions:
          "Complete the activities below and save your progress. Submit when you have finished.",
        questions: [],
        resources: [],
      };
  }
}

