import { Sparkles, GraduationCap } from "lucide-react";

interface WelcomeHeroProps {
  name?: string;
  fallbackLabel?: string;
  subtitle?: string;
}

export default function WelcomeHero({
  name,
  fallbackLabel = "User",
  subtitle = "Welcome to your dashboard. Stay on top of your activities and keep everything organized.",
}: WelcomeHeroProps) {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-8 text-white shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
            <Sparkles size={16} />
            <span>Welcome back</span>
          </div>

          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            {name ? `Hello, ${name} 👋` : `Hello, ${fallbackLabel} 👋`}
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100 md:text-base">
            {subtitle}
          </p>
        </div>

        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15">
          <GraduationCap size={42} />
        </div>
      </div>
    </section>
  );
}