import { WalletDashboard } from "./components/WalletDashboard";
import { SimulateWeatherEvent } from "./components/SimulateWeatherEvent";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-900">
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl font-extrabold text-blue-900">DevTrails Platform</h1>
          <p className="text-gray-500 mt-2 text-lg">Next.js boilerplate ready for policy, claims, and fraud workflows.</p>
        </header>

        <section className="grid md:grid-cols-2 gap-8">
          {/* Worker Dashboard View */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold border-b pb-2">User Perspective</h2>
            <WalletDashboard />
          </div>

          {/* Dev/Simulate Tools View */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold border-b pb-2">Control Panel</h2>
            <SimulateWeatherEvent />
          </div>
        </section>
      </div>
    </main>
  );
}
