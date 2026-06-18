import SchemaTable from "@/components/SchemaTable";
import SectionHeading from "@/components/SectionHeading";

export default function AboutPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/about" label="information" />
      <SchemaTable />
    </div>
  );
}
