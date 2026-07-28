import { ABOUT_INFO } from "@/lib/config";

export default function SchemaTable() {
  return (
    <div className="border border-hairline rounded-md overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] bg-surface-2 text-text-dimmer font-mono text-[11px] uppercase tracking-wide">
        <div className="px-4 py-3 border-b border-hairline sm:border-r">field</div>
        <div className="hidden sm:block px-4 py-3 border-b border-hairline sm:border-r">type</div>
        <div className="hidden sm:block px-4 py-3 border-b border-hairline">value</div>
      </div>
      {ABOUT_INFO.map((row, i) => (
        <div
          key={row.field}
          className={`grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] font-mono text-[13px] ${
            i !== ABOUT_INFO.length - 1 ? "border-b border-hairline" : ""
          }`}
        >
          <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-hairline text-blue">
            {row.field}
          </div>
          <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-hairline text-text-dimmer">
            {row.type}
          </div>
          <div className="px-4 py-3 font-sans text-sm text-text">{row.value}</div>
        </div>
      ))}
    </div>
  );
}
