import type {
  Announcement,
  GalleryItem,
  Leader,
  Service,
  SocialLink,
} from "./types";

// Approved reference content for Phase 1. Replace this source with published CMS
// records in Phase 6; presentation components depend on types, not a database.
const cloudinary = "https://res.cloudinary.com/djkudkxmx/image/upload/";
export const heroImages = [
  `${cloudinary}v1790626126/screen_2_fcf81s.jpg`,
  `${cloudinary}v1790626122/screen_1_dzwyjz.jpg`,
  `${cloudinary}v1790626121/screen_3_gkjtrh.jpg`,
];

export const gallery: readonly GalleryItem[] = [
  {
    id: "learning",
    src: `${cloudinary}v1790510808/12_gejlfg.jpg`,
    title: "Learning together",
    alt: "KSITM gallery photo: Learning together",
    caption: "Scenes from the shared learning experience at KSITM.",
  },
  {
    id: "community",
    src: `${cloudinary}v1790510807/19_ogvqvj.jpg`,
    title: "Community in focus",
    alt: "KSITM gallery photo: Community in focus",
    caption: "A snapshot of connection and activity around the institute.",
  },
  {
    id: "perspective",
    src: `${cloudinary}v1790510808/17_yg0hpl.jpg`,
    title: "Another perspective",
    alt: "KSITM gallery photo: Another perspective",
    caption: "Explore another scene from the KSITM gallery.",
  },
  ...[
    "v1790510808/13_xlkzft.jpg",
    "v1790675969/Gemini_Generated_Image_wd6fouwd6fouwd6f_unakt3.jpg",
    "v1790675990/Gemini_Generated_Image_8q8pmc8q8pmc8q8p_dsqkay.jpg",
    "v1790675990/Gemini_Generated_Image_9560vq9560vq9560_avlrqc.jpg",
    "v1790703234/ChatGPT_Image_Sep_29_2026_06_33_23_PM_diyx8d.png",
  ].map((path, index) => ({
    id: `shared-${index + 1}`,
    src: `${cloudinary}${path}`,
    title: "Shared experiences",
    alt: "KSITM gallery photo: Shared experiences",
    caption: "A further glimpse into the KSITM community.",
  })),
];

export const leaders: readonly Leader[] = [
  {
    id: "nura-sadiq",
    name: "Nura Sadiq, M.Sc., CPCC",
    position: "Career Center Coordinator & Contact Person",
    src: `${cloudinary}v1790675993/Gemini_Generated_Image_pndmuepndmuepndm_vjfsu2.jpg`,
    alt: "Nura Sadiq, Career Center Coordinator and Contact Person",
    summary:
      "Lecturer II and Coordinator of the Career Services Centre at KSITM, with over a decade of experience in teaching, academic administration and career development.",
    biography: [
      "He specialises in career coaching, employability development, entrepreneurship, industry engagement, mentorship and student-to-work transition.",
      "He holds an M.Sc. and B.Sc. in Accounting and an ND in Accounting, and is a Certified Professional Career Coach (CPCC) and Member Professional Mentor and Coach (Mpmc).",
      "His professional experience includes leadership and coordination roles in career services, employability and entrepreneurship, skills development and community service at KSITM.",
      "Nura is passionate about connecting education with the world of work and helping students develop the skills, confidence, professional identity and networks required to thrive in an evolving labour market. His interests also include accounting, financial reporting, corporate governance, financial resilience, career development and the application of emerging technologies to professional practice.",
      "Guiding philosophy: Discover. Develop. Connect. Transition. Progress.",
    ],
  },
  {
    id: "abubakar-abdu",
    name: "Abubakar Abdu",
    position: "Assistant Coordinator, Career Coaching",
    src: `${cloudinary}v1790675981/Gemini_Generated_Image_ew9rw7ew9rw7ew9r_qctlmm.jpg`,
    alt: "Abubakar Abdu, Assistant Coordinator Career Coaching",
    summary:
      "A seasoned accounting professional with expertise in banking, auditing, financial services and corporate reporting.",
    biography: [
      "A member of ICAN, CIMCN, CIIF, and NIIE, he is passionate about entrepreneurship, mentoring, coaching, and developing future leaders.",
      "As an Assistant Coordinator, he supports students and alumni by providing career guidance, organizing professional development programs, and managing daily Career Center operations.",
    ],
  },
];

export const services: readonly Service[] = [
  {
    slug: "consultations",
    title: "Appointment Scheduler",
    icon: "calendar",
    summary:
      "Make room for your next step. Talk through your goals with a Career Assistant.",
    description:
      "The student portal will support consultation requests, confirmed appointment details and appointment history. For now, contact the Career Services Centre to discuss an appointment.",
  },
  {
    slug: "mentorship",
    title: "Mentorship",
    icon: "people",
    summary:
      "Find perspective, encouragement and guidance for the journey ahead.",
    description:
      "Mentorship will connect students with available mentors and relevant specialisations. Your Career Assistant will help decide when mentorship fits your individual career development plan.",
  },
  {
    slug: "resume",
    title: "Resume Builder",
    icon: "document",
    summary:
      "Bring your education, experience and strengths together in a professional resume.",
    description:
      "The planned resume builder will support structured education, experience, skills, projects and certifications, with preview and print-ready output. Access will be activated individually by a Career Assistant.",
  },
  {
    slug: "training",
    title: "Employability Skills Training",
    icon: "play",
    summary:
      "Develop communication, leadership and practical workplace skills.",
    description:
      "Published learning videos will support employability development, with progress tracking in the student portal. Training access will follow your individual career plan. No training videos have been published yet.",
  },
  {
    slug: "internships",
    title: "Virtual Internship",
    icon: "laptop",
    summary:
      "Explore opportunities to put your learning into practice beyond the classroom.",
    description:
      "Published internship opportunities will include requirements, dates and application details. Opportunities will be shown when confirmed, and portal access will be managed by Career Assistants. No opportunities are currently published.",
  },
  {
    slug: "employers",
    title: "Employer Engagement",
    icon: "briefcase",
    summary:
      "Connect your ambitions with the world of work and professional opportunities.",
    description:
      "This service will bring together published employer information, career events and opportunities. No employer partnerships or vacancies are announced on this page until verified content is available.",
  },
  {
    slug: "readiness",
    title: "Job Readiness Assessment",
    icon: "check",
    summary:
      "Reflect on your strengths and identify the skills to develop next.",
    description:
      "Structured assessments will help students reflect on employability and prepare for work. Human Career Assistants will interpret needs and make service-access decisions. A future AI Career Assistant may support guidance; AI is not currently available.",
  },
];

export const announcements: readonly Announcement[] = [];
export const socialLinks: readonly SocialLink[] = [];

export function getActiveSocialLinks(links: readonly SocialLink[]) {
  return links.filter((link) => {
    if (!link.active) return false;
    try {
      const url = new URL(link.url);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}
