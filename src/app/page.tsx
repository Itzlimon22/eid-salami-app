import SalamiWheelApp from "../components/SalamiWheelApp";

/**
 * Props for the Next.js Page component
 * Updated for Next.js 15: searchParams is now a Promise
 */
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Main Page Server Component
 * Responsible for extracting URL parameters asynchronously and passing them to the interactive client app.
 */
const HomePage = async ({ searchParams }: PageProps) => {
  // Await the searchParams Promise to access the actual URL data
  const resolvedParams = await searchParams;

  // Extract giver configuration from URL parameters
  const giverNameParam = resolvedParams.giver;
  const maxAmountParam = resolvedParams.max;

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
