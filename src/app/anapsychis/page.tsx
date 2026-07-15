import AnapsychisStash from "@/components/AnapsychisStash";
import SectionHeading from "@/components/SectionHeading";

export default function AnapsychisPage() {
  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      <SectionHeading path="~/.αναψυχής" label="private stash" />
      <AnapsychisStash />
    </div>
  );
}
