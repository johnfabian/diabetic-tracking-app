import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";

import { ROUTES } from "@/config/routes";

/** Animated glucose trace drawn across the hero. Pure SVG + CSS, no assets. */
function HeroWave() {
  const path =
    "M0,120 C60,118 90,60 140,64 S220,150 280,150 S350,40 410,44 " +
    "S470,118 530,116 S600,70 660,74 S730,128 800,120";
  return (
    <svg
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mx-auto mt-1.5 mb-4 block h-[130px] w-full max-w-[720px]"
    >
      <defs>
        <linearGradient id="wave-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0" />
          <stop offset="0.15" stopColor="#ffd23f" stopOpacity="1" />
          <stop offset="0.85" stopColor="#ffd23f" stopOpacity="1" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x="0" y="58" width="800" height="74"
        className="fill-ok/5 stroke-ok/25 [stroke-dasharray:4_4]"
      />
      <path
        d={path}
        stroke="url(#wave-fade)"
        className="animate-draw-line fill-none [stroke-dasharray:1600] [stroke-dashoffset:1600]
          [animation-delay:0.5s] [stroke-linecap:round] [stroke-width:2.5]
          motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
      />
      <circle r="6" className="fill-accent drop-shadow-[0_0_6px_rgba(255,210,63,0.9)] motion-reduce:hidden">
        <animateMotion dur="9s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
}

function FadeIn({ delayMs, children, className = "" }: { delayMs: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={`animate-fade-up opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 ${className}`}
      style={{ animationDelay: `${delayMs}ms` } satisfies CSSProperties}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: "📷", title: "Snap your meter", text: "Photograph the glucometer — AI reads the value and timestamp for you." },
  { icon: "🍽", title: "Know your plate", text: "Describe or photograph a meal and get carbs, sugar, protein and fat estimated." },
  { icon: "📈", title: "See the trend", text: "Time in range, estimated A1C and week-over-week shifts, on one dashboard." },
  { icon: "🛒", title: "Shop the plan", text: "Diabetic-friendly recipes that build your shopping list in one tap." },
];

const ORBS = [
  "left-[-120px] top-[-100px] size-[420px] bg-[#1f5c3a]",
  "right-[-100px] top-[24%] size-[360px] bg-[#6a5614] [animation-delay:-5s] [animation-duration:20s]",
  "left-[18%] bottom-[-120px] size-[300px] bg-[#173c52] [animation-delay:-10s] [animation-duration:24s]",
];

export default function Splash() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 pt-10 pb-14 max-md:px-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ORBS.map((orb, i) => (
          <span
            key={i}
            className={`animate-drift absolute rounded-full opacity-35 blur-[70px] motion-reduce:animate-none ${orb}`}
          />
        ))}
      </div>

      <main className="relative w-full max-w-[880px] text-center">
        <FadeIn delayMs={0}>
          <div className="mb-6 inline-flex items-center gap-3 text-[1.1rem] font-extrabold">
            <span className="animate-pulse-mark grid size-[34px] place-items-center rounded-[9px] bg-accent
              font-mono text-[15px] font-bold text-accent-ink shadow-raised motion-reduce:animate-none">
              GL
            </span>
            GlucoLog
          </div>
        </FadeIn>

        <FadeIn delayMs={120}>
          <h1 className="mb-4 text-[clamp(2.3rem,7vw,4.2rem)] leading-[1.04] tracking-tighter">
            Your numbers.
            <br />
            <em className="animate-shimmer bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-soft),var(--color-accent))]
              bg-[length:200%_100%] bg-clip-text text-transparent not-italic motion-reduce:animate-none">
              Your food.
            </em>{" "}
            Your plan.
          </h1>
        </FadeIn>

        <FadeIn delayMs={240}>
          <p className="mx-auto mb-2.5 max-w-[560px] text-[clamp(0.95rem,2.4vw,1.1rem)] text-muted">
            A personal field lab for living well with diabetes — log glucose with a photo, track
            meals with AI-estimated macros, and watch your time in range grow.
          </p>
        </FadeIn>

        <FadeIn delayMs={360}>
          <HeroWave />
        </FadeIn>

        <FadeIn delayMs={480}>
          <Link
            to={ROUTES.dashboard}
            className="group inline-flex items-center gap-2 rounded-xl border border-accent bg-accent
              px-7 py-3.5 text-[1.05rem] font-bold text-accent-ink no-underline
              shadow-[4px_4px_0_rgba(0,0,0,0.45),0_0_24px_rgba(255,210,63,0.25)]
              transition-transform hover:-translate-x-px hover:-translate-y-px"
          >
            Start tracking
            <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
          </Link>
        </FadeIn>

        <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3.5 text-left">
          {FEATURES.map((feature, i) => (
            <FadeIn delayMs={600 + i * 110} key={feature.title}>
              <div className="h-full rounded-xl border border-line bg-surface/75 p-4 backdrop-blur-[4px]
                transition-[transform,border-color] duration-150 hover:-translate-y-1 hover:border-line-strong">
                <span
                  aria-hidden="true"
                  className="animate-bob inline-block text-2xl motion-reduce:animate-none"
                  style={{ animationDelay: `${i * -0.8}s` }}
                >
                  {feature.icon}
                </span>
                <h3 className="mt-2 mb-1 text-[0.95rem]">{feature.title}</h3>
                <p className="m-0 text-[0.82rem] text-muted">{feature.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delayMs={1100}>
          <p className="mt-9 text-[0.72rem] text-faint">
            Runs entirely on your machine · Not medical advice — always confirm readings with your meter.
          </p>
        </FadeIn>
      </main>
    </div>
  );
}
