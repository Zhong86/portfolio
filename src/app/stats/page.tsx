import GithubStats from "@/components/GithubStats";
import LeetCodeStats from "@/components/LeetcodeStats";
import SectionHeading from "@/components/SectionHeading";

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-5 animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/stats" label="github & leetcode activity" />
      <GithubStats username="Zhong86" />
      <LeetCodeStats username="zhong86" />
    </div>
  );
}
