type SchemaField = {
  field: string;
  type: string;
  value: string;
};

const fields: SchemaField[] = [
  { field: "role", type: "string", value: "FullStack Developer" },
  { field: "focus", type: "string[]", value: "AI Automated Systems, FullStack Applications" },
  { field: "tech_stack", type: "string[]", value: "Python, PHP, TypeScript, LangChain, React, Laravel" },
  { field: "occupation", type: "string", value: "FullStack Intern @ DBKlik" },
  { field: "months_active", type: "int", value: "3" },
];

export default function SchemaTable() {
  return (
    <div className="border border-hairline rounded-md overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] bg-surface-2 text-text-dimmer font-mono text-[11px] uppercase tracking-wide">
        <div className="px-4 py-3 border-b border-hairline sm:border-r">field</div>
        <div className="hidden sm:block px-4 py-3 border-b border-hairline sm:border-r">type</div>
        <div className="hidden sm:block px-4 py-3 border-b border-hairline">value</div>
      </div>
      {fields.map((row, i) => (
        <div
          key={row.field}
          className={`grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] font-mono text-[13px] ${
            i !== fields.length - 1 ? "border-b border-hairline" : ""
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
