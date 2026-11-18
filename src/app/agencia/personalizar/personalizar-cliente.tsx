"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarPersonalizacaoAction } from "@/app/actions/agencias";
import { AGENCIA_FUNCOES, PECA_ETAPAS, PECA_TIPOS, type AgenciaFuncao, type PecaEtapa, type PecaTipo } from "@/db/schema";
import { MODULO_ROTULO, MODULOS_OPCIONAIS, NOMES_CHAVES, type ModuloOpcional, type NomeChave, type Segmento } from "@/lib/agencias/personalizacao";

export type Estado = {
  segmento: Segmento;
  nomes: Record<NomeChave, string>;
  funcoes: Record<AgenciaFuncao, { nome: string; ativa: boolean }>;
  etapas: Record<PecaEtapa, { nome: string; ativa: boolean; cliente: string; funcao: AgenciaFuncao }>;
  tipos: Record<PecaTipo, { nome: string; ativo: boolean; pulaExecucao: boolean }>;
  modulos: Record<ModuloOpcional, boolean>;
  exigirLinks: boolean;
};

const NOME_ROTULO: Record<NomeChave, string> = { painel: "Nome do painel", cliente: "Cliente (um)", clientes: "Clientes (vários)", entrega: "Entrega (uma)", entregas: "Entregas (várias)", producao: "Tela do trabalho" };
const FIXAS: AgenciaFuncao[] = ["ADMIN", "GESTOR"];
const campo = "h-9 w-full rounded-md border border-border bg-surface px-2 text-sm";
const Secao = ({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children: React.ReactNode }) => (
  <section aria-labelledby={id} className="rounded-2xl border border-border bg-surface p-5">
    <h2 id={id} className="text-base font-semibold">{titulo}</h2><p className="mt-1 text-sm text-muted-foreground">{texto}</p>
    <div className="mt-4">{children}</div>
  </section>
);

/** Tela de personalização (D340). Trocar o modelo carrega os nomes dele; o que você editar depois por cima fica gravado. */
export function Personalizar({ atual, modelos, segmentos }: { atual: Estado; modelos: Record<string, Estado>; segmentos: { chave: Segmento; rotulo: string; descricao: string }[] }) {
  const router = useRouter();
  const [e, setE] = React.useState<Estado>(atual);
  const [pending, start] = React.useTransition();
  const mudou = JSON.stringify(e) !== JSON.stringify(atual);
  const trocarModelo = (s: Segmento) => {
    if (s === e.segmento) return;
    if (mudou && !window.confirm("Trocar o modelo carrega os nomes dele e descarta o que você mudou nesta tela e ainda não salvou. Continuar?")) return;
    setE(structuredClone(modelos[s]!));
  };
  const ativas = AGENCIA_FUNCOES.filter((k) => e.funcoes[k].ativa);
  const salvar = () => start(async () => {
    const r = await salvarPersonalizacaoAction({ segmento: e.segmento, nomes: e.nomes, funcoes: e.funcoes, etapas: e.etapas, tipos: e.tipos, modulos: e.modulos, exigirLinks: e.exigirLinks });
    if (r.ok) { toast.success("Painel personalizado. A equipe já vê os nomes novos."); router.refresh(); } else toast.error(r.error);
  });
  return (
    <div className="space-y-5">
      <Secao id="p-modelo" titulo="1. Modelo do seu segmento" texto="O ponto de partida: nomes de departamentos, etapas e entregas já pensados para o seu tipo de empresa. Depois, mude o que quiser.">
        <div role="radiogroup" aria-label="Modelo do segmento" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {segmentos.map((s) => (
            <button key={s.chave} type="button" role="radio" aria-checked={e.segmento === s.chave} onClick={() => trocarModelo(s.chave)}
              className={`rounded-xl border p-3 text-left text-sm ${e.segmento === s.chave ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10" : "border-border hover:border-[var(--ds-link)]"}`}>
              <b className="block">{s.rotulo}</b><span className="mt-1 block text-xs text-muted-foreground">{s.descricao}</span>
            </button>
          ))}
        </div>
      </Secao>

      <Secao id="p-nomes" titulo="2. Nomes principais" texto="Como a sua equipe chama as coisas. Aparece no menu, nas telas e no portal do cliente.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NOMES_CHAVES.map((k) => <label key={k} className="text-sm font-medium">{NOME_ROTULO[k]}<Input value={e.nomes[k]} maxLength={40} onChange={(x) => setE({ ...e, nomes: { ...e.nomes, [k]: x.target.value } })} className="mt-1" /></label>)}
        </div>
      </Secao>

      <Secao id="p-dep" titulo="3. Departamentos" texto="As áreas da equipe. Cada pessoa fica em um departamento. Desligue os que a sua empresa não tem; Administrador e Gestor ficam sempre (cuidam das permissões).">
        <ul className="grid gap-2 md:grid-cols-2">
          {AGENCIA_FUNCOES.map((k) => (
            <li key={k} className="flex items-center gap-3 rounded-lg border border-border p-2">
              {FIXAS.includes(k) ? <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Sempre ligado" /> : <input type="checkbox" checked={e.funcoes[k].ativa} aria-label={`Departamento ${e.funcoes[k].nome} ligado`} onChange={(x) => setE({ ...e, funcoes: { ...e.funcoes, [k]: { ...e.funcoes[k], ativa: x.target.checked } } })} className="size-4 accent-[var(--ds-link)]" />}
              <input value={e.funcoes[k].nome} maxLength={40} aria-label={`Nome do departamento ${k.toLowerCase()}`} onChange={(x) => setE({ ...e, funcoes: { ...e.funcoes, [k]: { ...e.funcoes[k], nome: x.target.value } } })} className={campo} disabled={!e.funcoes[k].ativa} />
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="p-etapas" titulo="4. Etapas do trabalho" texto="O caminho de cada entrega, na ordem. Desligue as etapas que não usa (elas são puladas), dê o nome da sua empresa, diga quem recebe e o que o cliente vê no portal.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-2 font-medium">Usa</th><th className="py-2 pr-2 font-medium">Nome da etapa</th><th className="py-2 pr-2 font-medium">Quem recebe</th><th className="py-2 font-medium">O cliente vê</th></tr></thead>
            <tbody>
              {PECA_ETAPAS.map((k) => {
                const x = e.etapas[k]; const set = (p: Partial<typeof x>) => setE({ ...e, etapas: { ...e.etapas, [k]: { ...x, ...p } } });
                return (
                  <tr key={k} className="border-t border-border">
                    <td className="py-2 pr-2">{k === "PUBLICADO" ? <Lock className="size-4 text-muted-foreground" aria-label="Etapa final, sempre ligada" /> : <input type="checkbox" checked={x.ativa} aria-label={`Usar a etapa ${x.nome}`} onChange={(c) => set({ ativa: c.target.checked })} className="size-4 accent-[var(--ds-link)]" />}</td>
                    <td className="py-2 pr-2"><input value={x.nome} maxLength={40} aria-label={`Nome da etapa ${k.toLowerCase()}`} disabled={!x.ativa} onChange={(c) => set({ nome: c.target.value })} className={campo} /></td>
                    <td className="py-2 pr-2"><select value={ativas.includes(x.funcao) ? x.funcao : "GESTOR"} aria-label={`Quem recebe a etapa ${x.nome}`} disabled={!x.ativa} onChange={(c) => set({ funcao: c.target.value as AgenciaFuncao })} className={campo}>{ativas.map((f) => <option key={f} value={f}>{e.funcoes[f].nome}</option>)}</select></td>
                    <td className="py-2"><input value={x.cliente} maxLength={40} aria-label={`O que o cliente vê na etapa ${x.nome}`} disabled={!x.ativa} onChange={(c) => set({ cliente: c.target.value })} className={campo} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={e.exigirLinks} onChange={(c) => setE({ ...e, exigirLinks: c.target.checked })} className="mt-0.5 size-4 accent-[var(--ds-link)]" /><span><b>Exigir links para avançar</b><span className="block text-xs text-muted-foreground">Pede o link dos arquivos, da versão pronta e da entrega final antes de passar adiante (comum em agências).</span></span></label>
      </Secao>

      <Secao id="p-tipos" titulo={`5. Tipos de ${e.nomes.entrega.toLowerCase()}`} texto="Os tipos que a equipe escolhe ao criar uma entrega. Marque “pula a execução” para os que vão direto do planejamento ao acabamento.">
        <ul className="grid gap-2 md:grid-cols-2">
          {PECA_TIPOS.map((k) => {
            const x = e.tipos[k]; const set = (p: Partial<typeof x>) => setE({ ...e, tipos: { ...e.tipos, [k]: { ...x, ...p } } });
            return (
              <li key={k} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-2">
                <input type="checkbox" checked={x.ativo} aria-label={`Usar o tipo ${x.nome}`} onChange={(c) => set({ ativo: c.target.checked })} className="size-4 accent-[var(--ds-link)]" />
                <input value={x.nome} maxLength={40} aria-label={`Nome do tipo ${k.toLowerCase()}`} disabled={!x.ativo} onChange={(c) => set({ nome: c.target.value })} className={`${campo} min-w-0 flex-1`} />
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={x.pulaExecucao} disabled={!x.ativo} onChange={(c) => set({ pulaExecucao: c.target.checked })} className="size-3.5 accent-[var(--ds-link)]" />pula a execução</label>
              </li>
            );
          })}
        </ul>
      </Secao>

      <Secao id="p-menu" titulo="6. O que aparece no menu" texto="Esconda as gavetas que a sua empresa não usa. Nada é apagado: dá para ligar de novo quando quiser.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {MODULOS_OPCIONAIS.map((k) => <li key={k}><label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={e.modulos[k]} onChange={(c) => setE({ ...e, modulos: { ...e.modulos, [k]: c.target.checked } })} className="size-4 accent-[var(--ds-link)]" />{MODULO_ROTULO[k]}</label></li>)}
        </ul>
      </Secao>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-[var(--ds-shadow-md)] backdrop-blur">
        <span className="text-sm text-muted-foreground">{mudou ? "Mudanças ainda não salvas." : "Tudo salvo."}</span>
        <Button type="button" variant="secondary" disabled={!mudou || pending} onClick={() => setE(atual)}>Desfazer</Button>
        <Button type="button" loading={pending} disabled={!mudou} onClick={salvar}><Save aria-hidden />Salvar</Button>
      </div>
    </div>
  );
}
