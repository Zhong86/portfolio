"use client";

import AnapsychisStash from "@/components/AnapsychisStash";
import GoalsTracker from "@/components/GoalsTracker";
import ReminderHeadline from "@/components/ReminderHeadline";
import SectionHeading from "@/components/SectionHeading";
import { useSudo } from "@/lib/use-sudo";

function LockedScreen() {
  return (
    <div className="border border-hairline rounded-md bg-surface px-6 py-10 flex flex-col items-center gap-3 text-center">
      <span className="font-mono text-[13px] text-accent">✗ permission denied</span>
      <p className="font-mono text-[12px] text-text-dimmer max-w-[380px] leading-relaxed">
        ~/goals is a restricted path. run <span className="text-text-dim">sudo</span> in the
        terminal below to authenticate.
      </p>
    </div>
  );
}

export default function GoalsPage() {
  const isSudo = useSudo();

  // `null` means localStorage hasn't been read yet — render nothing rather than
  // flashing either the tracker or the locked screen during hydration.
  if (isSudo === null) return null;

  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/.αναψυχής" label="My things" />
      {isSudo ? (
        <>
          <ReminderHeadline />
          <GoalsTracker />
          <AnapsychisStash />
        </>
      ) : (
        <LockedScreen />
      )}
    </div>
  );
}
