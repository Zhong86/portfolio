import ToolLinks from "@/components/ToolLinks";
import SectionHeading from "@/components/SectionHeading";

export default function ToolsPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/tools" label="tool links" />
      <ToolLinks />
    </div>
  );
}
