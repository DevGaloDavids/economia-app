export interface ConfiguracionCartera {
  nombre: string;
  icono: string;
  gradientClass: string;
  glowClass: string;
  textClass: string;
  badgeClass: string;
  strokeColor: string;
  stopColor: string;
  gradId: string;
}

export const configuracionCarteras: ConfiguracionCartera[] = [
  {
    nombre: "Revolut C.P.",
    icono: "💳",
    gradientClass:
      "from-purple-950/50 via-slate-900 to-slate-900 border-purple-800/40",
    glowClass: "bg-purple-500/15",
    textClass: "text-purple-400",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    strokeColor: "#c084fc",
    stopColor: "#a855f7",
    gradId: "purpleGrad",
  },
  {
    nombre: "Revolut C.R.",
    icono: "👑",
    gradientClass:
      "from-amber-950/40 via-slate-900 to-slate-900 border-amber-600/30",
    glowClass: "bg-amber-500/15",
    textClass: "text-amber-400",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    strokeColor: "#fbbf24",
    stopColor: "#f59e0b",
    gradId: "amberGrad",
  },
  {
    nombre: "Efectivo",
    icono: "💵",
    gradientClass:
      "from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-700/40",
    glowClass: "bg-emerald-500/15",
    textClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    strokeColor: "#34d399",
    stopColor: "#10b981",
    gradId: "emeraldGrad",
  },
  {
    nombre: "Trade",
    icono: "📈",
    gradientClass:
      "from-zinc-950 via-zinc-900 to-black border-zinc-700/50",
    glowClass: "bg-zinc-500/10",
    textClass: "text-zinc-300",
    badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    strokeColor: "#a1a1aa",
    stopColor: "#71717a",
    gradId: "zincGrad",
  },
  {
    nombre: "Axa",
    icono: "🛡️",
    gradientClass:
      "from-blue-950/60 via-slate-900 to-slate-900 border-blue-700/40",
    glowClass: "bg-blue-500/15",
    textClass: "text-blue-400",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    strokeColor: "#60a5fa",
    stopColor: "#3b82f6",
    gradId: "blueGrad",
  },
];
