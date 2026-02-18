"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/shared/components/AppHeader";
import { useAuth } from "@/shared/context/AppContext";
import { fetchCandidatos, fetchVagas, type Candidato, type Vaga } from "@/features/talent-bank/services/talentBankApi";
import {
  createParecer,
  createParecerComentario,
  fetchParecerById,
  fetchParecerComentarios,
  fetchParecerVersaoConteudo,
  fetchParecerVersoes,
  fetchPareceres,
  updateParecer,
  type Parecer,
  type ParecerComentario,
  type ParecerStatus,
  type ParecerVersao,
} from "@/features/parecer/services/parecerApi";

type ToastKind = "success" | "error";

type EditorTemplate = {
  label: string;
  text: string;
};

const TEMPLATES: EditorTemplate[] = [
  {
    label: "Resumo",
    text: "## Resumo\n- Contexto geral do candidato:\n- Pontos fortes:\n- Pontos de atenção:\n",
  },
  {
    label: "Hard Skills",
    text: "## Hard Skills\n- Competências técnicas avaliadas:\n- Evidências observadas:\n- Nível de aderência à vaga:\n",
  },
  {
    label: "Comportamental",
    text: "## Fit Comportamental\n- Comunicação:\n- Colaboração:\n- Autonomia e ownership:\n",
  },
  {
    label: "Recomendação",
    text: "## Recomendação Final\n- Decisão sugerida:\n- Justificativa:\n- Próximos passos:\n",
  },
];

function draftKey(parecerId: number | null, candidatoId: string, vagaId: string) {
  if (parecerId) return `parecer:draft:${parecerId}`;
  return `parecer:draft:new:${candidatoId || "none"}:${vagaId || "none"}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function statusClass(status: ParecerStatus) {
  if (status === "aprovado") return "bg-emerald-100 text-emerald-700";
  if (status === "reprovado") return "bg-red-100 text-red-700";
  if (status === "ajustes") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function ParecerPageClient() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);

  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [pareceres, setPareceres] = useState<Parecer[]>([]);

  const [selectedParecerId, setSelectedParecerId] = useState<number | null>(null);
  const [selectedCandidatoId, setSelectedCandidatoId] = useState("");
  const [selectedVagaId, setSelectedVagaId] = useState("");

  const [editorContent, setEditorContent] = useState("");
  const [status, setStatus] = useState<ParecerStatus>("pendente");

  const [comentarios, setComentarios] = useState<ParecerComentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [versoes, setVersoes] = useState<ParecerVersao[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");

  const showToast = (kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const resetEditor = () => {
    setSelectedParecerId(null);
    setSelectedCandidatoId("");
    setSelectedVagaId("");
    setEditorContent("");
    setStatus("pendente");
    setComentarios([]);
    setVersoes([]);
  };

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cand, vg, prs] = await Promise.all([fetchCandidatos(), fetchVagas(), fetchPareceres()]);
      setCandidatos(cand);
      setVagas(vg);
      setPareceres(prs);

      if (prs.length > 0) {
        setSelectedParecerId(prs[0].id);
        setSelectedCandidatoId(String(prs[0].candidato_id));
        setSelectedVagaId(String(prs[0].vaga_id));
        setEditorContent(prs[0].conteudo || "");
        setStatus(prs[0].status);
      }
    } catch {
      setError("Não foi possível carregar os dados de pareceres.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadParecerDetails = useCallback(async (parecerId: number) => {
    try {
      const [parecer, comms, vers] = await Promise.all([
        fetchParecerById(parecerId),
        fetchParecerComentarios(parecerId),
        fetchParecerVersoes(parecerId),
      ]);

      setSelectedParecerId(parecer.id);
      setSelectedCandidatoId(String(parecer.candidato_id));
      setSelectedVagaId(String(parecer.vaga_id));
      setEditorContent(parecer.conteudo || "");
      setStatus(parecer.status);
      setComentarios(comms);
      setVersoes(vers);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao carregar parecer.");
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    const key = draftKey(selectedParecerId, selectedCandidatoId, selectedVagaId);
    const payload = {
      selectedParecerId,
      selectedCandidatoId,
      selectedVagaId,
      editorContent,
      status,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }, [selectedParecerId, selectedCandidatoId, selectedVagaId, editorContent, status]);

  useEffect(() => {
    const key = draftKey(selectedParecerId, selectedCandidatoId, selectedVagaId);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as {
        editorContent?: string;
        status?: ParecerStatus;
      };
      if (typeof draft.editorContent === "string") setEditorContent(draft.editorContent);
      if (draft.status) setStatus(draft.status);
    } catch {
      // noop
    }
  }, [selectedParecerId, selectedCandidatoId, selectedVagaId]);

  const filteredPareceres = useMemo(() => {
    const q = filtroTexto.toLowerCase().trim();
    if (!q) return pareceres;
    return pareceres.filter((item) => {
      const blob = `${item.candidato_nome} ${item.vaga_titulo} ${item.status}`.toLowerCase();
      return blob.includes(q);
    });
  }, [pareceres, filtroTexto]);

  const currentParecer = useMemo(
    () => pareceres.find((item) => item.id === selectedParecerId) || null,
    [pareceres, selectedParecerId]
  );

  const canSave = editorContent.trim().length > 0 && selectedCandidatoId && selectedVagaId;

  const handleSave = async () => {
    if (!canSave) {
      showToast("error", "Selecione candidato, vaga e preencha o parecer.");
      return;
    }

    setSaving(true);
    try {
      if (selectedParecerId) {
        const updated = await updateParecer(selectedParecerId, {
          conteudo: editorContent,
          status,
        });
        setPareceres((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showToast("success", "Parecer atualizado com sucesso.");
      } else {
        const created = await createParecer({
          candidato_id: Number(selectedCandidatoId),
          vaga_id: Number(selectedVagaId),
          avaliador_id: user?.id ? Number(user.id) : undefined,
          conteudo: editorContent,
          status,
        });
        setPareceres((prev) => [created, ...prev]);
        setSelectedParecerId(created.id);
        showToast("success", "Parecer criado com sucesso.");
      }

      await loadBase();
      if (selectedParecerId) {
        await loadParecerDetails(selectedParecerId);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao salvar parecer.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTemplate = (template: EditorTemplate) => {
    setEditorContent((prev) => {
      if (!prev.trim()) return template.text;
      return `${prev.trim()}\n\n${template.text}`;
    });
  };

  const handleAddComentario = async () => {
    if (!selectedParecerId) {
      showToast("error", "Salve o parecer antes de comentar.");
      return;
    }
    if (!novoComentario.trim()) return;

    try {
      const created = await createParecerComentario(selectedParecerId, novoComentario.trim());
      setComentarios((prev) => [created, ...prev]);
      setNovoComentario("");
      showToast("success", "Comentário adicionado.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao comentar.");
    }
  };

  const handleCarregarVersao = async (versionId: number) => {
    if (!selectedParecerId) return;
    try {
      const versao = await fetchParecerVersaoConteudo(selectedParecerId, versionId);
      setEditorContent(versao.conteudo || "");
      if (versao.status) setStatus(versao.status);
      showToast("success", "Versão carregada no editor.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao carregar versão.");
    }
  };

  if (loading) {
    return (
      <main className="bg-[#f8fafc] min-h-screen">
        <AppHeader />
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="card p-6 text-sm text-slate-500">Carregando pareceres...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f8fafc] min-h-screen">
      <AppHeader />

      <section className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="card p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Parecer Técnico</p>
            <h1 className="text-2xl font-bold text-slate-900">Editor de avaliação</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={resetEditor} className="btn btn-ghost">
              + Novo parecer
            </button>
            <button type="button" onClick={() => setPreviewOpen(true)} className="btn border border-slate-200 bg-white">
              Pré-visualizar
            </button>
            <button type="button" onClick={handleSave} disabled={!canSave || saving} className="btn btn-primary disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar parecer"}
            </button>
          </div>
        </div>

        {error && <div className="card p-3 text-sm text-red-600">{error}</div>}

        <div className="grid lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-3 card p-4 space-y-3">
            <input
              type="search"
              placeholder="Buscar parecer..."
              value={filtroTexto}
              onChange={(event) => setFiltroTexto(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />

            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {filteredPareceres.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadParecerDetails(item.id)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedParecerId === item.id ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.candidato_nome}</p>
                  <p className="text-xs text-slate-500 truncate">{item.vaga_titulo}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                    <span className="text-[11px] text-slate-500">{formatDate(item.updated_at)}</span>
                  </div>
                </button>
              ))}
              {!filteredPareceres.length && <p className="text-xs text-slate-500">Nenhum parecer encontrado.</p>}
            </div>
          </aside>

          <div className="lg:col-span-6 card p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600 flex flex-col gap-1">
                Candidato
                <select
                  value={selectedCandidatoId}
                  onChange={(event) => setSelectedCandidatoId(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {candidatos.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>{item.nome}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-600 flex flex-col gap-1">
                Vaga
                <select
                  value={selectedVagaId}
                  onChange={(event) => setSelectedVagaId(event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {vagas.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>{item.titulo}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="text-xs font-semibold text-slate-600 flex flex-col gap-1">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ParecerStatus)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="ajustes">Solicitar ajustes</option>
                  <option value="reprovado">Reprovado</option>
                </select>
              </label>
              <span className={`text-xs px-3 py-2 rounded-full font-semibold ${statusClass(status)}`}>{status}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  className="btn border border-slate-200 bg-white"
                  onClick={() => handleAddTemplate(template)}
                >
                  + {template.label}
                </button>
              ))}
            </div>

            <label className="text-xs font-semibold text-slate-600 flex flex-col gap-1">
              Conteúdo
              <textarea
                value={editorContent}
                onChange={(event) => setEditorContent(event.target.value)}
                className="min-h-[330px] rounded-xl border border-slate-200 px-3 py-3 text-sm resize-y"
                placeholder="Escreva aqui o parecer técnico..."
              />
            </label>
          </div>

          <aside className="lg:col-span-3 space-y-4">
            <div className="card p-4 space-y-3">
              <p className="text-sm font-bold text-slate-900">Comentários</p>

              <div className="flex gap-2">
                <input
                  value={novoComentario}
                  onChange={(event) => setNovoComentario(event.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Adicionar comentário"
                />
                <button type="button" onClick={handleAddComentario} className="btn btn-primary">Enviar</button>
              </div>

              <div className="space-y-2 max-h-[230px] overflow-auto pr-1">
                {comentarios.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-700">{item.texto}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {(item.usuario_nome || "Usuário")} • {formatDate(item.created_at)}
                    </p>
                  </div>
                ))}
                {!comentarios.length && <p className="text-xs text-slate-500">Sem comentários.</p>}
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <p className="text-sm font-bold text-slate-900">Versões</p>
              <div className="space-y-2 max-h-[250px] overflow-auto pr-1">
                {versoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleCarregarVersao(item.id)}
                    className="w-full text-left rounded-lg border border-slate-200 p-2.5 hover:border-slate-300"
                  >
                    <p className="text-xs font-semibold text-slate-800">Versão #{item.id}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(item.created_at)}</span>
                    </div>
                  </button>
                ))}
                {!versoes.length && <p className="text-xs text-slate-500">Sem versões registradas.</p>}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 p-4 flex items-center justify-center" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-3xl max-h-[88vh] overflow-auto card p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Pré-visualização do parecer</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setPreviewOpen(false)}>Fechar</button>
            </div>

            <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <p className="text-sm text-slate-700">
                <strong>Candidato:</strong> {currentParecer?.candidato_nome || "—"}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Vaga:</strong> {currentParecer?.vaga_titulo || "—"}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Status:</strong> {status}
              </p>
              <hr className="my-2 border-slate-200" />
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">{editorContent || "Sem conteúdo."}</pre>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[130]">
          <div className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-lg ${toast.kind === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.message}
          </div>
        </div>
      )}
    </main>
  );
}
