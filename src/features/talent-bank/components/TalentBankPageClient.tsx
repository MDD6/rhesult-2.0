"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Candidato,
  type CreateCandidatoInput,
  type Vaga,
  createCandidato,
  deleteCandidato,
  fetchCandidatos,
  fetchVagas,
  patchCandidatoEtapa,
  updateCandidato,
} from "../services/talentBankApi";
import { AppHeader } from "@/shared/components/AppHeader";

type ViewMode = "dashboard" | "lista" | "cards";
type ExportScope = "filtered" | "page" | "selected";
type ExportFormat = "csv" | "json";
type ExportColumnKey = keyof Pick<
  Candidato,
  | "id"
  | "nome"
  | "email"
  | "telefone"
  | "cargo_desejado"
  | "senioridade"
  | "cidade"
  | "vaga_id"
  | "vaga_titulo"
  | "etapa"
  | "criado_em"
  | "origem"
  | "linkedin"
  | "curriculum_url"
>;

const ETAPAS = [
  "Inscricao",
  "Pre-selecao",
  "Triagem",
  "Entrevista RH",
  "Entrevista Gestor",
  "Teste Tecnico",
  "Proposta",
  "Contratado",
  "Reprovado",
  "Portfolio",
];

const SENIORIDADES = ["Estagiario", "Junior", "Pleno", "Senior", "Especialista"];

const EXPORT_COLUMNS: { key: ExportColumnKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "cargo_desejado", label: "Cargo desejado" },
  { key: "senioridade", label: "Senioridade" },
  { key: "cidade", label: "Cidade" },
  { key: "vaga_id", label: "Vaga (ID)" },
  { key: "vaga_titulo", label: "Vaga (Título)" },
  { key: "etapa", label: "Etapa" },
  { key: "criado_em", label: "Criado em" },
  { key: "origem", label: "Origem" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "curriculum_url", label: "Currículo URL" },
];

function createInitialCandidatoForm(): CreateCandidatoInput {
  return {
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    senioridade: "",
    cargo_desejado: "",
    etapa: "Inscricao",
    vaga_id: null,
    origem: "Banco de Talentos",
    historico: "",
    linkedin: "",
    curriculum_url: "",
  };
}

function normalize(value: string | undefined | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isValidEmail(value?: string) {
  const email = String(value || "").trim();
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function onlyDigits(value?: string) {
  return String(value || "").replace(/\D/g, "");
}

function isValidPhone(value?: string) {
  const digits = onlyDigits(value);
  if (!digits) return true;
  return digits.length >= 8;
}

function formatPhone(value?: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function resolveCurriculumLink(url?: string) {
  const value = String(url || "").trim();
  if (!value) return "";

  if (value.startsWith("/uploads/")) {
    return `/api/public${value}`;
  }

  return value;
}

function badgeClass(etapa?: string) {
  const key = normalize(etapa);
  if (key.includes("contratado")) return "badge-etapa contratado";
  if (key.includes("proposta")) return "badge-etapa proposta";
  if (key.includes("entrevista rh")) return "badge-etapa entrevista-rh";
  if (key.includes("entrevista gestor")) return "badge-etapa entrevista-gestor";
  if (key.includes("triagem")) return "badge-etapa triagem";
  if (key.includes("reprovado")) return "badge-etapa reprovado";
  return "badge-etapa inscricao";
}

function toCsv(rows: Candidato[], columns: ExportColumnKey[]) {
  const headers = [...columns];

  const escapeCsv = (value: unknown) => {
    const content = String(value ?? "").replace(/"/g, '""');
    return `"${content}"`;
  };

  const lines = rows.map((row) =>
    columns.map((column) => row[column])
      .map(escapeCsv)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

function downloadFile(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TalentBankPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vagasError, setVagasError] = useState("");
  const [view, setView] = useState<ViewMode>("dashboard");

  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroSenioridade, setFiltroSenioridade] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroVaga, setFiltroVaga] = useState("");

  const [sortBy, setSortBy] = useState("recentes");
  const [porPagina, setPorPagina] = useState(9);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkEtapa, setBulkEtapa] = useState("");

  const [detalhe, setDetalhe] = useState<Candidato | null>(null);
  const [modalEtapa, setModalEtapa] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("filtered");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportColumns, setExportColumns] = useState<ExportColumnKey[]>([
    "id",
    "nome",
    "email",
    "telefone",
    "cargo_desejado",
    "senioridade",
    "cidade",
    "etapa",
    "criado_em",
  ]);
  const [createForm, setCreateForm] = useState<CreateCandidatoInput>(createInitialCandidatoForm());
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const [editForm, setEditForm] = useState<CreateCandidatoInput>(createInitialCandidatoForm());
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  const editEmailInvalid = useMemo(() => !isValidEmail(editForm.email), [editForm.email]);
  const editPhoneInvalid = useMemo(() => !isValidPhone(editForm.telefone), [editForm.telefone]);

  const openDetalhe = (candidate: Candidato) => {
    setDetalhe(candidate);
    setModalEtapa(candidate.etapa || "Inscricao");
    setEditForm({
      nome: candidate.nome || "",
      email: candidate.email || "",
      telefone: candidate.telefone || "",
      cidade: candidate.cidade || "",
      senioridade: candidate.senioridade || "",
      cargo_desejado: candidate.cargo_desejado || "",
      etapa: candidate.etapa || "Inscricao",
      vaga_id: candidate.vaga_id ?? null,
      origem: candidate.origem || "Banco de Talentos",
      historico: candidate.historico || "",
      linkedin: candidate.linkedin || "",
      curriculum_url: candidate.curriculum_url || "",
    });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    setVagasError("");
    try {
      const [cand, vg] = await Promise.all([fetchCandidatos(), fetchVagas()]);
      setCandidatos(cand);
      setVagas(vg);
      
      if (vg.length === 0) {
        setVagasError("⚠️ Sistema de vagas indisponível no momento. Você ainda pode cadastrar candidatos no banco de talentos.");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      if (errorMsg.includes("vagas")) {
        setVagasError("⚠️ Sistema de vagas indisponível no momento. Você ainda pode cadastrar candidatos no banco de talentos.");
      } else {
        setError("Erro ao conectar com o servidor. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const result = candidatos.filter((c) => {
      const blob = `${c.nome} ${c.cargo_desejado || ""} ${c.email || ""} ${c.telefone || ""}`.toLowerCase();
      const matchTexto = !filtroTexto || blob.includes(filtroTexto.toLowerCase());
      const matchCidade = !filtroCidade || normalize(c.cidade).includes(normalize(filtroCidade));
      const matchSenioridade = !filtroSenioridade || c.senioridade === filtroSenioridade;
      const matchEtapa = !filtroEtapa || normalize(c.etapa) === normalize(filtroEtapa);
      const matchVaga = !filtroVaga || String(c.vaga_id || "") === filtroVaga;
      return matchTexto && matchCidade && matchSenioridade && matchEtapa && matchVaga;
    });

    result.sort((a, b) => {
      const dtA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const dtB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      if (sortBy === "antigos") return dtA - dtB;
      if (sortBy === "nome_az") return normalize(a.nome).localeCompare(normalize(b.nome));
      if (sortBy === "nome_za") return normalize(b.nome).localeCompare(normalize(a.nome));
      return dtB - dtA;
    });

    return result;
  }, [
    candidatos,
    filtroCidade,
    filtroEtapa,
    filtroSenioridade,
    filtroTexto,
    filtroVaga,
    sortBy,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / porPagina));

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const paginaSlice = useMemo(() => {
    const start = (paginaAtual - 1) * porPagina;
    return filtered.slice(start, start + porPagina);
  }, [filtered, paginaAtual, porPagina]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const fortaleza = filtered.filter((c) => normalize(c.cidade).includes("fortaleza")).length;
    const plenoSenior = filtered.filter((c) => {
      const s = normalize(c.senioridade);
      return s.includes("pleno") || s.includes("senior");
    }).length;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const ultMes = filtered.filter((c) => c.criado_em && new Date(c.criado_em) >= monthAgo).length;

    const porEtapa = ETAPAS.map((etapa) => ({
      etapa,
      total: filtered.filter((c) => normalize(c.etapa) === normalize(etapa)).length,
    }));

    return { total, fortaleza, plenoSenior, ultMes, porEtapa };
  }, [filtered]);

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginaSlice.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const applyBulkEtapa = async () => {
    if (!bulkEtapa || selectedIds.size === 0) return;

    try {
      await Promise.all([...selectedIds].map((id) => patchCandidatoEtapa(id, bulkEtapa)));
      await load();
      clearSelection();
      setBulkEtapa("");
    } catch {
      setError("Não foi possível aplicar etapa em lote.");
    }
  };

  const saveModalEtapa = async () => {
    if (!detalhe || !modalEtapa) return;
    try {
      await patchCandidatoEtapa(detalhe.id, modalEtapa);
      setDetalhe(null);
      await load();
    } catch {
      setError("Não foi possível atualizar etapa do candidato.");
    }
  };

  const saveModalPerfil = async () => {
    if (!detalhe || !editForm.nome?.trim()) {
      setError("Informe o nome do candidato.");
      return;
    }

    if (editEmailInvalid) {
      setError("E-mail inválido.");
      return;
    }

    if (editPhoneInvalid) {
      setError("Telefone inválido.");
      return;
    }

    setSavingEdit(true);
    try {
      await updateCandidato(detalhe.id, {
        nome: editForm.nome.trim(),
        email: editForm.email?.trim() || undefined,
        telefone: editForm.telefone?.trim() || undefined,
        cidade: editForm.cidade?.trim() || undefined,
        senioridade: editForm.senioridade?.trim() || undefined,
        cargo_desejado: editForm.cargo_desejado?.trim() || undefined,
        vaga_id: editForm.vaga_id || null,
        etapa: modalEtapa || editForm.etapa,
        origem: editForm.origem?.trim() || undefined,
        historico: editForm.historico?.trim() || undefined,
        linkedin: editForm.linkedin?.trim() || undefined,
        curriculum_url: editForm.curriculum_url?.trim() || undefined,
      });
      setDetalhe(null);
      await load();
    } catch {
      setError("Não foi possível atualizar os dados do candidato.");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeCandidate = async () => {
    if (!detalhe) return;
    if (!confirm("Tem certeza que deseja excluir este candidato?")) return;

    setDeletingCandidate(true);
    try {
      await deleteCandidato(detalhe.id);
      setDetalhe(null);
      await load();
    } catch {
      setError("Não foi possível excluir o candidato.");
    } finally {
      setDeletingCandidate(false);
    }
  };

  const clearFiltros = () => {
    setFiltroTexto("");
    setFiltroCidade("");
    setFiltroSenioridade("");
    setFiltroEtapa("");
    setFiltroVaga("");
    setSortBy("recentes");
    setPaginaAtual(1);
  };

  const exportRows = useMemo(() => {
    if (exportScope === "page") return paginaSlice;
    if (exportScope === "selected") {
      if (selectedIds.size === 0) return [];
      return filtered.filter((candidate) => selectedIds.has(candidate.id));
    }
    return filtered;
  }, [exportScope, paginaSlice, selectedIds, filtered]);

  const exportData = () => {
    if (exportRows.length === 0) {
      setError("Não há dados para exportar nesse escopo.");
      return;
    }

    if (exportColumns.length === 0) {
      setError("Selecione ao menos uma coluna para exportar.");
      return;
    }

    const mappedRows = exportRows.map((row) =>
      Object.fromEntries(exportColumns.map((column) => [column, row[column] ?? ""]))
    );

    const stamp = new Date().toISOString().slice(0, 10);
    if (exportFormat === "json") {
      downloadFile(
        JSON.stringify(mappedRows, null, 2),
        "application/json;charset=utf-8",
        `candidatos-${exportScope}-${stamp}.json`
      );
      setShowExportModal(false);
      return;
    }

    downloadFile(
      toCsv(exportRows, exportColumns),
      "text/csv;charset=utf-8",
      `candidatos-${exportScope}-${stamp}.csv`
    );
    setShowExportModal(false);
  };

  const toggleExportColumn = (column: ExportColumnKey) => {
    setExportColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((item) => item !== column);
      }
      return [...prev, column];
    });
  };

  const resetCreateForm = () => {
    setCreateForm(createInitialCandidatoForm());
  };

  const submitCreateCandidate = async () => {
    if (!createForm.nome?.trim()) {
      setError("Informe o nome do candidato.");
      return;
    }

    setCreatingCandidate(true);
    try {
      await createCandidato({
        ...createForm,
        nome: createForm.nome.trim(),
        email: createForm.email?.trim() || undefined,
        telefone: createForm.telefone?.trim() || undefined,
        cidade: createForm.cidade?.trim() || undefined,
        senioridade: createForm.senioridade?.trim() || undefined,
        cargo_desejado: createForm.cargo_desejado?.trim() || undefined,
        etapa: createForm.etapa?.trim() || "Inscricao",
        vaga_id: createForm.vaga_id || null,
        origem: createForm.origem?.trim() || undefined,
        historico: createForm.historico?.trim() || undefined,
        linkedin: createForm.linkedin?.trim() || undefined,
        curriculum_url: createForm.curriculum_url?.trim() || undefined,
      });
      setShowCreateModal(false);
      resetCreateForm();
      await load();
    } catch {
      setError("Não foi possível criar o candidato.");
    } finally {
      setCreatingCandidate(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col page-shell">
      <AppHeader />

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-400 mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0A2725]">Banco de Talentos</h1>
              <p className="text-sm text-slate-500 mt-1">Gerencie, filtre e acompanhe todos os candidatos.</p>
            </div>

            <div className="relative flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowQuickActions((prev) => !prev)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Ações rápidas
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Exportar
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Novo candidato
              </button>
              <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50">Atualizar</button>

              {showQuickActions && (
                <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
                  <button type="button" onClick={() => { setView("dashboard"); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Abrir dashboard</button>
                  <button type="button" onClick={() => { setView("lista"); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Abrir lista</button>
                  <button type="button" onClick={() => { setView("cards"); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Abrir cards</button>
                  <button type="button" onClick={() => { clearFiltros(); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Limpar filtros</button>
                  <button type="button" onClick={() => { selectPage(); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Selecionar página</button>
                  <button type="button" onClick={() => { setShowCreateModal(true); setShowQuickActions(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">Novo candidato</button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setView("dashboard")} className={`px-4 py-2 rounded-full text-xs font-black ${view === "dashboard" ? "bg-(--brand) text-white" : "bg-white border border-gray-200 text-slate-700"}`}>Dashboard</button>
              <button type="button" onClick={() => setView("lista")} className={`px-4 py-2 rounded-full text-xs font-black ${view === "lista" ? "bg-(--brand) text-white" : "bg-white border border-gray-200 text-slate-700"}`}>Lista</button>
              <button type="button" onClick={() => setView("cards")} className={`px-4 py-2 rounded-full text-xs font-black ${view === "cards" ? "bg-(--brand) text-white" : "bg-white border border-gray-200 text-slate-700"}`}>Cards</button>
            </div>
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 card-gradient">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Buscar</label>
                <input value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} placeholder="Nome, cargo, email..." className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Cidade</label>
                <input value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} placeholder="Cidade..." className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Senioridade</label>
                <select value={filtroSenioridade} onChange={(e) => setFiltroSenioridade(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">Todas</option>
                  {SENIORIDADES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Etapa</label>
                <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">Todas</option>
                  {ETAPAS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Vaga</label>
                <select value={filtroVaga} onChange={(e) => setFiltroVaga(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">Todas</option>
                  {vagas.map((v) => <option key={String(v.id)} value={String(v.id)}>{v.titulo}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Ordenar:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5">
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
                <option value="nome_az">Nome A-Z</option>
                <option value="nome_za">Nome Z-A</option>
              </select>

              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Exibir:</span>
              <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5">
                {[6, 9, 12, 18, 24].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <button
                type="button"
                onClick={clearFiltros}
                className="ml-auto px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-extrabold bg-white hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-6 p-3 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 text-sm font-semibold flex items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="text-amber-900/70 hover:text-amber-900 text-xs font-black">FECHAR</button>
            </div>
          )}

          {vagasError && (
            <div className="mb-6 p-3 rounded-xl border border-orange-200 bg-orange-50/80 text-orange-900 text-sm font-semibold flex items-center justify-between gap-3">
              <span>{vagasError}</span>
              <button type="button" onClick={() => setVagasError("")} className="text-orange-900/70 hover:text-orange-900 text-xs font-black">FECHAR</button>
            </div>
          )}

          {view === "dashboard" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="glass p-5 card-spotlight"><p className="text-xs font-bold text-slate-500">Total</p><p className="text-3xl font-black text-(--ink)">{stats.total}</p></article>
                <article className="glass p-5 card-spotlight"><p className="text-xs font-bold text-slate-500">Fortaleza</p><p className="text-3xl font-black text-(--ink)">{stats.fortaleza}</p></article>
                <article className="glass p-5 card-spotlight"><p className="text-xs font-bold text-slate-500">Pleno/Sênior</p><p className="text-3xl font-black text-(--ink)">{stats.plenoSenior}</p></article>
                <article className="glass p-5 card-spotlight"><p className="text-xs font-bold text-slate-500">Últimos 30 dias</p><p className="text-3xl font-black text-(--ink)">{stats.ultMes}</p></article>
              </div>

              <div className="glass p-5">
                <h2 className="font-black text-(--ink) text-base mb-4">Pipeline por etapa</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {stats.porEtapa.map((row) => {
                    const pct = stats.total ? Math.round((row.total / stats.total) * 100) : 0;
                    return (
                      <button key={row.etapa} type="button" onClick={() => { setFiltroEtapa(row.etapa); setView("lista"); }} className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-(--brand) transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <span className={badgeClass(row.etapa)}>{row.etapa}</span>
                          <span className="text-xs font-black text-slate-800">{row.total}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-2 rounded-full bg-(--brand)" style={{ width: `${pct}%` }} /></div>
                        <p className="mt-2 text-[11px] text-slate-500 font-extrabold">{pct}% do total</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {view === "lista" && (
            <section className="glass overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white/45">
                <div className="flex items-center gap-2 text-xs">
                  <span className="pill">Selecionados: <strong>{selectedIds.size}</strong></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={selectPage} className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold">Selecionar página</button>
                  <button onClick={clearSelection} className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold">Limpar seleção</button>
                  <select value={bulkEtapa} onChange={(e) => setBulkEtapa(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold">
                    <option value="">Mover para etapa...</option>
                    {ETAPAS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                  <button onClick={() => void applyBulkEtapa()} className="px-3 py-2 rounded-xl bg-(--ink) text-white text-xs font-black">Aplicar</button>
                </div>
              </div>

              <div className="overflow-x-auto nice-scroll">
                <table className="w-full text-sm table-soft">
                  <thead>
                    <tr>
                      <th className="w-11">Sel</th>
                      <th>Nome</th>
                      <th>Cargo</th>
                      <th>Senioridade</th>
                      <th>Cidade</th>
                      <th>Etapa</th>
                      <th>Criado em</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-500">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--brand)] border-t-transparent"></div>
                          <p className="mt-2 text-xs font-semibold">Carregando candidatos...</p>
                        </td>
                      </tr>
                    )}
                    {!loading && paginaSlice.length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-slate-500">Nenhum candidato encontrado.</td></tr>
                    )}
                    {!loading && paginaSlice.map((c) => (
                      <tr key={String(c.id)}>
                        <td>
                          <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4" />
                        </td>
                        <td>
                          <button type="button" onClick={() => openDetalhe(c)} className="font-extrabold text-slate-900 hover:text-(--brand)">{c.nome || "-"}</button>
                          <div className="text-[11px] text-slate-500">{c.email || ""}</div>
                        </td>
                        <td>{c.cargo_desejado || "-"}</td>
                        <td>{c.senioridade || "-"}</td>
                        <td>{c.cidade || "-"}</td>
                        <td><span className={badgeClass(c.etapa)}>{c.etapa || "-"}</span></td>
                        <td>{c.criado_em ? new Date(c.criado_em).toLocaleDateString("pt-BR") : "-"}</td>
                        <td className="text-right">
                          <button type="button" onClick={() => openDetalhe(c)} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:bg-white font-extrabold">Detalhes</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> • Total: <strong>{filtered.length}</strong></div>
                <div className="flex gap-2">
                  <button onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold disabled:opacity-40">&larr;</button>
                  <button onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold disabled:opacity-40">&rarr;</button>
                </div>
              </div>
            </section>
          )}

          {view === "cards" && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shimmer h-52" />
                ))}

                {!loading && paginaSlice.map((c) => (
                  <article key={String(c.id)} className="card-spotlight p-5 flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {String(c.nome || "?").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#0A2725] truncate">{c.nome || "Sem nome"}</h3>
                        <p className="text-xs text-slate-500 truncate">{c.cargo_desejado || "Cargo não informado"}</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-2 mb-4 text-[11px] text-slate-500">
                      <p className="truncate">📍 {c.cidade || "N/A"}</p>
                      <p className="truncate">💼 {c.vaga_titulo || "Banco de talentos"}</p>
                      <p className="truncate">📞 {c.telefone || "N/A"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={badgeClass(c.etapa)}>{c.etapa || "Inscricao"}</span>
                      <button onClick={() => openDetalhe(c)} className="ml-auto px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 border border-slate-200">Ver perfil</button>
                    </div>
                  </article>
                ))}

                {!loading && paginaSlice.length === 0 && (
                  <div className="col-span-full glass rounded-2xl text-center py-16">
                    <h3 className="text-lg font-bold text-[#0A2725]">Nenhum candidato encontrado</h3>
                    <p className="text-sm text-slate-500">Tente ajustar os filtros.</p>
                  </div>
                )}
              </div>

              {!loading && filtered.length > porPagina && (
                <div className="flex items-center justify-center gap-3 p-4">
                  <button onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anterior</button>
                  <span className="text-sm font-semibold text-slate-700">Página {paginaAtual} de {totalPaginas}</span>
                  <button onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">Próxima</button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {detalhe && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-start sm:items-center justify-center z-40 py-4" onClick={() => setDetalhe(null)}>
          <div className="modal-card p-4 sm:p-6 lg:p-8 w-full mx-4 max-w-4xl relative fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setDetalhe(null)} className="absolute top-4 right-4 text-slate-400 hover:text-(--brand) text-2xl font-black">&times;</button>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-(--ink)">{detalhe.nome || "Sem nome"}</h2>
                <p className="text-sm text-(--brand) font-black mt-1">Edição rápida de perfil</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="glass p-3">
                    <p className="text-xs font-black text-slate-500 uppercase">Contato</p>
                    <input value={editForm.email || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-mail" className={`mt-2 w-full px-2 py-1.5 rounded-lg border text-xs ${editEmailInvalid ? "border-red-300 bg-red-50/40" : "border-slate-200"}`} />
                    {editEmailInvalid && <p className="mt-1 text-[11px] text-red-600 font-semibold">Formato de e-mail inválido.</p>}
                    <input value={editForm.telefone || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: formatPhone(e.target.value) }))} placeholder="Telefone" className={`mt-2 w-full px-2 py-1.5 rounded-lg border text-xs ${editPhoneInvalid ? "border-red-300 bg-red-50/40" : "border-slate-200"}`} />
                    {editPhoneInvalid && <p className="mt-1 text-[11px] text-red-600 font-semibold">Informe pelo menos 8 dígitos.</p>}
                    <input value={editForm.cidade || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, cidade: e.target.value }))} placeholder="Cidade" className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div className="glass p-3">
                    <p className="text-xs font-black text-slate-500 uppercase">Resumo</p>
                    <input value={editForm.nome || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Nome" className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                    <input value={editForm.cargo_desejado || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, cargo_desejado: e.target.value }))} placeholder="Cargo desejado" className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs" />
                    <select value={editForm.senioridade || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, senioridade: e.target.value }))} className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white">
                      <option value="">Senioridade</option>
                      {SENIORIDADES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                    <select value={editForm.vaga_id == null ? "" : String(editForm.vaga_id)} onChange={(e) => setEditForm((prev) => ({ ...prev, vaga_id: e.target.value || null }))} className="mt-2 w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white">
                      <option value="">Banco de talentos</option>
                      {vagas.map((vaga) => <option key={String(vaga.id)} value={String(vaga.id)}>{vaga.titulo}</option>)}
                    </select>
                    <p><strong>Criado em:</strong> {detalhe.criado_em ? new Date(detalhe.criado_em).toLocaleString("pt-BR") : "-"}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-black text-(--ink) mb-2">Histórico</p>
                  <textarea value={editForm.historico || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, historico: e.target.value }))} className="glass p-3 text-sm text-slate-700 whitespace-pre-line w-full min-h-24" />
                </div>
              </div>

              <div className="lg:w-72 space-y-3">
                <div className="glass p-4">
                  <p className="text-xs font-black text-slate-500 uppercase">Atualizar etapa</p>
                  <select value={modalEtapa} onChange={(e) => setModalEtapa(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-extrabold">
                    {ETAPAS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                  <button type="button" onClick={() => void saveModalEtapa()} className="mt-2 w-full px-3 py-2 rounded-lg bg-(--ink) text-white text-xs font-black">Salvar etapa</button>
                  <button type="button" disabled={savingEdit || editEmailInvalid || editPhoneInvalid || !editForm.nome?.trim()} onClick={() => void saveModalPerfil()} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-black hover:bg-slate-50 disabled:opacity-60">{savingEdit ? "Salvando..." : "Salvar perfil"}</button>
                  <button type="button" disabled={deletingCandidate} onClick={() => void removeCandidate()} className="mt-2 w-full px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-60">{deletingCandidate ? "Excluindo..." : "Excluir candidato"}</button>
                </div>

                <div className="glass p-4">
                  <p className="text-xs font-black text-slate-500 uppercase">Links</p>
                  <div className="mt-2 grid gap-2">
                    {detalhe.linkedin && <a href={detalhe.linkedin} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-black hover:bg-slate-50">LinkedIn</a>}
                    {detalhe.curriculum_url && <a href={resolveCurriculumLink(detalhe.curriculum_url)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-black hover:bg-slate-50">Currículo</a>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={() => setShowExportModal(false)}>
          <div className="modal-card w-full max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-(--ink)">Exportar candidatos</h3>
            <p className="text-xs text-slate-500 mt-1">Selecione escopo, formato e colunas da exportação.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Escopo</label>
                <select value={exportScope} onChange={(e) => setExportScope(e.target.value as ExportScope)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                  <option value="filtered">Todos filtrados ({filtered.length})</option>
                  <option value="page">Apenas página atual ({paginaSlice.length})</option>
                  <option value="selected">Apenas selecionados ({selectedIds.size})</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Formato</label>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-600">Colunas</label>
                <button
                  type="button"
                  onClick={() => setExportColumns(EXPORT_COLUMNS.map((column) => column.key))}
                  className="text-[11px] font-extrabold text-slate-600 hover:text-slate-900"
                >
                  Marcar todas
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {EXPORT_COLUMNS.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(column.key)}
                      onChange={() => toggleExportColumn(column.key)}
                      className="w-3.5 h-3.5"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowExportModal(false)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-extrabold bg-white hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={exportData} className="px-3 py-2 rounded-lg bg-(--ink) text-white text-xs font-black">Baixar arquivo</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-(--ink)">Novo candidato</h3>
            <p className="text-xs text-slate-500 mt-1">Preencha os dados para cadastrar no Banco de Talentos.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-600 mb-1">Nome*</label>
                <input value={createForm.nome || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, nome: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">E-mail</label>
                <input type="email" value={createForm.email || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Telefone</label>
                <input value={createForm.telefone || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, telefone: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Cidade</label>
                <input value={createForm.cidade || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, cidade: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Cargo desejado</label>
                <input value={createForm.cargo_desejado || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, cargo_desejado: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Senioridade</label>
                <select value={createForm.senioridade || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, senioridade: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">Selecione</option>
                  {SENIORIDADES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Etapa</label>
                <select value={createForm.etapa || "Inscricao"} onChange={(event) => setCreateForm((prev) => ({ ...prev, etapa: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  {ETAPAS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">Vaga</label>
                <select
                  value={createForm.vaga_id == null ? "" : String(createForm.vaga_id)}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, vaga_id: event.target.value || null }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="">Banco de talentos</option>
                  {vagas.map((vaga) => (
                    <option key={String(vaga.id)} value={String(vaga.id)}>{vaga.titulo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">LinkedIn</label>
                <input value={createForm.linkedin || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, linkedin: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">URL currículo</label>
                <input value={createForm.curriculum_url || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, curriculum_url: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-600 mb-1">Histórico</label>
                <textarea value={createForm.historico || ""} onChange={(event) => setCreateForm((prev) => ({ ...prev, historico: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-24" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-extrabold bg-white hover:bg-slate-50">Cancelar</button>
              <button type="button" disabled={creatingCandidate} onClick={() => void submitCreateCandidate()} className="px-3 py-2 rounded-lg bg-(--ink) text-white text-xs font-black disabled:opacity-60">{creatingCandidate ? "Salvando..." : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
