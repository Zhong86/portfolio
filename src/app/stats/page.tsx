import GithubStats from "@/components/GithubStats";
import SectionHeading from "@/components/SectionHeading";

export default function StatsPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/stats" label="github activity" />
      <GithubStats username="Zhong86" />
    </div>
  );
}
