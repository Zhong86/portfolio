import MigrationList from "@/components/MigrationList";
import SectionHeading from "@/components/SectionHeading";

export default function ProjectsPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/projects" label="Projects applied" />
      <MigrationList />
    </div>
  );
}
