import AnalyticsPanel from "@/components/AnalyticsPanel";
import { BackButton } from "@/components/BackButton";

export default function AnalyticsPage() {
  return (
    <div className="md:mt-14">
      <BackButton />
      <AnalyticsPanel />
    </div>
  );
}