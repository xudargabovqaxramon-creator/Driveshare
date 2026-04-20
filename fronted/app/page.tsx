import Link from 'next/link';
import { Car, Shield, Clock, Star, ArrowRight, MapPin, ChevronRight, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: <Car size={22} />,
    title: 'Wide Selection',
    desc: 'Hundreds of cars across all categories and budgets — from city hatchbacks to luxury SUVs.',
    accent: 'from-blue-500/10 to-blue-600/5',
    iconBg: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: <Shield size={22} />,
    title: 'Verified Lessors',
    desc: 'Every owner is identity-verified so you can book with complete confidence.',
    accent: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    icon: <Zap size={22} />,
    title: 'Instant Booking',
    desc: 'Book in minutes. Lessor approval in under an hour, guaranteed.',
    accent: 'from-amber-500/10 to-amber-600/5',
    iconBg: 'bg-amber-500/10 text-amber-400',
  },
  {
    icon: <Star size={22} />,
    title: 'Rated 4.9/5',
    desc: 'Thousands of 5-star reviews from happy renters across 50+ cities.',
    accent: 'from-purple-500/10 to-purple-600/5',
    iconBg: 'bg-purple-500/10 text-purple-400',
  },
];

const STATS = [
  { num: '500+', label: 'Cars Available', icon: <Car size={16} /> },
  { num: '50+', label: 'Cities Covered', icon: <MapPin size={16} /> },
  { num: '10k+', label: 'Happy Renters', icon: <Star size={16} /> },
  { num: '4.9', label: 'Average Rating', icon: <Shield size={16} /> },
];

const TESTIMONIALS = [
  {
    text: 'Found a perfect car for my weekend trip in minutes. The whole process was seamless.',
    name: 'Amir T.',
    role: 'Frequent Renter',
    initials: 'AT',
  },
  {
    text: 'Listed my car and had my first booking within 24 hours. Amazing platform.',
    name: 'Sara K.',
    role: 'Car Owner',
    initials: 'SK',
  },
  {
    text: 'Better than any rental agency I\'ve used. Real people, real cars, real value.',
    name: 'James L.',
    role: 'Business Traveler',
    initials: 'JL',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">

      {/* ── Sticky Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white transition-transform duration-200 group-hover:scale-105">
              <Car size={17} className="text-zinc-900" />
            </div>
            <span className="font-display text-lg font-700 text-white">DriveShare</span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/cars" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              Browse Cars
            </Link>
            <Link href="#features" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              How It Works
            </Link>
            <Link href="#stats" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              About
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:scale-105 active:scale-100"
            >
              Get Started
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute top-20 right-0 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            10,000+ happy renters and counting
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl font-800 leading-[1.1] tracking-tight text-white md:text-7xl">
            Rent the perfect car{' '}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                for every trip.
              </span>
              <svg
                className="absolute -bottom-3 left-0 w-full opacity-40"
                viewBox="0 0 400 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 9C80 3 200 1 398 7" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-zinc-400">
            DriveShare connects drivers with trusted local car owners.
            Browse, book, and drive — all in one seamless experience.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/cars"
              className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-zinc-900 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-200 hover:bg-zinc-100 hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-100"
            >
              Browse Cars
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-100"
            >
              List Your Car
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-3 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              {['AT', 'SK', 'JL', 'MR'].map((init, i) => (
                <div
                  key={init}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-700 text-[10px] font-semibold text-zinc-300"
                  style={{ zIndex: 4 - i }}
                >
                  {init}
                </div>
              ))}
            </div>
            <span>Joined by <strong className="text-zinc-300">500+</strong> owners this month</span>
          </div>
        </div>

        {/* Floating car preview cards */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: 'BMW 3 Series', price: '$89', location: 'Tashkent', tag: 'Popular' },
              { name: 'Toyota Camry', price: '$65', location: 'Samarkand', tag: 'Best Value' },
              { name: 'Mercedes C-Class', price: '$120', location: 'Bukhara', tag: 'Premium' },
            ].map((car) => (
              <div
                key={car.name}
                className="group rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/8 hover:-translate-y-1 cursor-pointer"
              >
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-white/5">
                  <Car size={48} className="text-zinc-600" />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-0.5">{car.tag}</p>
                    <p className="font-display text-base font-semibold text-white">{car.name}</p>
                    <p className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                      <MapPin size={10} /> {car.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-700 text-white">{car.price}</p>
                    <p className="text-xs text-zinc-500">/ day</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────────────── */}
      <section id="stats" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map(({ num, label, icon }) => (
              <div
                key={label}
                className="group rounded-2xl border border-white/6 bg-white/3 p-6 text-center transition-all duration-200 hover:border-white/12 hover:bg-white/6"
              >
                <div className="mb-3 flex justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-zinc-400 transition-colors duration-200 group-hover:text-white">
                    {icon}
                  </div>
                </div>
                <p className="font-display text-3xl font-800 text-white">{num}</p>
                <p className="mt-1 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Why DriveShare
          </p>
          <h2 className="font-display text-4xl font-700 text-white md:text-5xl">
            Everything you need,
            <br />
            <span className="text-zinc-400">nothing you don&apos;t.</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl border border-white/6 bg-gradient-to-b ${f.accent} p-6 transition-all duration-300 hover:border-white/12 hover:-translate-y-1`}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                {f.icon}
              </div>
              <h3 className="mb-2.5 font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Simple Process</p>
            <h2 className="font-display text-4xl font-700 text-white">Drive in 3 easy steps</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Search & Filter', desc: 'Browse hundreds of cars by location, type, price, and availability.' },
              { step: '02', title: 'Book Instantly', desc: 'Submit a booking request. Get confirmed within an hour with owner verification.' },
              { step: '03', title: 'Pick Up & Drive', desc: 'Meet the owner, complete the handover, and hit the road — fully insured.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-white/6 bg-white/3 p-8">
                <div className="mb-6 font-display text-5xl font-800 text-white/10">{step}</div>
                <h3 className="mb-3 font-display text-xl font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Testimonials</p>
          <h2 className="font-display text-4xl font-700 text-white">Loved by renters &amp; owners</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map(({ text, name, role, initials }) => (
            <div
              key={name}
              className="rounded-2xl border border-white/6 bg-white/3 p-7 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
            >
              <div className="mb-5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-zinc-300">&ldquo;{text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-zinc-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-white/8 via-white/4 to-transparent p-16 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-4xl font-700 text-white md:text-5xl">Ready to drive?</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-zinc-400">
              Join thousands of happy renters. Create your free account today.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="group flex items-center gap-2 rounded-2xl bg-white px-10 py-4 text-base font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:scale-105 active:scale-100"
              >
                Create Free Account
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/cars"
                className="rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-100"
              >
                Browse Cars
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <Car size={15} className="text-zinc-900" />
              </div>
              <span className="font-display text-base font-700 text-white">DriveShare</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/cars" className="transition-colors hover:text-white">Browse</Link>
              <Link href="/auth/login" className="transition-colors hover:text-white">Sign In</Link>
              <Link href="/auth/register" className="transition-colors hover:text-white">Register</Link>
            </div>
            <p className="text-xs text-zinc-600">© 2024 DriveShare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
