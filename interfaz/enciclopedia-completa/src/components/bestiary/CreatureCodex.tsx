"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Crosshair,
  Dna,
  Edit3,
  HeartPulse,
  MapPin,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Zap,
} from "lucide-react";
import creatureFallback from "@/assets/creature-main.jpg";
import { assetUrl } from "@/lib/asset-url";

export type CreatureRecord = {
  source_id: string;
  common_name: string;
  scientific_name?: string | null;
  rarity?: string | null;
  danger?: string | null;
  danger_icon?: string | null;
  capture_level?: string | null;
  capture_difficulty?: string | null;
  capture_ritual?: string | null;
  size?: string | null;
  habitat?: string | null;
  diet?: string | null;
  base_hp?: number | null;
  base_attack?: number | null;
  base_defense?: number | null;
  speed?: number | null;
  power_level?: string | null;
};
const groups = [
  ["Identidad", Dna, ["scientific_name", "rarity", "size"]],
  ["Ecología", MapPin, ["habitat", "diet"]],
  ["Amenaza", Skull, ["danger", "power_level"]],
  ["Captura", Crosshair, ["capture_level", "capture_difficulty", "capture_ritual"]],
] as const;
const labels: Record<string, string> = {
  scientific_name: "Nombre científico",
  rarity: "Rareza",
  size: "Tamaño",
  habitat: "Hábitat",
  diet: "Dieta",
  danger: "Nivel de peligro",
  power_level: "Poder",
  capture_level: "Nivel de captura",
  capture_difficulty: "Dificultad",
  capture_ritual: "Ritual de captura",
};

export function CreatureCodex({ creature }: { creature: CreatureRecord }) {
  const reduceMotion = useReducedMotion();
  const stats = [
    ["Vitalidad", creature.base_hp ?? 0, HeartPulse],
    ["Ataque", creature.base_attack ?? 0, Swords],
    ["Defensa", creature.base_defense ?? 0, Shield],
    ["Velocidad", creature.speed ?? 0, Zap],
  ] as const;
  const max = Math.max(100, ...stats.map(([, value]) => Number(value)));
  return (
    <main
      id="main-content"
      className="min-h-screen overflow-hidden bg-[oklch(.065_.012_250)] text-white"
    >
      <section className="relative min-h-[72vh] border-b border-gold/20">
        <img
          src={assetUrl(creatureFallback)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,transparent_0%,oklch(.06_.014_250/.42)_42%,oklch(.045_.01_250)_82%),linear-gradient(90deg,oklch(.045_.01_250/.96),transparent_75%)]" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-[1700px] flex-col justify-between px-5 py-6 md:px-10 xl:pl-24">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/archivo-real"
              className="flex min-h-11 items-center gap-2 font-mono text-[9px] tracking-[.25em] text-gold"
            >
              <ArrowLeft size={15} /> ARCHIVO REAL
            </Link>
            <Link
              href={`/editor?kind=creature&source=${encodeURIComponent(creature.source_id)}`}
              className="flex min-h-11 items-center gap-2 rounded border border-gold/30 bg-black/35 px-4 font-mono text-[9px] tracking-wider text-gold backdrop-blur"
            >
              <Edit3 size={14} /> EDITAR FICHA
            </Link>
          </div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl pb-10"
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded border border-red-400/30 bg-red-400/10 px-3 py-1 font-mono text-[9px] tracking-wider text-red-200">
                {creature.danger_icon} {creature.danger || "AMENAZA SIN CLASIFICAR"}
              </span>
              <span className="rounded border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[9px] tracking-wider text-gold">
                {creature.rarity || "RAREZA DESCONOCIDA"}
              </span>
            </div>
            <p className="font-mono text-[9px] tracking-[.42em] text-cyan-300">
              CODEX BESTIARUM · SPECIMEN {creature.source_id}
            </p>
            <h1 className="mt-4 font-orbitron text-4xl leading-none md:text-7xl">
              {creature.common_name}
            </h1>
            {creature.scientific_name && (
              <p className="mt-4 font-serif text-xl italic text-gold/75">
                {creature.scientific_name}
              </p>
            )}
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/55">
              Registro biológico completo enlazado al Archivo Real. Anatomía, ecología, peligrosidad
              y protocolos de captura reunidos en una sola ficha visual.
            </p>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1700px] gap-5 px-4 py-8 pb-28 md:px-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:pl-24">
        <div className="grid gap-5 sm:grid-cols-2">
          {groups.map(([title, Icon, names], index) => (
            <motion.article
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass-premium rounded-xl border border-gold/15 p-5"
            >
              <div className="flex items-center gap-3 border-b border-gold/10 pb-4">
                <span className="grid h-10 w-10 place-items-center rounded border border-gold/20 bg-gold/10">
                  <Icon size={17} className="text-gold" />
                </span>
                <div>
                  <p className="font-mono text-[8px] tracking-[.28em] text-gold/55">
                    EXPEDIENTE {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-orbitron text-base">{title}</h2>
                </div>
              </div>
              <dl className="mt-4 grid gap-3">
                {names.map((name) => (
                  <div
                    key={name}
                    className="grid grid-cols-[120px_1fr] gap-3 border-b border-white/5 pb-3 last:border-0"
                  >
                    <dt className="font-mono text-[8px] uppercase tracking-wider text-white/35">
                      {labels[name]}
                    </dt>
                    <dd className="text-sm text-white/72">
                      {String(creature[name as keyof CreatureRecord] ?? "No documentado")}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          ))}
        </div>
        <aside className="space-y-5">
          <article className="glass-premium rounded-xl border border-cyan-300/15 p-5">
            <div className="flex items-center gap-3">
              <Activity className="text-cyan-300" />
              <div>
                <p className="font-mono text-[8px] tracking-[.25em] text-cyan-300/55">
                  MATRIZ BIOLÓGICA
                </p>
                <h2 className="font-orbitron">Capacidades base</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-5">
              {stats.map(([label, value, Icon]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white/55">
                      <Icon size={13} />
                      {label}
                    </span>
                    <strong className="font-mono text-cyan-200">{value}</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(100, (Number(value) / max) * 100)}%` }}
                      viewport={{ once: true }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-gold shadow-[0_0_12px_rgba(34,211,238,.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-xl border border-red-400/20 bg-red-400/[.045] p-5">
            <Target className="text-red-300" />
            <p className="mt-4 font-mono text-[8px] tracking-[.25em] text-red-200/60">
              PROTOCOLO DE CAMPO
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {creature.capture_difficulty || "Evaluación pendiente"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {creature.capture_ritual ||
                "No existe un procedimiento de captura documentado para este espécimen."}
            </p>
          </article>
          <div className="flex items-center gap-3 rounded-xl border border-gold/15 p-4 text-xs text-white/45">
            <Sparkles size={16} className="text-gold" />
            Ficha generada desde los datos reales de Supabase.
          </div>
        </aside>
      </section>
    </main>
  );
}
