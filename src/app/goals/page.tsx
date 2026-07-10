import GoalsTracker from "@/components/GoalsTracker";
import SectionHeading from "@/components/SectionHeading";

export default function GoalsPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/goals" label="AWS internship tracker" />
      <GoalsTracker />
    </div>
  );
}
