// -------------------- Terminal ---------------
export const AI_MAX_MESSAGES = 5;
export const SUDO_MAX_ATTEMPTS = 3;

export type PaletteItem = { cmd: string; label: string; keyword: string };
export const NAV_ITEMS: PaletteItem[] = [
  { cmd: "cd home", label: "go to homepage", keyword: "home" },
  { cmd: "cd about", label: "about me", keyword: "about" },
  { cmd: "cd goals", label: "AWS internship goal tracker", keyword: "goals" },
  { cmd: "cd stats", label: "github & leetcode stats", keyword: "stats" },
  { cmd: "cd projects", label: "projects applied / built", keyword: "projects" },
  { cmd: "cd learn", label: "learn logs", keyword: "learn" },
  { cmd: "cd contact", label: "contact info", keyword: "contact" },
  { cmd: "talos_ai", label: "ask AI", keyword: "ai" },
  { cmd: "theme nier", label: "switch to NieR:Automata theme", keyword: "theme" },
  { cmd: "theme default", label: "back to default theme", keyword: "theme" },
];

// -------------------- HOME -------------------
export type HomeContent = {
  tagline: string;
  headlinePrefix: string;
  accentWord: string;
  startDate: string;
  description: string;
};

export const DEFAULT_HOME: HomeContent = {
  tagline: "fullstack engineer · ai agent engineer",
  headlinePrefix: "A guy who just loves to",
  accentWord: "code",
  startDate: "2025-06-01T00:00:00Z",
  description:
    "Full-stack developer focusing in backend engineering: API design, routing, and database architecture, with frontend experience as needed. Self-directed learner throughout my career.",
};

// -------------------- ABOUT ------------------
export type AboutField = {
  id: string;
  field: string;
  type: string;
  value: string;
};

export const DEFAULT_ABOUT_INFO: AboutField[] = [
  { id: "roles", field: "roles", type: "string[]", value: "Backend Developer, AI Agent Engineer" },
  { id: "focus", field: "focus", type: "string[]", value: "AI Automated Systems, FullStack Applications" },
  { id: "tech_stack", field: "tech_stack", type: "string[]", value: "Python, PHP, TypeScript, LangChain, React, Laravel" },
  { id: "occupation", field: "occupation", type: "string", value: "AI Agent & Fullstack Intern @ DBKlik" },
  { id: "start", field: "start", type: "datetime", value: "04/2026" },
  { id: "end", field: "end", type: "datetime", value: "-" },
];

// -------------------- Information (markdown topics) ------------
// Long-form knowledge base for the Talos agent. Stored in KV under `info:<topic>`;
// the constants below are the seed values used whenever KV has no entry yet.
export const MARKDOWN_TOPICS = ["coding", "profession", "hobbies", "contact"] as const;
export type MarkdownTopic = (typeof MARKDOWN_TOPICS)[number];

export const DEFAULT_MARKDOWN_INFO: Record<MarkdownTopic, string> = {
  coding: `# CODING

## Tech Stacks
Main languages are Python and TypeScript.
- Started with Python for MiddleSchool but then deal with C# for game development.
- Use JS (React) as my main language for Web Development along with PHP (Laravel).
- Briefly learned Java (Springboot) for backend.
- Used Python for LangChain, LangGraph AI projects.
- Learned AWS - EC2, RDS, S3, and the basics of CI/CD

## Projects
### File Reading Agent
**Stack:** Python, LangGraph
Created a tool for an internal AI Agent at DBKlik that allows it to read CSV, XLSX, and PDF files. Uses RAG chunk system for PDF along with Pandas generated scripts by a LLM that is passed to the agent. Heavily reduces token usage and increases efficiency.
### Automated Job Searching
**Stack:** TypeScript, NextJS, Python, LangGraph, Supabase
Automating the process of job searching for users and filters jobs that matches with user's preferences.
### Automated Purchase Order Agent
**Stack:** Python, LangGraph
Collaborated in a project that automates the process of Purchase Orders for DBKlik.
### GoogleMeet AI
**Stack:** Openclaw, TypeScript
AI bot that summarizes Google Meet for DBKlik. Recording is transcribed with FastWhisper and summarized to be sent to the Whatsapp group.
### DBJobs: Job Portal Website
**Stack:** Laravel, PHP
Job portal website made during DBKlik internship. Handled the fullstack development while collaborating with System Analyst and UI/UX designer.
`,

  profession: `# PROFESSION

## Careers
- Fullstack & AI Agent Internship (April 2026) at DBKlik

## University
I am a student who just started university in Ciputra University (UC) - acquiring the 100% Star Scholarship.
Will be joining the Informatics - Fullstack Development major and is graduating on 2030.
Seeking to join Apple Developer Academy.

## Independent Learner
Learned all the skills for Software Engineering and Coding through free sources on the Internet such as FreeCodeCamp, Harvard's CS50, www3.schools, etc. Have made several local projects and build a steady foundation for coding through trial and failure.

## Game Development
I have learned coding since 2022, with Python as my first language.
Focused more on Game Development instead of Software Engineer at the time and learned the basics of coding through Unity.
Never managed to release any games on the public due to copyright.

## Software Engineer
Started to learn and be interested in Software Engineering at 2025.
Prioritized websites over Mobile apps because the latter felt a lot more difficult when I tried it previously.
Learned the basics of web development with HTML, CSS, JS. Then started on learning React and Express JS for a fullstack project.
Because of pure CSS, I leaned more towards the Backend side of Web Development and focused on databases, APIs, and system architecture.
Also used Laravel for internship and learned the basics of TailwindCSS.
`,

  hobbies: `# HOBBIES

## Coding
My most favorite thing to do is coding. It can be working on personal AI projects, making a website, or building a game - I will always love coding. Even if I face lots of errors and bugs, the ability to solve them and learn through it will always be a great feeling.

## Games
Enjoys Soulsborne type of games the most. Have played Dark Souls 1 to 3, Sekiro and Elden Ring - cannot try Bloodborne (don't have a PS4). These games are my top because Soulsborne teaches me patience and perseverance which helps in building an endurance mindset to face challenges in the world.

## Calisthenics
Never had a gym membership so had to go by with Calisthenics. Started in 2020 who couldn't do 10 pushups and now I have achieved Planche and the Front lever. Still currently working on the Planche Pushup and even the One Arm Pullup.
`,

  contact: `# CONTACT

I'm most active on Whatsapp and Instagram.

## Platforms
- Whatsapp: 081319990725
- Instagram: verlin_dev
- Email: billy.zhong0725@gmail.com
- Github: Zhong86
- LinkedIn: Billy Zhong
`,
};

// -------------------- Experiences ---------------
export type LogLevel = "info" | "ok" | "warn";
export type LogEntry = {
  ts: string;
  level: LogLevel;
  service: string;
  msg: string;
};

export const EXPERIENCES: LogEntry[] = [
  { ts: "07-2026", level: "ok", service: "career", msg: "Extended Contract as AI Agent Engineer for DBKlik" },
  { ts: "05-2026", level: "ok", service: "build", msg: "AI Agents for DBKlik" },
  { ts: "04-2026", level: "ok", service: "career", msg: "Fullstack internship at DBKlik" },
  { ts: "03-2026", level: "ok", service: "build", msg: "Book manager with Laravel" },
  { ts: "02-2026", level: "info", service: "study", msg: "Java Springboot" },
  { ts: "01-2026", level: "ok", service: "build", msg: "First portfolio website" },
  { ts: "12-2025", level: "info", service: "study", msg: "API, authentication, database, cache" },
  { ts: "10-2025", level: "info", service: "study", msg: "React stack" },
  { ts: "08-2025", level: "info", service: "study", msg: "HTML, CSS, JS stack" },
  { ts: "07-2025", level: "warn", service: "linux", msg: "Download wifi drivers & learned terminal" },
  { ts: "07-2025", level: "info", service: "linux", msg: "Learn and configured Arch linux" },
];

// -------------------- Projects ---------------
export type Migration = {
  id: string;
  num: string;
  title: string;
  status: "PROD" | "ARCHIVED";
  description: string;
  stack: string[];
  links: { label: string; href: string }[];
};

export const DEFAULT_PROJECTS: Migration[] = [
  {
    id: "orchestrator-agent",
    num: "0005",
    title: "Orchestrator Agent",
    status: "PROD",
    description:
      "Collaborated in creating an AI agent for DBKlik that allows it to access internal database with Read permissions along with dealing with Excel, and PDF files. The AI relies on different Skill.md that will be loaded based on agent's needs. SQL Queries and scripts to read Excel file are created by the AI agent to allow reusability. The system heavily reduces token usage and increases efficiency.",
    stack: ["Python", "LangGraph"],
    links: [{ label: "RAG", href: "https://aws.amazon.com/id/what-is/retrieval-augmented-generation/" }],
  },
  {
    id: "joblect",
    num: "0004",
    title: "JobLect: Automated Job Searching",
    status: "ARCHIVED",
    description:
      "Automating the process of job searching for users and filters jobs that matches with user's preferences.",
    stack: ["TypeScript", "NextJS", "Python", "LangGraph", "Supabase", "Stripe"],
    links: [],
  },
  {
    id: "purchase-order-agent",
    num: "0003",
    title: "Automated Purchase Order Agent",
    status: "ARCHIVED",
    description:
      "Collaborated in a project that automates the process of Purchase Orders for DBKlik",
    stack: ["Python", "LangGraph"],
    links: [{ label: "source_docs", href: "https://www.langchain.com/langgraph" }],
  },
  {
    id: "googlemeet-ai",
    num: "0002",
    title: "GoogleMeet AI",
    status: "ARCHIVED",
    description:
      "AI bot that summarizes Google Meet for DBKlik. Recoding is transcribed with FastWhisper and summarized to be sent to the Whatsapp group",
    stack: ["Openclaw", "TypeScript"],
    links: [{ label: "source_docs", href: "https://openclaw.ai/" }],
  },
  {
    id: "dbjobs",
    num: "0001",
    title: "DBJobs: Job Portal Website",
    status: "PROD",
    description:
      "Job portal website made during DBKlik internship. Handled the fullstack development while collaborating with System Analyst and UI/UX designer.",
    stack: ["Laravel", "PHP"],
    links: [{ label: "website", href: "https://job.dbklik.co.id/" }],
  },
];

// ---------------------------- GOALS ---------------------
export const DOCS_LINK = "https://docs.google.com/document/d/186_iEIWTCXko_vhPBV1yK0xkooNAS1mN2JTYq99qR5w/edit?usp=sharing";

export const TARGET_DATE = new Date("2028-01-01T00:00:00Z").getTime();

export type Category = {
  id: string;
  label: string;
  unit: string;
  target: number;
};

export const CATEGORIES: Category[] = [
  { id: "leetcode", label: "LeetCode Questions", unit: "solved", target: 250 },
  { id: "dsa_patterns", label: "DSA Patterns", unit: "patterns mastered", target: 84 },
  { id: "java_core", label: "Core Java Depth", unit: "topics covered", target: 6 },
  { id: "spring_boot", label: "Spring Boot 4", unit: "topics covered", target: 8 },
  { id: "postgresql", label: "PostgreSQL", unit: "topics covered", target: 6 },
  { id: "aws", label: "AWS Services", unit: "services learned", target: 8 },
  { id: "docker_cicd", label: "Docker & CI/CD", unit: "topics covered", target: 3 },
  { id: "system_design", label: "System Design", unit: "topics covered", target: 7 },
  { id: "capstone", label: "Capstone Projects", unit: "projects shipped", target: 4 },
];

export const WEEKLY_GOALS: Category[] = [
  { id: "weekly_leetcode", label: "LeetCode Questions", unit: "this week", target: 7 },
  { id: "weekly_dsa", label: "DSA Concepts", unit: "this week", target: 5 },
];

export const TOP_GOALS = [
  {
    num: "01",
    title: "DSA Grind",
    desc: "250 LeetCode questions + DSA patterns.",
  },
  {
    num: "02",
    title: "Ship Projects",
    desc: "AWS + Docker + CI/CD pipeline.",
  },
];

export const WEEKLY_TO_OVERALL_MAP: Record<string, string> = {
  weekly_leetcode: "leetcode",
  weekly_dsa: "dsa_patterns",
};

// -------------------------- Contacts ---------------------
export const CONTACTS = [
  { key: "email", value: "billy.zhong0725@gmail.com", link: "mailto:billy.zhong0725@gmail.com" },
  { key: "whatsapp", value: "081319990725", link: "https://wa.me/6281319990725" },
  { key: "github", value: "github.com/Zhong86", link: "https://github.com/Zhong86" },
  { key: "instagram", value: "verlin_dev", link: "https://www.instagram.com/verlin_dev/" },
  { key: "linkedin", value: "Billy Zhong", link: "https://www.linkedin.com/in/billy-zhong-495a6a337/" },
  { key: "telegram", value: "zhong_86", link: "https://t.me/zhong_86" },
];


