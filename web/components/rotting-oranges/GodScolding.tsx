"use client";

type GodScoldingProps = {
  message: string;
  subtitle?: string;
  onDismiss: () => void;
};

export function GodScolding({ message, subtitle, onDismiss }: GodScoldingProps) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="relative max-w-xl overflow-hidden rounded-2xl border border-amber-200/30 bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-200/30 blur-3xl" />
        <p className="text-center text-xs uppercase tracking-[0.35em] text-amber-200/80">
          A voice from above
        </p>
        <h3 className="mt-3 text-center text-3xl font-semibold text-amber-100">
          Thou hast displeased the runtime gods
        </h3>
        <p className="mt-5 text-center text-lg leading-relaxed text-slate-200">{message}</p>
        {subtitle && (
          <p className="mt-3 text-center text-sm text-slate-400">{subtitle}</p>
        )}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full bg-amber-200 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-100"
          >
            I shall refactor
          </button>
        </div>
      </div>
    </div>
  );
}
