import type { Cutoffs } from "@/db/schema";

export type Ops = { timezone: string; cutoffs: Cutoffs; holidays: string[] };
export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const DAY_LABEL: Record<(typeof DAY_KEYS)[number], string> = { sun: "Domingo", mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta", fri: "Sexta", sat: "Sábado" };
export const DEFAULT_CUTOFFS: Cutoffs = { mon: "14:00", tue: "14:00", wed: "14:00", thu: "14:00", fri: "14:00", sat: null, sun: null };

type Parts = { y: number; m: number; d: number; hh: number; mm: number; dow: number };

/** Componentes de data/hora do instante `at` no fuso `tz` (sem bibliotecas: Intl). */
export function localParts(at: Date, tz: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(at)) o[p.type] = p.value;
  return { y: +o.year!, m: +o.month!, d: +o.day!, hh: +o.hour!, mm: +o.minute!, dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday!) };
}

const pad = (n: number) => String(n).padStart(2, "0");
export const localDate = (at: Date, tz: string) => { const p = localParts(at, tz); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };

/** Instante UTC de "data local + HH:MM" no fuso `tz` (convergência por diferença de offset; correta em mudanças de horário). */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  let guess = Date.UTC(y, m - 1, d, hh, mm);
  for (let i = 0; i < 3; i++) {
    const p = localParts(new Date(guess), tz);
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm);
    const diff = Date.UTC(y, m - 1, d, hh, mm) - asUtc;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

const addDays = (date: string, n: number) => { const [y, m, d] = date.split("-").map(Number) as [number, number, number]; const t = new Date(Date.UTC(y, m - 1, d + n)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
const dowOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Horário de corte de um dia local, ou null se não há expedição (dia sem corte configurado ou feriado). */
export function cutoffOn(ops: Ops, date: string): string | null {
  if (ops.holidays.includes(date)) return null;
  return ops.cutoffs[DAY_KEYS[dowOf(date)]!] ?? null;
}

/** Primeiro dia de expedição a partir de `fromDate` (inclusive). Sem nenhum dia configurado, devolve `fromDate`. */
export function nextWorkingDate(ops: Ops, fromDate: string): string {
  for (let i = 0; i < 400; i++) { const d = addDays(fromDate, i); if (cutoffOn(ops, d)) return d; }
  return fromDate;
}

/** A qual dia de expedição pertence um pedido liberado em `releasedAt`: hoje se ainda antes do corte, senão o próximo dia útil. */
export function waveDateFor(ops: Ops, releasedAt: Date): string {
  const today = localDate(releasedAt, ops.timezone);
  const c = cutoffOn(ops, today);
  if (c && releasedAt.getTime() < zonedToUtc(today, c, ops.timezone).getTime()) return today;
  return nextWorkingDate(ops, addDays(today, 1));
}

export type CutoffStatus = { today: string; cutoffAt: Date | null; minutesLeft: number | null; state: "OPEN" | "CLOSED" | "NO_SHIPPING"; nextWorkingDate: string; nextCutoffAt: Date };

/** Situação do corte agora: quanto falta para fechar hoje (ou "sem expedição hoje") e qual é o próximo corte. */
export function cutoffStatus(ops: Ops, now: Date): CutoffStatus {
  const today = localDate(now, ops.timezone);
  const c = cutoffOn(ops, today);
  const cutoffAt = c ? zonedToUtc(today, c, ops.timezone) : null;
  const open = cutoffAt !== null && now.getTime() < cutoffAt.getTime();
  const nextDate = open ? today : nextWorkingDate(ops, addDays(today, 1));
  const nextC = cutoffOn(ops, nextDate) ?? "14:00";
  return {
    today, cutoffAt,
    minutesLeft: open ? Math.ceil((cutoffAt!.getTime() - now.getTime()) / 60_000) : null,
    state: !c ? "NO_SHIPPING" : open ? "OPEN" : "CLOSED",
    nextWorkingDate: nextDate,
    nextCutoffAt: zonedToUtc(nextDate, nextC, ops.timezone),
  };
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h${pad(m)}` : `${m} min`;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validateOps(o: Ops): string | null {
  for (const k of DAY_KEYS) { const v = o.cutoffs[k]; if (v !== null && !HHMM.test(v)) return `Horário inválido em ${DAY_LABEL[k]} (use HH:MM).`; }
  if (o.holidays.some((h) => !/^\d{4}-\d{2}-\d{2}$/.test(h))) return "Feriado com data inválida (use AAAA-MM-DD).";
  try { new Intl.DateTimeFormat("en-US", { timeZone: o.timezone }); } catch { return "Fuso horário inválido."; }
  if (!DAY_KEYS.some((k) => o.cutoffs[k])) return "Configure ao menos um dia de expedição.";
  return null;
}
