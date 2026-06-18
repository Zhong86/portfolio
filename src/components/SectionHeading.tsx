export default function SectionHeading({ path, label }: { path: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-7">
      <span className="font-mono text-xs text-text-dimmer">{path}</span>
      <h2 className="font-mono text-[13px] font-semibold text-text-dim uppercase tracking-wider">
        {label}
      </h2>
    </div>
  );
}
