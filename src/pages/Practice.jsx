import React from "react";
import TarotTable from "@/features/practice/TarotTable";

/** Launch-safe reflection practice. Healing scoring is intentionally not shipped. */
export default function Practice() {
  return (
    <div className="dusk-surface min-h-screen">
      <TarotTable />
    </div>
  );
}
