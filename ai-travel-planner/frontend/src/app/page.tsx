import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex flex-col">
      <header className="flex justify-between items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-extrabold text-brand-600">✈️ Trao</span>
        <nav className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5">
          Your next trip, planned by AI in seconds.
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Tell us where you want to go, your budget, and your interests. Trao generates a
          complete day-by-day itinerary, budget breakdown, hotel picks, and a smart packing
          checklist — fully editable, just for you.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition"
          >
            Plan My Trip
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white border border-slate-200 hover:border-brand-300 text-slate-700 font-semibold rounded-xl transition"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 py-6">
        Built with Next.js, Express, MongoDB &amp; Gemini.
      </footer>
    </main>
  );
}
