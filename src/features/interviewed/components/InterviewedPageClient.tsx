"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/shared/components/AppHeader";
import {
  type Candidato,
  type Vaga,
  fetchCandidatos,
  fetchVagas,
  patchCandidatoEtapa,
} from "@/features/talent-bank/services/talentBankApi";

const ETAPAS_ENTREVISTADOS = [
  "Entrevista RH",
  "Entrevista Gestor",
  "Teste Tecnico",
  "Teste Técnico",
  "Proposta",
  "Contratado",
];

function normalize(value: string | undefined | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeEtapa(etapa: string | undefined | null) {
  const value = normalize(etapa);
  const map: Record<string, string> = {
    "entrevista rh": "Entrevista RH",
    "entrevista gestor": "Entrevista Gestor",
    "teste tecnico": "Teste Tecnico",
    proposta: "Proposta",
    contratado: "Contratado",
  };
  return map[value] || (etapa || "");
}

function etapaBadgeClass(etapa: string | undefined | null) {
  const value = normalize(etapa).replace(/\s+/g, "-");
  return `badge-etapa ${value || "inscricao"}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR");
}

export function InterviewedPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroVaga, setFiltroVaga] = useState("");
  const [sortBy, setSortBy] = useState("recentes");

  const [selected, setSelected] = useState<Candidato | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [cand, vg] = await Promise.all([fetchCandidatos(), fetchVagas()]);
      setCandidatos(cand);
      setVagas(vg);
    } catch {
      setError("Erro ao carregar candidatos entrevistados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const entrevistados = useMemo(() => {
    const allowed = ETAPAS_ENTREVISTADOS.map((item) => normalizeEtapa(item));

    const list = candidatos
      .filter((cand) => allowed.includes(normalizeEtapa(cand.etapa)))
      .filter((cand) => {
        const blob = `${cand.nome || ""} ${cand.email || ""} ${cand.cargo_desejado || ""}`.toLowerCase();
        const matchTexto = !filtroTexto || blob.includes(filtroTexto.toLowerCase());
        const matchEtapa = !filtroEtapa || normalizeEtapa(cand.etapa) === filtroEtapa;
        const matchVaga = !filtroVaga || String(cand.vaga_id || "") === filtroVaga;
        return matchTexto && matchEtapa && matchVaga;
      });

    list.sort((a, b) => {
      const da = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const db = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      if (sortBy === "antigos") return da - db;
      if (sortBy === "nome_az") return normalize(a.nome).localeCompare(normalize(b.nome));
      if (sortBy === "nome_za") return normalize(b.nome).localeCompare(normalize(a.nome));
      return db - da;
    });

    return list;
  }, [candidatos, filtroTexto, filtroEtapa, filtroVaga, sortBy]);

  const getVagaTitulo = (cand: Candidato) => {
    const match = vagas.find((vaga) => String(vaga.id) === String(cand.vaga_id || ""));
    return match?.titulo || cand.vaga_titulo || (cand.vaga_id ? `Vaga ${cand.vaga_id}` : "—");
  };

  const handleDecision = async (cand: Candidato, etapa: "Contratado" | "Reprovado") => {
    try {
      setProcessingId(cand.id);
      await patchCandidatoEtapa(cand.id, etapa);
      setCandidatos((prev) => prev.map((item) => (item.id === cand.id ? { ...item, etapa } : item)));
    } catch {
      setError("Não foi possível atualizar a etapa deste candidato.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page-shell">
      <AppHeader />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">Candidatos Entrevistados</h1>
            <p className="mt-1 text-sm text-slate-500">Candidatos que passaram por entrevista (RH, Gestor ou etapas posteriores)</p>
          </div>
          <div className="pill border border-[var(--brand)]/20 bg-white text-[var(--brand)] px-4 py-2 rounded-lg text-sm font-extrabold shadow-sm">{entrevistados.length}</div>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Buscar</label>
              <input
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                type="text"
                placeholder="Nome, email, cargo..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Etapa</label>
              <select
                value={filtroEtapa}
                onChange={(e) => setFiltroEtapa(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
              >
                <option value="">Todas</option>
                <option value="Entrevista RH">Entrevista RH</option>
                <option value="Entrevista Gestor">Entrevista Gestor</option>
                <option value="Teste Tecnico">Teste Técnico</option>
                <option value="Proposta">Proposta</option>
                <option value="Contratado">Contratado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Vaga</label>
              <select
                value={filtroVaga}
                onChange={(e) => setFiltroVaga(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
              >
                <option value="">Todas as vagas</option>
                {vagas.map((vaga) => (
                  <option key={vaga.id} value={String(vaga.id)}>
                    {vaga.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ordenar</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
                <option value="nome_az">Nome A-Z</option>
                <option value="nome_za">Nome Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 font-semibold flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="text-red-700/70 hover:text-red-700 text-xs font-black">FECHAR</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--brand)] border-t-transparent"></div>
            <p className="mt-4 text-sm text-slate-500 font-semibold">Carregando candidatos...</p>
          </div>
        ) : entrevistados.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <h3 className="mt-2 text-lg font-semibold text-slate-700">Nenhum candidato entrevistado</h3>
            <p className="mt-2 text-sm text-slate-500">Não há candidatos que passaram por entrevista no momento.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-soft w-full">
                <thead>
                  <tr>
                    <th className="text-left">Candidato</th>
                    <th className="text-left">Cargo</th>
                    <th className="text-left">Etapa</th>
                    <th className="text-left">Vaga</th>
                    <th className="text-left">Criado em</th>
                    <th className="text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {entrevistados.map((cand) => (
                    <tr key={cand.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-800">{cand.nome || "—"}</p>
                          <p className="text-xs text-slate-500">{cand.email || "—"}</p>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm">{cand.cargo_desejado || "—"}</p>
                        <p className="text-xs text-slate-500">{cand.senioridade || "—"}</p>
                      </td>
                      <td>
                        <span className={etapaBadgeClass(cand.etapa)}>{normalizeEtapa(cand.etapa) || "—"}</span>
                      </td>
                      <td className="text-sm">{getVagaTitulo(cand)}</td>
                      <td className="text-sm text-slate-500">{formatDate(cand.criado_em)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(cand)}
                            className="text-[var(--brand)] hover:underline text-sm font-semibold transition-colors"
                          >
                            Ver detalhes
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDecision(cand, "Contratado")}
                            disabled={processingId === cand.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-60"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDecision(cand, "Reprovado")}
                            disabled={processingId === cand.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-60"
                          >
                            ✗ Reprovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-start sm:items-center justify-center z-40 py-4 sm:py-0" onClick={() => setSelected(null)}>
          <div className="modal-card p-6 w-full mx-4 sm:mx-0 max-w-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="absolute top-3 right-3 text-slate-400 hover:text-[var(--brand)] text-2xl font-black" aria-label="Fechar detalhes">
              ×
            </button>
            <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-4">{selected.nome || "Candidato"}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
                <p className="text-sm text-slate-700">{selected.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Telefone</p>
                <p className="text-sm text-slate-700">{selected.telefone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Cargo Desejado</p>
                <p className="text-sm text-slate-700">{selected.cargo_desejado || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Senioridade</p>
                <p className="text-sm text-slate-700">{selected.senioridade || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Etapa</p>
                <span className={etapaBadgeClass(selected.etapa)}>{normalizeEtapa(selected.etapa) || "—"}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Vaga</p>
                <p className="text-sm text-slate-700">{getVagaTitulo(selected)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Cidade</p>
                <p className="text-sm text-slate-700">{selected.cidade || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Criado em</p>
                <p className="text-sm text-slate-700">{formatDate(selected.criado_em)}</p>
              </div>
              {selected.historico && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Histórico</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.historico}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
