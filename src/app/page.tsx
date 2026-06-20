"use client"

import LogStream from "@/components/LogStream";
import { useEffect, useState } from "react";

const STARTDATE = "2025-06-01T00:00:00Z";
const INFORMATION=`Full-stack developer focusing in backend engineering: API design, routing, and database architecture, with frontend experience as needed. Self-directed learner throughout my career.
`;

function formatDurationYearsMonths(years: number, months: number) {
  return `${years}Y ${months}M`;
}

export default function HomePage() {
  const [duration, setDuration] = useState("");
  useEffect(() => {
    function update() {
      const start = new Date(STARTDATE);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const formatted = formatDurationYearsMonths(years, months);
      setDuration(formatted);
    }
    update();
  }, []);

  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <div className="font-mono text-xs text-text-dim tracking-wide mb-4">
        {"// fullstack engineer · ai agent engineer"}
      </div>
      <h1 className="font-mono text-[28px] sm:text-[34px] font-medium leading-[1.25] mb-3 tracking-tight">
        A guy who just loves to <span className="text-accent">code</span>.
        <br />
        <span className="text-accent">{duration}</span> since I started learning Software Engineering.
      </h1>
      <p className="font-sans text-base text-text-dim max-w-[520px] mb-8" style={{ whiteSpace: 'pre-wrap'}}>
        {INFORMATION}
      </p>

      <LogStream />
    </div>
  );
}
