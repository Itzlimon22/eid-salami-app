import SalamiWheelApp from "../components/SalamiWheelApp";

/**
 * Props for the Next.js Page component
 */
interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Main Page Server Component
 * Responsible for extracting URL parameters and passing them to the interactive client app.
 */
const HomePage = ({ searchParams }: PageProps) => {
  // Extract giver configuration from URL parameters
  const giverNameParam = searchParams.giver;
  const maxAmountParam = searchParams.max;

  const giverName = typeof giverNameParam === "string" ? giverNameParam : null;
  const maxAmount =
    typeof maxAmountParam === "string" ? parseInt(maxAmountParam, 10) : null;

  return (
    <main className="min-h-screen bg-emerald-50 text-emerald-950 flex flex-col items-center justify-center p-4">
      <SalamiWheelApp
        initialGiverName={giverName}
        initialMaxAmount={maxAmount}
      />
    </main>
  );
};

export default HomePage;
