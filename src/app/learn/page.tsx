import LearnLogs from "@/components/LearnLogs";
import SectionHeading from "@/components/SectionHeading";

export default function LearnPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/learn" label="learning logs" />
      <LearnLogs />
    </div>
  );
}
