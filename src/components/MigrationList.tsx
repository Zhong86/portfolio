"use client";

import { useState } from "react";

type Migration = {
  num: string;
  title: string;
  status: "PROD" | "ARCHIVED";
  description: string;
  stack: string[];
  links: { label: string; href: string }[];
};

const migrations: Migration[] = [
  {
    num: "0005",
    title: "Orchestrator Agent",
    status: "PROD",
    description:
      "Collaborated in creating an AI agent for DBKlik that allows it to access internal database with Read permissions along with dealing with Excel, and PDF files. The AI relies on different Skill.md that will be loaded based on agent's needs. SQL Queries and scripts to read Excel file are created by the AI agent to allow reusability. The system heavily reduces token usage and increases efficiency.",
    stack: ["Python", "LangGraph"],
    links: [{ label: "RAG", href: "https://aws.amazon.com/id/what-is/retrieval-augmented-generation/" }],
  },
  {
    num: "0004",
    title: "JobLect: Automated Job Searching",
    status: "ARCHIVED",
    description:
      "Automating the process of job searching for users and filters jobs that matches with user's preferences.",
    stack: ["TypeScript", "NextJS", "Python", "LangGraph", "Supabase", "Stripe"],
    links: [],
  },
  {
    num: "0003",
    title: "Automated Purchase Order Agent",
    status: "ARCHIVED",
    description:
      "Collaborated in a project that automates the process of Purchase Orders for DBKlik",
    stack: ["Python", "LangGraph"],
    links: [{ label: "source_docs", href: "https://www.langchain.com/langgraph" }],
  },
  {
    num: "0002",
    title: "GoogleMeet AI",
    status: "ARCHIVED",
    description:
      "AI bot that summarizes Google Meet for DBKlik. Recoding is transcribed with FastWhisper and summarized to be sent to the Whatsapp group",
    stack: ["Openclaw", "TypeScript"],
    links: [{ label: "source_docs", href: "https://openclaw.ai/" }],
  },
  {
    num: "0001",
    title: "DBJobs: Job Portal Website",
    status: "PROD",
    description:
      "Job portal website made during DBKlik internship. Handled the fullstack development while collaborating with System Analyst and UI/UX designer.",
    stack: ["Laravel", "PHP"],
    links: [{ label: "website", href: "https://job.dbklik.co.id/" }],
  },
];

function MigrationItem({ migration }: { migration: Migration }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-hairline rounded-md mb-3.5 overflow-hidden">
  <button
    type="button"
    onClick={() => setOpen((v) => !v)}
    aria-expanded={open}
    className="w-full flex justify-between items-center px-4.5 py-4 bg-surface hover:bg-surface-2 transition-colors text-left"
  >
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-text-dimmer">{migration.num}</span>
      <span className="font-mono text-sm text-text">{migration.title}</span>
    </div>
    <div className="flex items-center gap-3">
      <span
        className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${migration.status === "PROD"
            ? "bg-accent-dim text-accent"
            : "bg-hairline text-text-dim"
          }`}
      >
        {migration.status}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-text-dimmer transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </button>
  {open && (
    <div className="px-4.5 pb-4.5 border-t border-hairline bg-surface">
      <p className="font-sans text-sm text-text-dim my-4 max-w-[600px]">
        {migration.description}
      </p>
      <div className="flex gap-2 flex-wrap mt-3">
        {migration.stack.map((tag) => (
          <span
            key={tag}
            className="font-mono text-[11.5px] px-2.5 py-1 border border-hairline rounded text-text-dim"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex gap-4 mt-4 font-mono text-[12.5px]">
        {migration.links.map((link) => (
          <a key={link.label} href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue hover:text-accent">
            → {link.label}
          </a>
        ))}
      </div>
    </div>
  )}
</div>
  );
}

export default function MigrationList() {
  return (
    <div>
      {migrations.map((m) => (
        <MigrationItem key={m.num} migration={m} />
      ))}
    </div>
  );
}
