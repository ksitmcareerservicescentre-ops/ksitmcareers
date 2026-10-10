import { ObjectiveQuestionData } from "./assessments";

export type SeedAssessmentInput = {
  title: string;
  slug: string;
  description: string;
  category: string;
  timeLimitMinutes: number;
  passingScore: number;
  isActive: boolean;
  questions: ObjectiveQuestionData[];
};

export const fiveSeedAssessments: SeedAssessmentInput[] = [
  // =========================================================================
  // ASSESSMENT 1: NACE 8 Core Competencies & Workplace Diagnostic (20 Obj)
  // =========================================================================
  {
    title: "NACE 8 Core Competencies & Workplace Diagnostic",
    slug: "nace-core-competencies-diagnostic",
    description:
      "Evaluates student proficiency across the 8 National Association of Colleges and Employers (NACE) career readiness standards: Critical Thinking, Communication, Teamwork, Technology, Leadership, Professionalism, Career & Self-Development, and Equity & Inclusion.",
    category: "Diagnostic Core",
    timeLimitMinutes: 30,
    passingScore: 70,
    isActive: true,
    questions: [
      {
        questionText: "Which NACE competency focuses on gathering and evaluating diverse information to make objective, reasoned decisions?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Critical Thinking" },
            { id: "B", text: "Communication" },
            { id: "C", text: "Technology" },
            { id: "D", text: "Leadership" },
          ],
          correctOption: "A",
          explanation: "Critical Thinking involves identifying problems, evaluating options, and synthesizing information.",
          points: 1,
        },
        displayOrder: 1,
      },
      {
        questionText: "In active listening within a workplace team, what is the primary objective of paraphrasing a colleague's point?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To delay making your own counter-argument" },
            { id: "B", text: "To confirm mutual understanding before proceeding" },
            { id: "C", text: "To prove superior vocabulary over the speaker" },
            { id: "D", text: "To interrupt the meeting cadence" },
          ],
          correctOption: "B",
          explanation: "Paraphrasing verifies comprehension and builds psychological safety in team communication.",
          points: 1,
        },
        displayOrder: 2,
      },
      {
        questionText: "Under the NACE Teamwork competency, how should conflict between two project collaborators be professionally addressed?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Publicly assign blame on the team chat channel" },
            { id: "B", text: "Focus directly on shared project objectives and collaborative compromise" },
            { id: "C", text: "Ignore the disagreement until the deliverable fails" },
            { id: "D", text: "Unilaterally replace team members without dialogue" },
          ],
          correctOption: "B",
          explanation: "Constructive teamwork focuses on task outcomes rather than interpersonal friction.",
          points: 1,
        },
        displayOrder: 3,
      },
      {
        questionText: "Which behavior best reflects the NACE Career & Self-Development competency?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Waiting exclusively for managers to direct your learning schedule" },
            { id: "B", text: "Proactively identifying skill gaps and seeking out mentorship and certifications" },
            { id: "C", text: "Assuming academic diplomas remain valid without continuous learning" },
            { id: "D", text: "Avoiding difficult project assignments" },
          ],
          correctOption: "B",
          explanation: "Career self-development requires self-awareness, continual skill acquisition, and deliberate growth.",
          points: 1,
        },
        displayOrder: 4,
      },
      {
        questionText: "What does the NACE Professionalism competency mandate when an employee realizes an agreed project deadline will be missed?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Notify stakeholders early, outline current progress, and propose a remediation timeline" },
            { id: "B", text: "Turn off communication channels until the work is finished" },
            { id: "C", text: "Blame technical tooling or departmental peers" },
            { id: "D", text: "Submit incomplete or fabricated deliverables without notice" },
          ],
          correctOption: "A",
          explanation: "Professional accountability prioritizes transparent, early communication and solutions-oriented planning.",
          points: 1,
        },
        displayOrder: 5,
      },
      {
        questionText: "Which scenario represents exemplary application of the NACE Equity & Inclusion competency?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Assuming all team members possess identical cultural norms and communication preferences" },
            { id: "B", text: "Creating space for diverse perspectives and actively soliciting input from all collaborators" },
            { id: "C", text: "Disregarding accessibility standards in internal software deliverables" },
            { id: "D", text: "Forming exclusive social cliques within the department" },
          ],
          correctOption: "B",
          explanation: "Equity & Inclusion values multicultural understanding and intentional participation across team members.",
          points: 1,
        },
        displayOrder: 6,
      },
      {
        questionText: "In the NACE Technology framework, an employee who demonstrates ethical digital literacy will:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Upload confidential customer databases to unverified public AI models" },
            { id: "B", text: "Leverage digital tools while strictly adhering to data security, privacy, and institutional policies" },
            { id: "C", text: "Refuse to adopt collaborative cloud tooling" },
            { id: "D", text: "Share team administrative credentials over unencrypted emails" },
          ],
          correctOption: "B",
          explanation: "Technological competency includes data security governance and responsible digital tool usage.",
          points: 1,
        },
        displayOrder: 7,
      },
      {
        questionText: "Which leadership behavior exemplifies servant leadership within an institutional project?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Taking sole public credit for team members' innovative output" },
            { id: "B", text: "Removing operational roadblocks and empowering team members to excel in their deliverables" },
            { id: "C", text: "Micromanaging every task down to the minute" },
            { id: "D", text: "Isolating leadership decisions from team feedback" },
          ],
          correctOption: "B",
          explanation: "Servant leadership focuses on team enablement, shared vision, and removing barriers to collective success.",
          points: 1,
        },
        displayOrder: 8,
      },
      {
        questionText: "When communicating technical findings to executive non-technical leadership, what is the most effective approach?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Use dense technical jargon to establish technical authority" },
            { id: "B", text: "Translate technical concepts into business outcomes, strategic risks, and clear recommendations" },
            { id: "C", text: "Present unformatted raw database logs" },
            { id: "D", text: "Avoid providing executive summaries" },
          ],
          correctOption: "B",
          explanation: "Effective communication tailors tone and vocabulary to the audience's decision-making context.",
          points: 1,
        },
        displayOrder: 9,
      },
      {
        questionText: "Which of the following is considered an ethical breach under workplace professionalism?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Declining a meeting when double-booked after communicating notice" },
            { id: "B", text: "Misrepresenting credential qualifications or work experience on an internal promotion review" },
            { id: "C", text: "Asking for feedback after completing a complex milestone" },
            { id: "D", text: "Documenting process guidelines for future team members" },
          ],
          correctOption: "B",
          explanation: "Misrepresentation undermines institutional trust and violates core professional integrity standards.",
          points: 1,
        },
        displayOrder: 10,
      },
      {
        questionText: "What role does psychological safety play in cross-functional workplace teams?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "It prevents team members from expressing disagreement entirely" },
            { id: "B", text: "It allows members to take creative risks, ask questions, and admit errors without fear of punishment" },
            { id: "C", text: "It eliminates all performance review accountability" },
            { id: "D", text: "It mandates daily physical meetings" },
          ],
          correctOption: "B",
          explanation: "Psychological safety empowers team members to speak candidly, accelerating innovation and learning.",
          points: 1,
        },
        displayOrder: 11,
      },
      {
        questionText: "In project management, how does a critical path analysis assist team leaders?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "By identifying the sequence of dependent tasks that determines the minimum project completion time" },
            { id: "B", text: "By calculating the individual salaries of all team contractors" },
            { id: "C", text: "By monitoring individual browser tabs during work hours" },
            { id: "D", text: "By eliminating the requirement for milestones" },
          ],
          correctOption: "A",
          explanation: "Critical path analysis pinpoints bottleneck tasks that directly govern overall project duration.",
          points: 1,
        },
        displayOrder: 12,
      },
      {
        questionText: "Which digital workplace behavior demonstrates high emotional intelligence (EQ)?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Sending inflammatory emails in ALL CAPS when frustrated" },
            { id: "B", text: "Pausing before responding to critique, acknowledging the perspective, and maintaining constructive tone" },
            { id: "C", text: "Excluding colleagues from project updates after a disagreement" },
            { id: "D", text: "Responding defensively to code review comments" },
          ],
          correctOption: "B",
          explanation: "Emotional self-regulation and empathetic communication are cornerstones of high emotional intelligence.",
          points: 1,
        },
        displayOrder: 13,
      },
      {
        questionText: "When evaluating data sources during a critical thinking exercise, what indicates high source credibility?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Sensationalist clickbait headlines on social media" },
            { id: "B", text: "Peer-reviewed research, verifiable methodology, and clear author credentials" },
            { id: "C", text: "Anonymous commentary on unverified forums" },
            { id: "D", text: "Articles lacking dates, references, or cited sources" },
          ],
          correctOption: "B",
          explanation: "Credible sources demonstrate transparency in methodology, evidence, and subject-matter expertise.",
          points: 1,
        },
        displayOrder: 14,
      },
      {
        questionText: "What is an effective strategy for developing cross-cultural competence in an international or hybrid work environment?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Assuming your own local idioms and humor translate universally" },
            { id: "B", text: "Curiously learning about collaborators' cultural backgrounds, time zones, and working preferences" },
            { id: "C", text: "Insisting all colleagues adopt your specific holiday calendar" },
            { id: "D", text: "Avoiding communication with foreign branch offices" },
          ],
          correctOption: "B",
          explanation: "Cross-cultural agility requires proactive curiosity, respect, and adaptive communication.",
          points: 1,
        },
        displayOrder: 15,
      },
      {
        questionText: "In personal branding and professional networking, an 'elevator pitch' is ideally designed to:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Recite your entire life biography in 15 minutes" },
            { id: "B", text: "Deliver a compelling 30–60 second summary of your value proposition, background, and career aspirations" },
            { id: "C", text: "Demand an immediate hiring commitment from senior executives" },
            { id: "D", text: "Explain detailed grievances with previous academic mentors" },
          ],
          correctOption: "B",
          explanation: "An elevator pitch concisely conveys who you are, what you offer, and what you aim to achieve.",
          points: 1,
        },
        displayOrder: 16,
      },
      {
        questionText: "Which documentation practice best supports institutional continuity and team handover?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Retaining key architectural knowledge solely in your personal memory" },
            { id: "B", text: "Authoring clear, up-to-date Standard Operating Procedures (SOPs) and README guidelines" },
            { id: "C", text: "Encrypting project repositories with personal recovery keys" },
            { id: "D", text: "Deleting git commit messages before leaving an organization" },
          ],
          correctOption: "B",
          explanation: "Clear documentation ensures knowledge transfer, organizational resilience, and smooth onboarding.",
          points: 1,
        },
        displayOrder: 17,
      },
      {
        questionText: "What distinguishes constructive feedback from destructive criticism?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Constructive feedback focuses on specific observable behaviors and actionable improvement paths" },
            { id: "B", text: "Constructive feedback attacks the individual's core character traits" },
            { id: "C", text: "Constructive feedback is always delivered anonymously in public forums" },
            { id: "D", text: "Constructive feedback contains no actionable recommendations" },
          ],
          correctOption: "A",
          explanation: "Constructive feedback emphasizes objective behaviors, impact, and concrete suggestions for growth.",
          points: 1,
        },
        displayOrder: 18,
      },
      {
        questionText: "Under the NACE Career Readiness framework, demonstrating initiative involves:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Refusing to assist peers unless given financial compensation" },
            { id: "B", text: "Identifying organizational opportunities, proposing proactive solutions, and taking responsible action" },
            { id: "C", text: "Executing only the bare minimum contractual tasks without engagement" },
            { id: "D", text: "Bypassing safety protocols to finish tasks early" },
          ],
          correctOption: "B",
          explanation: "Initiative reflects proactive problem-solving, anticipation of needs, and positive agency.",
          points: 1,
        },
        displayOrder: 19,
      },
      {
        questionText: "Which final step ensures an institutional project milestone is properly concluded?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Immediately closing all project tickets without verification" },
            { id: "B", text: "Conducting a blameless project retrospective to document learnings, celebrate wins, and archive deliverables" },
            { id: "C", text: "Erasing communication logs to save disk space" },
            { id: "D", text: "Abandoning stakeholder check-ins" },
          ],
          correctOption: "B",
          explanation: "Retrospectives institutionalize continuous improvement and celebrate team accomplishments.",
          points: 1,
        },
        displayOrder: 20,
      },
    ],
  },

  // =========================================================================
  // ASSESSMENT 2: Technical Aptitude & Systems Problem Solving (20 Obj)
  // =========================================================================
  {
    title: "Technical Aptitude & Systems Problem Solving",
    slug: "technical-aptitude-problem-solving",
    description:
      "Evaluates analytical thinking, algorithmic reasoning, software systems lifecycle, database integrity, and structured troubleshooting protocols required for IT and software careers.",
    category: "Technical Aptitude",
    timeLimitMinutes: 40,
    passingScore: 70,
    isActive: true,
    questions: [
      {
        questionText: "In algorithmic complexity analysis, what does Big-O notation characterize?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "The exact clock runtime in milliseconds on a specific CPU architecture" },
            { id: "B", text: "The upper bound asymptotic growth rate of an algorithm as input size scales towards infinity" },
            { id: "C", text: "The physical memory size of the server hard drive" },
            { id: "D", text: "The number of lines of source code in the function" },
          ],
          correctOption: "B",
          explanation: "Big-O models the mathematical upper bound on execution time or space relative to input size N.",
          points: 1,
        },
        displayOrder: 1,
      },
      {
        questionText: "What is the primary benefit of enforcing database normalization (e.g. 3NF) in relational systems?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Increasing data redundancy across every table" },
            { id: "B", text: "Eliminating data anomalies, minimizing redundancy, and preserving referential integrity" },
            { id: "C", text: "Allowing SQL queries to execute without WHERE clauses" },
            { id: "D", text: "Encrypting all network packets automatically" },
          ],
          correctOption: "B",
          explanation: "Normalization organizes tables to reduce redundant data and prevent insert/update/delete anomalies.",
          points: 1,
        },
        displayOrder: 2,
      },
      {
        questionText: "In RESTful API design, which HTTP method is explicitly defined as idempotent?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "POST" },
            { id: "B", text: "PUT" },
            { id: "C", text: "PATCH (in standard non-idempotent implementations)" },
          ],
          correctOption: "B",
          explanation: "PUT is idempotent: multiple identical PUT requests produce the exact same server resource state.",
          points: 1,
        },
        displayOrder: 3,
      },
      {
        questionText: "When troubleshooting an unexpected runtime crash in a production service, the first recommended step is to:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Immediately rewrite the entire codebase from scratch" },
            { id: "B", text: "Inspect server error logs, stack traces, and monitoring telemetry to isolate the failure point" },
            { id: "C", text: "Delete the database indexes" },
            { id: "D", text: "Turn off firewall security settings" },
          ],
          correctOption: "B",
          explanation: "Systematic troubleshooting begins with telemetry and error log inspection to formulate testable hypotheses.",
          points: 1,
        },
        displayOrder: 4,
      },
      {
        questionText: "What does the ACID acronym stand for in transactional database systems?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Atomicity, Consistency, Isolation, Durability" },
            { id: "B", text: "Asynchronous, Concurrent, Indexed, Distributed" },
            { id: "C", text: "Authentication, Cryptography, Integrity, Decryption" },
          ],
          correctOption: "A",
          explanation: "ACID guarantees that database transactions are executed reliably and maintain data consistency.",
          points: 1,
        },
        displayOrder: 5,
      },
      {
        questionText: "In version control (Git), what is the purpose of creating a separate feature branch?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To permanently lock the main repository from other contributors" },
            { id: "B", text: "To isolate new changes, enabling peer code reviews and automated testing before integration" },
            { id: "C", text: "To bypass automated continuous integration (CI) pipelines" },
            { id: "D", text: "To avoid writing git commit messages" },
          ],
          correctOption: "B",
          explanation: "Feature branches isolate work-in-progress code from production and enable clean pull request workflows.",
          points: 1,
        },
        displayOrder: 6,
      },
      {
        questionText: "Which cybersecurity practice mitigates Cross-Site Scripting (XSS) vulnerabilities in web applications?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Storing administrative passwords in local browser storage" },
            { id: "B", text: "Sanitizing and contextual encoding of all untrusted user inputs before rendering" },
            { id: "C", text: "Disabling HTTPS encryption certificates" },
            { id: "D", text: "Removing Content Security Policy (CSP) headers" },
          ],
          correctOption: "B",
          explanation: "Contextual encoding and HTML entity sanitization prevent injected malicious scripts from executing in browsers.",
          points: 1,
        },
        displayOrder: 7,
      },
      {
        questionText: "What is the primary role of a reverse proxy (e.g. NGINX, Cloudflare) in modern application architectures?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To design user interface icons" },
            { id: "B", text: "To handle SSL termination, load balancing, caching, and request routing across backend servers" },
            { id: "C", text: "To write SQL migrations automatically" },
          ],
          correctOption: "B",
          explanation: "Reverse proxies sit in front of web servers to distribute traffic, terminate SSL, and improve performance.",
          points: 1,
        },
        displayOrder: 8,
      },
      {
        questionText: "In software engineering, what is the principle of 'Separation of Concerns' (SoC)?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Combining business logic, UI rendering, and database queries into a single massive file" },
            { id: "B", text: "Modularizing code into distinct sections, where each module addresses a specific responsibility" },
            { id: "C", text: "Refusing to document API contracts between microservices" },
          ],
          correctOption: "B",
          explanation: "Separation of concerns improves code maintainability, testability, and reduces cognitive load.",
          points: 1,
        },
        displayOrder: 9,
      },
      {
        questionText: "Which data structure follows the First-In, First-Out (FIFO) access paradigm?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Stack" },
            { id: "B", text: "Queue" },
            { id: "C", text: "Binary Search Tree" },
            { id: "D", text: "Hash Map" },
          ],
          correctOption: "B",
          explanation: "A Queue operates on FIFO principles: elements inserted first are dequeued first.",
          points: 1,
        },
        displayOrder: 10,
      },
      {
        questionText: "What distinguishes synchronous execution from asynchronous execution in modern runtimes?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Synchronous operations block execution until complete; asynchronous operations allow non-blocking concurrency" },
            { id: "B", text: "Asynchronous code can only run on magnetic tape drives" },
            { id: "C", text: "Synchronous operations always execute faster regardless of I/O latency" },
          ],
          correctOption: "A",
          explanation: "Asynchronous I/O yields the thread while waiting for network or disk operations, preventing server thread lockup.",
          points: 1,
        },
        displayOrder: 11,
      },
      {
        questionText: "What is the primary function of a Database Index (e.g. B-Tree index)?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To increase table storage size without performance impact" },
            { id: "B", text: "To accelerate search query lookups by maintaining a sorted reference pointer structure" },
            { id: "C", text: "To prevent users from logging into the database" },
          ],
          correctOption: "B",
          explanation: "Indexes avoid costly sequential table scans by organizing pointers into logarithmic lookup trees.",
          points: 1,
        },
        displayOrder: 12,
      },
      {
        questionText: "In Continuous Integration / Continuous Deployment (CI/CD) pipelines, what is the role of automated unit tests?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To replace manual code reviews entirely" },
            { id: "B", text: "To rapidly verify that isolated logic units satisfy specifications and catch regression errors before deployment" },
            { id: "C", text: "To format CSS styles in production" },
          ],
          correctOption: "B",
          explanation: "Automated unit tests validate discrete software behaviors and protect against unintended regressions.",
          points: 1,
        },
        displayOrder: 13,
      },
      {
        questionText: "Which HTTP status code signifies that a client lacks authenticated credentials to access a requested resource?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "200 OK" },
            { id: "B", text: "401 Unauthorized" },
            { id: "C", text: "404 Not Found" },
            { id: "D", text: "500 Internal Server Error" },
          ],
          correctOption: "B",
          explanation: "HTTP 401 Unauthorized indicates that the request has not been applied because it lacks valid authentication.",
          points: 1,
        },
        displayOrder: 14,
      },
      {
        questionText: "What is the purpose of hashing passwords with salting (e.g. bcrypt, argon2) before database persistence?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To allow administrators to easily decrypt user passwords in plain text" },
            { id: "B", text: "To protect passwords from rainbow table attacks and ensure one-way mathematical irreversible storage" },
            { id: "C", text: "To speed up user login times" },
          ],
          correctOption: "B",
          explanation: "Salting and cryptographic one-way hashing render stored passwords resilient against dictionary and offline cracking.",
          points: 1,
        },
        displayOrder: 15,
      },
      {
        questionText: "When evaluating software architecture, what is 'High Cohesion and Low Coupling'?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Modules have tightly focused internal responsibilities and minimal interdependence on other modules" },
            { id: "B", text: "Every class in the codebase directly calls every other class" },
            { id: "C", text: "All database tables are merged into one generic key-value store" },
          ],
          correctOption: "A",
          explanation: "High cohesion keeps related logic together; low coupling prevents cascading failures across subsystems.",
          points: 1,
        },
        displayOrder: 16,
      },
      {
        questionText: "What is an SQL Injection vulnerability and how is it reliably prevented?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Malicious SQL commands injected via input; prevented using parameterized queries and prepared statements" },
            { id: "B", text: "Database server hardware failure; prevented by purchasing larger RAM sticks" },
            { id: "C", text: "A styling bug in HTML; prevented by using CSS flexbox" },
          ],
          correctOption: "A",
          explanation: "Parameterized queries separate SQL code from untrusted data parameters, rendering injections impossible.",
          points: 1,
        },
        displayOrder: 17,
      },
      {
        questionText: "In software testing, what is the difference between black-box testing and white-box testing?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Black-box tests functionality without internal code knowledge; white-box tests internal structure and logic paths" },
            { id: "B", text: "Black-box is for dark mode themes; white-box is for light mode themes" },
            { id: "C", text: "White-box testing is performed exclusively by end users" },
          ],
          correctOption: "A",
          explanation: "Black-box focuses on inputs and outputs; white-box verifies control flows, branches, and internal logic.",
          points: 1,
        },
        displayOrder: 18,
      },
      {
        questionText: "What is the purpose of rate limiting in API and application security?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To prevent server resource exhaustion, brute-force attacks, and DoS abuse by capping requests per client window" },
            { id: "B", text: "To slow down paying customers' network connections" },
            { id: "C", text: "To randomly discard database records" },
          ],
          correctOption: "A",
          explanation: "Rate limiting caps traffic volume to preserve uptime and protect authentication endpoints from brute force.",
          points: 1,
        },
        displayOrder: 19,
      },
      {
        questionText: "Which metric is the most reliable indicator of software reliability in production?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Mean Time Between Failures (MTBF) and Service Level Objective (SLO) error budget burn rate" },
            { id: "B", text: "The total number of commits pushed on weekends" },
            { id: "C", text: "The length of developer email messages" },
          ],
          correctOption: "A",
          explanation: "MTBF and SLO error budgets provide quantifiable measurements of operational uptime and stability.",
          points: 1,
        },
        displayOrder: 20,
      },
    ],
  },

  // =========================================================================
  // ASSESSMENT 3: ATS Resume Optimization & Career Branding Exam (20 Obj)
  // =========================================================================
  {
    title: "ATS Resume Optimization & Career Branding Exam",
    slug: "ats-resume-optimization-branding",
    description:
      "Evaluates student capability to design ATS-compliant resumes, craft quantified XYZ impact metrics, index industry keywords, and establish compelling professional profiles.",
    category: "Career Assets",
    timeLimitMinutes: 30,
    passingScore: 70,
    isActive: true,
    questions: [
      {
        questionText: "Which visual design element is known to corrupt Applicant Tracking System (ATS) parsing engines?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Complex multi-column tables, text boxes, and nested graphics" },
            { id: "B", text: "Standard bullet points using standard unicode characters" },
            { id: "C", text: "Clean reverse-chronological section headers" },
            { id: "D", text: "Clear margin spacing of 0.75 to 1 inch" },
          ],
          correctOption: "A",
          explanation: "Tables and text boxes often cause ATS parsers to read text out of order or discard content entirely.",
          points: 1,
        },
        displayOrder: 1,
      },
      {
        questionText: "In Google's 'XYZ' resume bullet formula, which component anchors measurable business impact?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Accomplished [X]" },
            { id: "B", text: "As measured by [Y]" },
            { id: "C", text: "By doing [Z]" },
          ],
          correctOption: "B",
          explanation: "'As measured by [Y]' provides the quantifiable metric (percentages, revenue, time savings, volume).",
          points: 1,
        },
        displayOrder: 2,
      },
      {
        questionText: "How should an entry-level candidate structure their resume experience section when transitioning from academia?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Leave it empty until a full-time corporate role is attained" },
            { id: "B", text: "Highlight capstone projects, lab coursework, internships, and freelance deliverables with tangible outcomes" },
            { id: "C", text: "Invent fictional corporate titles" },
            { id: "D", text: "List high school hobby clubs from 10 years ago" },
          ],
          correctOption: "B",
          explanation: "Academic capstones and projects demonstrate practical applied skills and problem-solving capability.",
          points: 1,
        },
        displayOrder: 3,
      },
      {
        questionText: "What is the recommended file format for general resume submissions unless explicitly directed otherwise?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Clean PDF or standard Microsoft Word (.docx)" },
            { id: "B", text: "Bitmap image (.bmp)" },
            { id: "C", text: "Executable file (.exe)" },
            { id: "D", text: "Adobe Photoshop (.psd)" },
          ],
          correctOption: "A",
          explanation: "Modern ATS platforms parse text-layer PDFs and .docx files with highest fidelity and layout preservation.",
          points: 1,
        },
        displayOrder: 4,
      },
      {
        questionText: "Why is 'keyword stuffing' (hidden white text) penalized by modern recruitment systems?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Parsers extract all text indiscriminately, exposing the manipulation to recruiter review interfaces" },
            { id: "B", text: "White text causes the server hardware to overheat" },
            { id: "C", text: "It is required for every engineering candidate" },
          ],
          correctOption: "A",
          explanation: "ATS parsing extracts raw text into recruiter review screens, immediately exposing hidden text and disqualifying candidates.",
          points: 1,
        },
        displayOrder: 5,
      },
      {
        questionText: "What distinguishes an effective Professional Summary from an outdated Objective Statement?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "A summary articulates what value the candidate offers the employer; an objective focuses on what the candidate wants" },
            { id: "B", text: "An objective statement is always 5 pages long" },
            { id: "C", text: "There is no difference between the two" },
          ],
          correctOption: "A",
          explanation: "Summaries focus on employer value proposition, core proficiencies, and career accomplishments.",
          points: 1,
        },
        displayOrder: 6,
      },
      {
        questionText: "Which action verb conveys strongest ownership and leadership impact?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Helped with" },
            { id: "B", text: "Orchestrated" },
            { id: "C", text: "Was responsible for" },
            { id: "D", text: "Handled" },
          ],
          correctOption: "B",
          explanation: "'Orchestrated' communicates decisive leadership, coordination, and proactive project ownership.",
          points: 1,
        },
        displayOrder: 7,
      },
      {
        questionText: "Where should technical tools (e.g. Git, Python, SQL, Docker) appear on a technical resume?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Only in the document footer" },
            { id: "B", text: "In a dedicated Skills inventory and reinforced within bullet points describing how they were applied" },
            { id: "C", text: "Solely as clickable external web hyperlinks" },
          ],
          correctOption: "B",
          explanation: "Categorized skills sections optimize parser indexing, while experiential bullets demonstrate practical mastery.",
          points: 1,
        },
        displayOrder: 8,
      },
      {
        questionText: "What is the recommended page length for a recent polytechnic or university graduate resume?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "1 concise, high-impact page (maximum 2 pages for extensive project portfolios)" },
            { id: "B", text: "5 to 7 detailed pages" },
            { id: "C", text: "A single index card" },
          ],
          correctOption: "A",
          explanation: "Recruiters spend 6–10 seconds on initial screening; single-page resumes ensure rapid clarity.",
          points: 1,
        },
        displayOrder: 9,
      },
      {
        questionText: "How should dates of employment and education be formatted for optimal parser extraction?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Written in Roman numerals" },
            { id: "B", text: "Consistent Month Year format (e.g. 'Jan 2024 – Present' or '01/2024 – 06/2025')" },
            { id: "C", text: "Omitted completely" },
          ],
          correctOption: "B",
          explanation: "Standard month/year syntax ensures accurate chronology calculation in parsing databases.",
          points: 1,
        },
        displayOrder: 10,
      },
      {
        questionText: "Which contact detail is standard on a modern professional resume?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Full home address including street number, postal box, and house color" },
            { id: "B", text: "Full Name, Phone Number, Professional Email, City/State, and LinkedIn or GitHub URL" },
            { id: "C", text: "Date of birth, marital status, and passport photograph" },
          ],
          correctOption: "B",
          explanation: "City/state, professional email, phone, and professional links provide necessary contact info while protecting privacy.",
          points: 1,
        },
        displayOrder: 11,
      },
      {
        questionText: "What is an effective strategy for aligning your resume with a specific job posting?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Copying and pasting the entire job advert into the resume summary" },
            { id: "B", text: "Analyzing required qualifications and naturally integrating matching keywords into your genuine achievements" },
            { id: "C", text: "Submitting the same generic resume to 500 companies without tailoring" },
          ],
          correctOption: "B",
          explanation: "Tailoring keywords demonstrates authentic alignment with the employer's operational requirements.",
          points: 1,
        },
        displayOrder: 12,
      },
      {
        questionText: "Why should personal photos and demographic data (marital status, religion) be omitted on professional resumes?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To prevent subconscious hiring bias and ensure compliance with institutional equal opportunity standards" },
            { id: "B", text: "Because photo files crash the recruitment company's servers" },
            { id: "C", text: "Because candidates are not allowed to have photos" },
          ],
          correctOption: "A",
          explanation: "Omitting demographic photos protects candidates against bias and conforms to professional global hiring standards.",
          points: 1,
        },
        displayOrder: 13,
      },
      {
        questionText: "Which bullet point demonstrates superior impact?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Responsible for updating website pages" },
            { id: "B", text: "Redesigned portal navigation using Next.js and Tailwind, reducing page load latency by 35% across 2,000 monthly users" },
            { id: "C", text: "Worked hard on front-end coding tasks" },
          ],
          correctOption: "B",
          explanation: "Option B follows Google's XYZ formula: action, tooling, and quantified performance outcome.",
          points: 1,
        },
        displayOrder: 14,
      },
      {
        questionText: "In LinkedIn optimization, what is the role of the profile Headline?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Simply stating 'Student at KSITM'" },
            { id: "B", text: "Crafting a searchable title highlighting your specialization, core tech skills, and target value proposition" },
            { id: "C", text: "Listing your favourite sports team" },
          ],
          correctOption: "B",
          explanation: "Headlines are indexed heavily in recruiter search algorithms; descriptive keywords maximize search visibility.",
          points: 1,
        },
        displayOrder: 15,
      },
      {
        questionText: "How should soft skills (e.g. teamwork, communication) be validated on a resume?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Listing 'Excellent Communicator' 10 times in a bullet list" },
            { id: "B", text: "Demonstrating them through concrete achievements (e.g. 'Coordinated 5-engineer team to deliver capstone on schedule')" },
            { id: "C", text: "Using graphical progress bars indicating 'Communication: 95%'" },
          ],
          correctOption: "B",
          explanation: "Evidencing soft skills through behavioral narratives proves competence far more credibly than isolated buzzwords.",
          points: 1,
        },
        displayOrder: 16,
      },
      {
        questionText: "Why are graphical progress bars or star ratings for skills (e.g. 'Python: 4/5 stars') discouraged on resumes?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "They are arbitrary, confuse parsing systems, and highlight self-perceived deficiency" },
            { id: "B", text: "Because 5 stars is too low for entry-level developers" },
            { id: "C", text: "Recruiters only accept 10-star systems" },
          ],
          correctOption: "A",
          explanation: "Skill meters lack standardized benchmarks, cannot be parsed by ATS engines, and signal arbitrary self-assessment.",
          points: 1,
        },
        displayOrder: 17,
      },
      {
        questionText: "What should be included when referencing GitHub or portfolio links on a technical resume?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Clean, curated repositories with comprehensive README files, architectural overviews, and live deployment links" },
            { id: "B", text: "Dozens of empty repositories with default initial commits" },
            { id: "C", text: "Broken links without commit activity" },
          ],
          correctOption: "A",
          explanation: "Recruiters inspect code structure, documentation, and live demonstrations to verify real-world competence.",
          points: 1,
        },
        displayOrder: 18,
      },
      {
        questionText: "How should candidate certifications (e.g. AWS, CompTIA, Cisco) be recorded?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Under a dedicated Certifications section with issuing body, credential title, and validation date/ID" },
            { id: "B", text: "Vaguely mentioned inside the hobbies section" },
            { id: "C", text: "Omitted until in-person interview rounds" },
          ],
          correctOption: "A",
          explanation: "Specific certification titles and verification credentials build instant institutional credibility.",
          points: 1,
        },
        displayOrder: 19,
      },
      {
        questionText: "What is the final quality assurance step before dispatching an application?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Thorough spell-check, ATS plain-text parsing test, checking hyperlinks, and verifying contact details" },
            { id: "B", text: "Renaming the document 'untitled_resume_final_v3_copy.pdf'" },
            { id: "C", text: "Sending the file without review" },
          ],
          correctOption: "A",
          explanation: "Rigorous proofreading and link validation eliminate careless errors that lead to immediate rejection.",
          points: 1,
        },
        displayOrder: 20,
      },
    ],
  },

  // =========================================================================
  // ASSESSMENT 4: STAR Behavioral Interview & Professional Communication Exam (20 Obj)
  // =========================================================================
  {
    title: "STAR Behavioral Interview & Professional Communication Exam",
    slug: "star-behavioral-interview-communication",
    description:
      "Evaluates student capability to structure behavioral interview answers, navigate technical objection handling, articulate impact under pressure, and conduct professional follow-ups.",
    category: "Interview Mastery",
    timeLimitMinutes: 30,
    passingScore: 70,
    isActive: true,
    questions: [
      {
        questionText: "In the STAR interviewing method, what is the specific role of the 'Task' component?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Describing the general weather and office layout" },
            { id: "B", text: "Clarifying the specific objective, requirement, or challenge you were accountable for solving" },
            { id: "C", text: "Listing the company's financial profit margins" },
            { id: "D", text: "Explaining what other people failed to do" },
          ],
          correctOption: "B",
          explanation: "The Task pinpoints the concrete responsibility or milestone you were assigned to accomplish.",
          points: 1,
        },
        displayOrder: 1,
      },
      {
        questionText: "When an interviewer asks: 'Tell me about a time you failed', what is their true evaluative intent?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To disqualify you immediately for admitting human error" },
            { id: "B", text: "To assess your self-awareness, accountability, resilience, and capacity to learn from mistakes" },
            { id: "C", text: "To hear gossip about former managers" },
          ],
          correctOption: "B",
          explanation: "Interviewers evaluate whether you take responsibility, learn lessons, and apply improvements.",
          points: 1,
        },
        displayOrder: 2,
      },
      {
        questionText: "What proportion of time should be spent on the 'Action' phase of a STAR response?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "10% — focus almost entirely on describing the background problem" },
            { id: "B", text: "60–70% — thoroughly highlighting your specific decisions, execution, and tooling" },
            { id: "C", text: "0% — skip straight to the conclusion" },
          ],
          correctOption: "B",
          explanation: "Interviewers hire your actions; dedicating the majority of time to what YOU did demonstrates competency.",
          points: 1,
        },
        displayOrder: 3,
      },
      {
        questionText: "When responding to behavioral questions, why should candidates avoid using passive 'We did' language exclusively?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Because teamwork is discouraged in all modern organizations" },
            { id: "B", text: "Because the recruiter needs to evaluate your individual contribution and specific decision-making" },
            { id: "C", text: "Because English grammar forbids the word 'we'" },
          ],
          correctOption: "B",
          explanation: "While acknowledging collaboration, candidates must clarify their specific role and actions ('I designed...', 'I implemented...').",
          points: 1,
        },
        displayOrder: 4,
      },
      {
        questionText: "What is an effective strategy when asked a difficult technical question you do not know the answer to?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Fabricate an imaginary technical library with confidence" },
            { id: "B", text: "Transparently acknowledge the gap, articulate how you would research it, and explain analogous knowledge" },
            { id: "C", text: "End the interview call abruptly" },
          ],
          correctOption: "B",
          explanation: "Honesty and structured problem-solving demonstrate intellectual humility and real engineering aptitude.",
          points: 1,
        },
        displayOrder: 5,
      },
      {
        questionText: "At the conclusion of an interview when asked: 'Do you have any questions for us?', the best response is:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "'No, your website covered everything.'" },
            { id: "B", text: "Ask 2–3 thoughtful questions about team culture, technical roadmap, or success metrics for the role" },
            { id: "C", text: "Ask strictly how many vacation days you can take in the first month" },
          ],
          correctOption: "B",
          explanation: "Insightful questions reflect genuine intellectual engagement, preparation, and professional seriousness.",
          points: 1,
        },
        displayOrder: 6,
      },
      {
        questionText: "In virtual video interviews, which technical setup ensures professional presentation?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Camera positioned at eye-level, stable internet, clean background, and clear headset microphone" },
            { id: "B", text: "Backlit lighting making your face a dark silhouette" },
            { id: "C", text: "Taking the interview from a noisy outdoor market" },
          ],
          correctOption: "A",
          explanation: "Eye-level camera framing, good lighting, and clear audio prevent distraction and project executive presence.",
          points: 1,
        },
        displayOrder: 7,
      },
      {
        questionText: "What is an effective response to the question: 'What is your greatest weakness?'",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "'I am a perfectionist and work too hard.'" },
            { id: "B", text: "Name a genuine non-fatal developmental area, share your awareness, and explain proactive steps you are taking to overcome it" },
            { id: "C", text: "'I have no weaknesses whatsoever.'" },
          ],
          correctOption: "B",
          explanation: "Authentic self-awareness paired with tangible growth steps demonstrates maturity and coachability.",
          points: 1,
        },
        displayOrder: 8,
      },
      {
        questionText: "How should an unexpected behavioral conflict with a supervisor be framed during an interview?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Describing the supervisor with hostile derogatory language" },
            { id: "B", text: "Framing the situation as differing professional perspectives, focusing on respectful dialogue and constructive alignment" },
            { id: "C", text: "Refusing to answer the question" },
          ],
          correctOption: "B",
          explanation: "Maintaining professional discretion and focusing on collaborative resolution signals high diplomatic maturity.",
          points: 1,
        },
        displayOrder: 9,
      },
      {
        questionText: "What is the primary benefit of conducting an Informational Interview with an industry practitioner?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Demanding they hand you a job offer on the spot" },
            { id: "B", text: "Gaining insider domain insights, learning organizational culture, and cultivating professional relationships" },
            { id: "C", text: "Asking them for financial loans" },
          ],
          correctOption: "B",
          explanation: "Informational interviews expand knowledge, build weak-tie networks, and clarify career paths.",
          points: 1,
        },
        displayOrder: 10,
      },
      {
        questionText: "What does the 'R' in STAR stand for, and why is it vital?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Remuneration — discussing payment expectations" },
            { id: "B", text: "Result — articulating the measurable outcome, impact, and lessons learned from your action" },
            { id: "C", text: "Resignation — explaining why you quit" },
          ],
          correctOption: "B",
          explanation: "The Result proves that your actions produced quantifiable value and institutional progress.",
          points: 1,
        },
        displayOrder: 11,
      },
      {
        questionText: "When asked to explain a technical concept to a non-technical stakeholder, what technique is most effective?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Utilizing relatable real-world analogies and focusing on user benefits rather than syntax" },
            { id: "B", text: "Reading raw compiler error logs word-for-word" },
            { id: "C", text: "Speaking louder in technical terminology" },
          ],
          correctOption: "A",
          explanation: "Analogies bridge the knowledge gap and allow stakeholders to grasp architectural value.",
          points: 1,
        },
        displayOrder: 12,
      },
      {
        questionText: "What is the recommended protocol when an interview offer or rejection is received?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Reply with a courteous, professional note expressing gratitude for their time and consideration" },
            { id: "B", text: "Send an angry response demanding explanations" },
            { id: "C", text: "Ghost all further communications" },
          ],
          correctOption: "A",
          explanation: "Graceful correspondence maintains positive reputation and keeps doors open for future opportunities.",
          points: 1,
        },
        displayOrder: 13,
      },
      {
        questionText: "During salary and compensation discussions, what is best practice for early-career candidates?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "State an unrealistic arbitrary number without market research" },
            { id: "B", text: "Research verified industry benchmarks for your location, express flexibility, and focus on total compensation" },
            { id: "C", text: "Insist on knowing the CEO's personal stock options immediately" },
          ],
          correctOption: "B",
          explanation: "Informed, benchmarked discussions establish market awareness and constructive negotiation posture.",
          points: 1,
        },
        displayOrder: 14,
      },
      {
        questionText: "Which non-verbal communication behavior establishes credibility in technical interviews?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Consistent engaged eye contact with the camera, calm posture, and active nodding" },
            { id: "B", text: "Slouching and looking at your phone during the interviewer's speech" },
            { id: "C", text: "Staring blankly away from the screen" },
          ],
          correctOption: "A",
          explanation: "Non-verbal engagement projects confidence, active listening, and sincere presence.",
          points: 1,
        },
        displayOrder: 15,
      },
      {
        questionText: "How should you prepare for behavioral interviews before meeting the employer?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Prepare and practice 4–6 versatile STAR stories covering teamwork, problem solving, leadership, and failure" },
            { id: "B", text: "Rely purely on spontaneous improvisation without reviewing past projects" },
            { id: "C", text: "Memorize scripts word-for-word so you sound like an automated robotic voice" },
          ],
          correctOption: "A",
          explanation: "Versatile STAR story outlines allow natural, structured responses across varied interview questions.",
          points: 1,
        },
        displayOrder: 16,
      },
      {
        questionText: "In a group or panel interview, how should you distribute your attention when responding?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Speak solely to the person who asked, ignoring the other panelists" },
            { id: "B", text: "Address the asking panelist, but engage and make eye contact with all committee members" },
            { id: "C", text: "Only address the panelist with the most senior title" },
          ],
          correctOption: "B",
          explanation: "Engaging the full committee recognizes shared consensus and fosters collective rapport.",
          points: 1,
        },
        displayOrder: 17,
      },
      {
        questionText: "What is an effective way to handle an interviewer who interrupts your answer?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Politely pause, actively listen to their redirection, and seamlessly adapt your response" },
            { id: "B", text: "Shout over them to finish your prepared paragraph" },
            { id: "C", text: "Show visible irritation" },
          ],
          correctOption: "A",
          explanation: "Adaptability and poise under redirection demonstrate active collaboration and grace.",
          points: 1,
        },
        displayOrder: 18,
      },
      {
        questionText: "What is the primary objective of a 'case study' or technical scenario question?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "To assess your structured problem-solving thought process, assumptions, and communication clarity" },
            { id: "B", text: "To trick you into providing free consulting software" },
            { id: "C", text: "To test your typing speed in text editors" },
          ],
          correctOption: "A",
          explanation: "Case studies reveal how you break down complex ambiguity into logical, solvable components.",
          points: 1,
        },
        displayOrder: 19,
      },
      {
        questionText: "Within what timeframe should a post-interview thank you email be transmitted?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Within 24 hours of the interview concluding" },
            { id: "B", text: "After two months" },
            { id: "C", text: "Never — it appears desperate" },
          ],
          correctOption: "A",
          explanation: "A prompt, customized 24-hour follow-up note reinforces interest and demonstrates professional punctuality.",
          points: 1,
        },
        displayOrder: 20,
      },
    ],
  },

  // =========================================================================
  // ASSESSMENT 5: Workplace Ethics, Leadership & Remote Placement Readiness (20 Obj)
  // =========================================================================
  {
    title: "Workplace Ethics, Leadership & Remote Placement Readiness",
    slug: "workplace-ethics-remote-readiness",
    description:
      "Evaluates institutional integrity, professional ethics, asynchronous remote work discipline, cybersecurity hygiene, intellectual property governance, and team leadership.",
    category: "Professional Ethics",
    timeLimitMinutes: 30,
    passingScore: 70,
    isActive: true,
    questions: [
      {
        questionText: "When working in an asynchronous remote internship, what is the best practice for daily standups?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Provide a concise written update detailing: what was completed, what is planned today, and any active blockers" },
            { id: "B", text: "Assume silence signals that everything is progressing well" },
            { id: "C", text: "Send 50 voice notes throughout the night" },
            { id: "D", text: "Refuse to post status updates until the final sprint review" },
          ],
          correctOption: "A",
          explanation: "Asynchronous standups keep distributed teams aligned and surface blockers proactively.",
          points: 1,
        },
        displayOrder: 1,
      },
      {
        questionText: "What constitutes an intellectual property (IP) infringement in a corporate software environment?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Copying proprietary code or trade secrets from a former employer into your current organization's repository" },
            { id: "B", text: "Using permissible open-source libraries under MIT or Apache 2.0 licenses with proper attribution" },
            { id: "C", text: "Writing original documentation for company APIs" },
          ],
          correctOption: "A",
          explanation: "Incorporating unauthorized proprietary code violates IP law and creates severe legal liability.",
          points: 1,
        },
        displayOrder: 2,
      },
      {
        questionText: "If an employee accidentally exposes sensitive customer data in a public repository, the ethical requirement is to:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Delete the repository quietly and pretend the breach never occurred" },
            { id: "B", text: "Immediately revoke exposed keys, report the incident to security leads, and assist remediation" },
            { id: "C", text: "Blame another intern" },
          ],
          correctOption: "B",
          explanation: "Integrity requires immediate incident escalation, key revocation, and transparent mitigation.",
          points: 1,
        },
        displayOrder: 3,
      },
      {
        questionText: "In cybersecurity hygiene, why should employees avoid using corporate credentials on personal third-party accounts?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Credential reuse allows third-party breaches to compromise the internal institutional network" },
            { id: "B", text: "Corporate email addresses cannot be entered on external websites" },
            { id: "C", text: "It causes the keyboard to lock" },
          ],
          correctOption: "A",
          explanation: "Credential stuffing exploits reused passwords across disparate services to infiltrate corporate networks.",
          points: 1,
        },
        displayOrder: 4,
      },
      {
        questionText: "How should an employee handle receiving confidential commercial information about a rival firm sent by mistake?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Share it with company sales directors to undercut competitors" },
            { id: "B", text: "Notify the sender, do not distribute or read further, and consult corporate legal counsel" },
            { id: "C", text: "Post it on social media" },
          ],
          correctOption: "B",
          explanation: "Ethical standards mandate prompt notification and non-exploitation of misdirected confidential data.",
          points: 1,
        },
        displayOrder: 5,
      },
      {
        questionText: "What does 'whistleblower protection' ensure within public and corporate governance?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Protects individuals who report unlawful or unethical institutional conduct from retaliation and dismissal" },
            { id: "B", text: "Allows employees to steal physical office equipment without consequence" },
            { id: "C", text: "Grants immunity from writing code tests" },
          ],
          correctOption: "A",
          explanation: "Whistleblower governance safeguards ethical reporters against retaliatory termination.",
          points: 1,
        },
        displayOrder: 6,
      },
      {
        questionText: "When working in remote time zones with team members across the globe, an inclusive collaborator will:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Rotate meeting times equitably and default to rich asynchronous documentation" },
            { id: "B", text: "Always force overseas colleagues to attend meetings at 3:00 AM" },
            { id: "C", text: "Ignore feedback from remote team members" },
          ],
          correctOption: "A",
          explanation: "Equitable meeting scheduling and asynchronous documentation create an inclusive global workplace.",
          points: 1,
        },
        displayOrder: 7,
      },
      {
        questionText: "What is an appropriate response when a colleague is subjected to discriminatory or harassing remarks in a team chat?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Laugh along to maintain social standing" },
            { id: "B", text: "Intervene constructively, support the colleague, and report the behavior through official HR channels" },
            { id: "C", text: "Forward the harassment to external forums" },
          ],
          correctOption: "B",
          explanation: "Active bystander intervention and formal reporting uphold institutional anti-harassment standards.",
          points: 1,
        },
        displayOrder: 8,
      },
      {
        questionText: "Which practice protects employee ergonomics and prevents burnout during extended remote work?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Working 20 consecutive hours without leaving bed" },
            { id: "B", text: "Establishing a dedicated workspace, ergonomic posture, regular screen breaks, and clear work/life boundaries" },
            { id: "C", text: "Refusing to sleep during delivery sprints" },
          ],
          correctOption: "B",
          explanation: "Healthy physical ergonomics and boundaries ensure sustained productivity and prevent occupational fatigue.",
          points: 1,
        },
        displayOrder: 9,
      },
      {
        questionText: "Under professional ethical codes, how should potential conflicts of interest be handled?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Conceal outside financial interests from management" },
            { id: "B", text: "Formally disclose secondary business affiliations or familial connections to leadership and recuse from related decisions" },
            { id: "C", text: "Award vendor contracts exclusively to your personal business" },
          ],
          correctOption: "B",
          explanation: "Transparent disclosure and recusal prevent compromised decision-making and ethical violations.",
          points: 1,
        },
        displayOrder: 10,
      },
      {
        questionText: "What does the 'Principle of Least Privilege' (PoLP) dictate in system security administration?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Users and processes should only receive the minimum access permissions necessary to perform their legitimate job functions" },
            { id: "B", text: "All users should have root administrative privileges by default" },
            { id: "C", text: "No user should have access to any system ever" },
          ],
          correctOption: "A",
          explanation: "Least privilege minimizes the blast radius of potential compromises and operational errors.",
          points: 1,
        },
        displayOrder: 11,
      },
      {
        questionText: "In professional correspondence, why is it critical to verify recipient email addresses before sending sensitive attachments?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Auto-complete algorithms frequently substitute similar names, risking accidental data breaches to external parties" },
            { id: "B", text: "Email servers will permanently delete files if the address is typed quickly" },
            { id: "C", text: "Recipients cannot open attachments unless their middle name is included" },
          ],
          correctOption: "A",
          explanation: "Double-checking recipient addresses prevents unintentional disclosures of proprietary or personal data.",
          points: 1,
        },
        displayOrder: 12,
      },
      {
        questionText: "What constitutes 'phishing' and how should an employee respond upon receiving a suspicious link?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Social engineering to steal credentials; report to IT security immediately without clicking any links or attachments" },
            { id: "B", text: "A routine database maintenance script; enter your corporate password immediately" },
            { id: "C", text: "A harmless marketing promotion; forward it to all company employees" },
          ],
          correctOption: "A",
          explanation: "Phishing deceives targets into surrendering credentials; isolating and reporting protects the entire perimeter.",
          points: 1,
        },
        displayOrder: 13,
      },
      {
        questionText: "How should team members handle intellectual disagreements regarding software architecture?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Engage in data-driven discussion, evaluate trade-offs objectively, and commit fully once a team consensus or decision is reached" },
            { id: "B", text: "Sabotage the chosen architecture in protest" },
            { id: "C", text: "Refuse to write tests for the chosen architecture" },
          ],
          correctOption: "A",
          explanation: "'Disagree and commit' ensures rigorous technical debate followed by unified team alignment and execution.",
          points: 1,
        },
        displayOrder: 14,
      },
      {
        questionText: "What is an organization's 'Acceptable Use Policy' (AUP)?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "A legal policy detailing permitted and prohibited uses of institutional technology hardware, network, and data" },
            { id: "B", text: "A menu of cafeteria food choices" },
            { id: "C", text: "A guide to office interior decoration" },
          ],
          correctOption: "A",
          explanation: "AUP documents establish boundaries for authorized and safe digital resource utilization.",
          points: 1,
        },
        displayOrder: 15,
      },
      {
        questionText: "When an engineer discovers a security flaw in production software, responsible disclosure requires:",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Privately reporting the vulnerability to the designated security team and cooperating on a patch before public disclosure" },
            { id: "B", text: "Selling the exploit to cybercriminal forums" },
            { id: "C", text: "Publicly broadcasting exploit steps on social media immediately" },
          ],
          correctOption: "A",
          explanation: "Responsible disclosure allows engineering teams to patch vulnerabilities without endangering users.",
          points: 1,
        },
        displayOrder: 16,
      },
      {
        questionText: "What distinguishes an ethical leader in times of corporate restructuring or project pivots?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Transparent communication, empathy for team impact, and clear guidance on strategic priorities" },
            { id: "B", text: "Concealing all operational realities and spreading false rumors" },
            { id: "C", text: "Abandoning team communications until the pivot ends" },
          ],
          correctOption: "A",
          explanation: "Ethical leadership anchors transitions with honesty, empathy, and strategic clarity.",
          points: 1,
        },
        displayOrder: 17,
      },
      {
        questionText: "Why is multi-factor authentication (MFA) mandatory on institutional accounts?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "It requires multiple independent credentials (e.g. password + hardware token), stopping over 99% of automated account takeovers" },
            { id: "B", text: "It makes passwords completely unnecessary" },
            { id: "C", text: "It automatically logs out all users every 5 minutes" },
          ],
          correctOption: "A",
          explanation: "MFA blocks unauthorized intrusions even if the primary password has been leaked or compromised.",
          points: 1,
        },
        displayOrder: 18,
      },
      {
        questionText: "How should an intern manage overlapping priorities when assigned tasks by multiple senior supervisors?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Communicate transparently with both supervisors, explain current capacity, and solicit guidance on prioritization" },
            { id: "B", text: "Silently accept both, complete neither, and hide when deadlines arrive" },
            { id: "C", text: "Complain publicly about supervisors on social media" },
          ],
          correctOption: "A",
          explanation: "Proactive communication surfaces capacity constraints and allows senior leaders to align priorities.",
          points: 1,
        },
        displayOrder: 19,
      },
      {
        questionText: "What is the ultimate standard of career success and professional reputation in technology?",
        questionType: "MULTIPLE_CHOICE",
        options: {
          choices: [
            { id: "A", text: "Delivering consistent technical value while upholding uncompromised ethics, integrity, and collaborative respect" },
            { id: "B", text: "Amassing short-term gains through deceitful practices" },
            { id: "C", text: "Refusing to mentor junior colleagues" },
          ],
          correctOption: "A",
          explanation: "Sustainable career excellence is built upon dependable competence, ethical integrity, and mutual respect.",
          points: 1,
        },
        displayOrder: 20,
      },
    ],
  },
];
