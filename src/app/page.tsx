import React, { Suspense } from "react";
import SalamiWheelApp from "../components/SalamiWheelApp";

/**
 * Main Page Server Component
 * Simplified to act strictly as a container.
 * Suspense is required by Next.js 15 when children use useSearchParams().
 */
const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="text-amber-400 font-eid text-2xl animate-pulse">
            Loading Magic...
          </div>
        }
      >
        <SalamiWheelApp />
      </Suspense>
    </main>
  );
};

export default HomePage;
