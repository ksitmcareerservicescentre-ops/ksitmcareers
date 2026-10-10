export type AssessmentOption = {
  id: string; // "A", "B", "C", "D"
  text: string;
};

export type ObjectiveQuestionData = {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "SCALE_1_5" | "TEXT";
  options: {
    choices: AssessmentOption[];
    correctOption: string;
    explanation?: string;
    points?: number;
  };
  displayOrder: number;
};

export type AssessmentSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  timeLimitMinutes: number;
  passingScore: number;
  isActive: boolean;
  questionCount: number;
  totalAssignments: number;
  completedCount: number;
  averageScore: number | null;
  passRate: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentParticipantRecord = {
  attemptId: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  regNumber: string;
  department: string | null;
  level: string | null;
  email: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED";
  score: number | null;
  passingScore: number;
  passed: boolean | null;
  assignedAt: Date;
  completedAt: Date | null;
  humanRecommendation: string | null;
};

/**
 * Parses raw text containing up to 300 objective questions.
 * Supports formats like:
 * 1. What is an ATS?
 * A) Option 1
 * B) Option 2
 * C) Option 3
 * D) Option 4
 * Answer: B
 * Explanation: Optional explanation text.
 */
export function parseObjectiveQuestionsFromText(rawText: string): ObjectiveQuestionData[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const questions: ObjectiveQuestionData[] = [];

  let currentQuestionText = "";
  let currentChoices: AssessmentOption[] = [];
  let currentCorrect = "A";
  let currentExplanation = "";
  let order = 1;

  function commitCurrentQuestion() {
    if (currentQuestionText.trim() && currentChoices.length >= 2) {
      questions.push({
        questionText: currentQuestionText.trim(),
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [...currentChoices],
          correctOption: currentCorrect.toUpperCase(),
          explanation: currentExplanation.trim() || undefined,
          points: 1,
        },
        displayOrder: order++,
      });
    }
    currentQuestionText = "";
    currentChoices = [];
    currentCorrect = "A";
    currentExplanation = "";
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for Question start: e.g. "1. ...", "Question 1: ...", "Q1) ..."
    const qMatch = line.match(/^(?:(?:\d+[\.\)]|Q\d+[\.:\)]|Question\s+\d+[:\.]?))\s*(.+)$/i);
    if (qMatch) {
      commitCurrentQuestion();
      currentQuestionText = qMatch[1];
      continue;
    }

    // Check for Option: e.g. "A) ...", "A. ...", "[A] ...", "(A) ..."
    const optMatch = line.match(/^[\(\[]?([A-Fa-f])[\)\]\.\:]\s*(.+)$/);
    if (optMatch && currentQuestionText) {
      const letter = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      currentChoices.push({ id: letter, text });
      continue;
    }

    // Check for Answer: e.g. "Answer: B", "Ans: B", "Correct: C"
    const ansMatch = line.match(/^(?:Answer|Ans|Correct\s*Answer|Key)[:\s]+([A-Fa-f])/i);
    if (ansMatch) {
      currentCorrect = ansMatch[1].toUpperCase();
      continue;
    }

    // Check for Explanation: e.g. "Explanation: ..." or "Rationale: ..."
    const expMatch = line.match(/^(?:Explanation|Rationale|Note)[:\s]+(.+)$/i);
    if (expMatch) {
      currentExplanation = expMatch[1].trim();
      continue;
    }

    // Continuation line
    if (currentChoices.length === 0) {
      currentQuestionText += " " + line;
    } else if (currentChoices.length > 0) {
      const last = currentChoices[currentChoices.length - 1];
      last.text += " " + line;
    }
  }

  commitCurrentQuestion();
  return questions.slice(0, 300); // Caps at 300 objective questions
}

/**
 * Converts questions array to plain text format for copy/export.
 */
export function exportObjectiveQuestionsToText(questions: ObjectiveQuestionData[]): string {
  return questions
    .map((q, idx) => {
      const choices = q.options.choices
        .map((c) => `${c.id}) ${c.text}`)
        .join("\n");
      const answer = `Answer: ${q.options.correctOption}`;
      const exp = q.options.explanation ? `\nExplanation: ${q.options.explanation}` : "";
      return `${idx + 1}. ${q.questionText}\n${choices}\n${answer}${exp}`;
    })
    .join("\n\n");
}

/**
 * 20 Verified Institutional Starter Questions (NACE Career Readiness Framework)
 */
export const starterNaceQuestions: ObjectiveQuestionData[] = [
  {
    questionText: "Which NACE Career Readiness competency emphasizes synthesizing information from diverse sources to make reasoned workplace decisions?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Critical Thinking" },
        { id: "B", text: "Communication" },
        { id: "C", text: "Leadership" },
        { id: "D", text: "Technology" },
      ],
      correctOption: "A",
      explanation: "Critical Thinking involves identifying problems, gathering relevant facts, and forming objective judgments.",
      points: 1,
    },
    displayOrder: 1,
  },
  {
    questionText: "What is the primary function of an Applicant Tracking System (ATS) in corporate recruitment?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Designing branded graphical resume templates" },
        { id: "B", text: "Parsing, filtering, and scoring candidate applications against job criteria" },
        { id: "C", text: "Conducting automated psychological video evaluations" },
        { id: "D", text: "Calculating payroll taxes for new hires" },
      ],
      correctOption: "B",
      explanation: "ATS software parses incoming resumes into standard structured fields and matches keywords to rank candidates.",
      points: 1,
    },
    displayOrder: 2,
  },
  {
    questionText: "In the Google 'XYZ' formula for impactful resume bullet points, what does 'Z' represent?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "The zone or department where the work took place" },
        { id: "B", text: "The zero-defect standard achieved" },
        { id: "C", text: "By doing [Z] — the specific actions, methods, or tools applied" },
        { id: "D", text: "The zenith or highest recognition received" },
      ],
      correctOption: "C",
      explanation: "The formula is: Accomplished [X], as measured by [Y], by doing [Z].",
      points: 1,
    },
    displayOrder: 3,
  },
  {
    questionText: "Which behavioral interviewing framework structures answers into Situation, Task, Action, and Result?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "SWOT Analysis" },
        { id: "B", text: "STAR Method" },
        { id: "C", text: "SMART Goals" },
        { id: "D", text: "PESTLE Framework" },
      ],
      correctOption: "B",
      explanation: "The STAR method provides a logical narrative structure for answering behavioral interview questions.",
      points: 1,
    },
    displayOrder: 4,
  },
  {
    questionText: "What is the recommended timeframe to send a personalized follow-up thank-you note after an interview or career fair discussion?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Within 24 hours" },
        { id: "B", text: "After two weeks" },
        { id: "C", text: "Within 10 business days" },
        { id: "D", text: "Immediately before the interview" },
      ],
      correctOption: "A",
      explanation: "Sending a courteous, concise follow-up within 24 hours reinforces interest and keeps you top-of-mind.",
      points: 1,
    },
    displayOrder: 5,
  },
  {
    questionText: "Mark Granovetter's sociological research on 'The Strength of Weak Ties' reveals that most professional opportunities are discovered through:",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Immediate family members and closest friends" },
        { id: "B", text: "Casual acquaintances and secondary network connections" },
        { id: "C", text: "Anonymous automated job scrapers only" },
        { id: "D", text: "Random corporate door-to-door visits" },
      ],
      correctOption: "B",
      explanation: "Weak ties connect individuals to distinct social circles with novel, non-redundant employment information.",
      points: 1,
    },
    displayOrder: 6,
  },
  {
    questionText: "When participating in a Virtual Internship or remote placement, which practice best demonstrates asynchronous professionalism?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Sending repetitive instant messages every 15 minutes" },
        { id: "B", text: "Providing clear written progress summaries, documenting blockers, and meeting agreed deadlines" },
        { id: "C", text: "Working without submitting deliverables until the final day" },
        { id: "D", text: "Never responding to team pull requests or chat threads" },
      ],
      correctOption: "B",
      explanation: "Effective asynchronous communication relies on clear written artifacts, documentation, and predictable cadence.",
      points: 1,
    },
    displayOrder: 7,
  },
  {
    questionText: "Which NACE competency covers navigating diverse workplace cultures and demonstrating respect and equity across team interactions?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Equity & Inclusion" },
        { id: "B", text: "Technology" },
        { id: "C", text: "Financial Stewardship" },
        { id: "D", text: "Supply Chain Management" },
      ],
      correctOption: "A",
      explanation: "Equity & Inclusion emphasizes global and multicultural awareness, empathy, and fair engagement.",
      points: 1,
    },
    displayOrder: 8,
  },
  {
    questionText: "What is an effective pre-appointment strategy before meeting a Career Guidance Officer at KSITM?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "Arriving without a resume draft or defined questions" },
        { id: "B", text: "Bringing current documents, targeted questions, and specific career goals to discuss" },
        { id: "C", text: "Asking the officer to take your certification exams for you" },
        { id: "D", text: "Declining to share your academic department or matriculation number" },
      ],
      correctOption: "B",
      explanation: "Pre-appointment preparation maximizes consultation value and leads to actionable milestones.",
      points: 1,
    },
    displayOrder: 9,
  },
  {
    questionText: "When tailoring an application for a technical role, where should core keywords from the job specification be strategically integrated?",
    questionType: "MULTIPLE_CHOICE",
    options: {
      choices: [
        { id: "A", text: "In tiny 1pt white font hidden in the document header" },
        { id: "B", text: "Naturally within the Professional Summary, Core Skills, and Experience bullet points" },
        { id: "C", text: "Only in the file name of the document" },
        { id: "D", text: "Repeated 50 times in a footer without context" },
      ],
      correctOption: "B",
      explanation: "Keywords must appear naturally in context so both parsing algorithms and human recruiters recognize competence.",
      points: 1,
    },
    displayOrder: 10,
  },
];
