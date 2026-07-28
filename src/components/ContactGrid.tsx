import { CONTACTS } from "@/lib/config";

export default function ContactGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {CONTACTS.map((c) => (
        <a href={c.link} key={c.key}
          target="_blank"
          rel="noopener noreferrer"
          className="group border border-hairline rounded-md p-5 bg-surface transition-colors hover:border-accent hover:bg-surface/80"
        >
          <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-2">
            {c.key}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-[15px] text-accent group-hover:underline">
              {c.value}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-dimmer -translate-x-1 group-hover:translate-x-0 transition-all shrink-0"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
}
