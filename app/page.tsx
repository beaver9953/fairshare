// app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-white">FairShare</span>
        </div>
        <Link 
          href="/dashboard" 
          className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all"
        >
          Launch App
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-32 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-8 tracking-wide uppercase">
          PayPal AI Hackathon 2026
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
          Roommates don't fight about money.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            They fight about invisible labor.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          The mental load of remembering bills, buying toilet paper, and managing utilities usually falls on one person. Traditional expense apps require manual entry, meaning the burden stays hidden and resentment builds. 
          <strong className="text-white font-medium"> FairShare is a continuous settlement engine that quantifies the invisible and settles the debt in real-time via PayPal.</strong> We replace nagging with math.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/dashboard" 
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-1"
          >
            Enter the FairShare OS
          </Link>
          <a 
            href="https://github.com/beaver9953/fairshare" 
            target="_blank" 
            rel="noreferrer"
            className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-lg transition-all"
          >
            View Source
          </a>
        </div>
      </section>

      {/* The Problem / Solution Grid */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Invisible Burden</h3>
            <p className="text-slate-400 leading-relaxed">
              One roommate buys the toilet paper, remembers the water bill, and cleans the kitchen. The math is hidden, so the person doing the labor absorbs the cost and the resentment. 
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Zero-Friction Data</h3>
            <p className="text-slate-400 leading-relaxed">
              If logging takes more than 5 seconds, it won't happen. We ingest continuous IoT smart-plug usage, parse paper bills with AI, and use 1-tap buttons for mental load.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Executed Settlement</h3>
            <p className="text-slate-400 leading-relaxed">
              Insight without action is useless. The Fairness Ledger shows the math, and then fires off real PayPal Invoices for those who owe, and real PayPal Payouts to reimburse those who overpaid.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}