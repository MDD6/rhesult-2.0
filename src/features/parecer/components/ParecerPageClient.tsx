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
      <main className="bg-slate-50 min-h-screen">
        <AppHeader />
        <section className="max-w-[1600px] mx-auto px-6 py-10">
          <div className="animate-pulse flex flex-col gap-4">
             <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
             <div className="h-64 w-full bg-slate-200 rounded-2xl"></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      <AppHeader />

      <section className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Avaliação Técnica</h1>
            <p className="text-slate-500 font-medium max-w-2xl">Gerencie pareceres técnicos, feedbacks e aprovações de candidatos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
               type="button" 
               onClick={resetEditor} 
               className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Novo Parecer
            </button>
            <button 
               type="button" 
               onClick={handleSave} 
               disabled={!canSave || saving} 
               className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
               {saving ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Salvando...
                 </>
               ) : (
                 <>
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                   Salvar Avaliação
                 </>
               )}
            </button>
          </div>
        </div>

        {error && (
           <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
             <span>{error}</span>
             <button type="button" onClick={() => setError("")} className="text-red-700/70 hover:text-red-700 text-xs font-black">FECHAR</button>
           </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
          {/* Sidebar Lista */}
          <aside className="lg:col-span-3 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <div className="relative group">
                 <input
                   type="search"
                   placeholder="Buscar parecer..."
                   value={filtroTexto}
                   onChange={(event) => setFiltroTexto(event.target.value)}
                   className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:bg-white text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 shadow-sm"
                 />
                 <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPareceres.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadParecerDetails(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group ${
                    selectedParecerId === item.id 
                    ? "border-slate-900 bg-slate-900 shadow-md transform scale-[1.02]" 
                    : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-bold truncate ${selectedParecerId === item.id ? "text-white" : "text-slate-900"}`}>{item.candidato_nome}</p>
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${
                      item.status === 'aprovado' ? 'bg-emerald-500' : 
                      item.status === 'reprovado' ? 'bg-red-500' : 
                      item.status === 'ajustes' ? 'bg-amber-500' : 'bg-slate-300'
                    }`}></span>
                  </div>
                  <p className={`text-xs truncate mb-2 ${selectedParecerId === item.id ? "text-slate-400" : "text-slate-500"}`}>{item.vaga_titulo}</p>
                  <div className="flex items-center justify-between gap-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        selectedParecerId === item.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                     }`}>
                        {item.status}
                     </span>
                     <span className={`text-[10px] ${selectedParecerId === item.id ? "text-slate-500" : "text-slate-400"}`}>{formatDate(item.updated_at)}</span>
                  </div>
                </button>
              ))}
              {!filteredPareceres.length && (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4 space-y-3">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-xs font-medium text-slate-500">Nenhum parecer encontrado.</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Editor */}
          <div className="lg:col-span-6 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-4 w-full sm:w-auto">
                   <div className="w-full sm:w-48">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Candidato</label>
                      <select
                        value={selectedCandidatoId}
                        onChange={(event) => setSelectedCandidatoId(event.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none"
                      >
                        <option value="">Selecione...</option>
                        {candidatos.map((item) => (
                          <option key={String(item.id)} value={String(item.id)}>{item.nome}</option>
                        ))}
                      </select>
                   </div>
                   <div className="w-full sm:w-48">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vaga</label>
                      <select
                        value={selectedVagaId}
                        onChange={(event) => setSelectedVagaId(event.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none"
                      >
                        <option value="">Selecione...</option>
                        {vagas.map((item) => (
                          <option key={String(item.id)} value={String(item.id)}>{item.titulo}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                      {TEMPLATES.map((tmpl) => (
                         <button 
                           key={tmpl.label}
                           onClick={() => handleAddTemplate(tmpl)}
                           className="px-2 py-1 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600 transition-colors"
                           title={`Inserir template: ${tmpl.label}`}
                         >
                           + {tmpl.label}
                         </button>
                      ))}
                   </div>
                   <button onClick={() => setPreviewOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Pré-visualizar">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   </button>
                </div>
             </div>

             <div className="flex-1 relative">
                <textarea
                  value={editorContent}
                  onChange={(event) => setEditorContent(event.target.value)}
                  className="w-full h-full p-6 resize-none outline-none text-sm leading-relaxed text-slate-700 font-medium placeholder-slate-300"
                  placeholder="Comece a escrever sua avaliação técnica aqui..."
                />
             </div>
             
             <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Decisão Final:</label>
                   <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as ParecerStatus)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 ${
                        status === 'aprovado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' : 
                        status === 'reprovado' ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500' :
                        status === 'ajustes' ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500' :
                        'bg-white border-slate-200 text-slate-700 focus:ring-slate-500'
                      }`}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="ajustes">Solicitar Ajustes</option>
                      <option value="reprovado">Reprovado</option>
                    </select>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                   {editorContent.length} caracteres
                </div>
             </div>
          </div>

          {/* Right Panel (Comments & Versions) */}
          <aside className="lg:col-span-3 flex flex-col gap-6 h-full">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
               <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Comentários</p>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {comentarios.map((item) => (
                   <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-slate-900">{item.usuario_nome || "Usuário"}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(item.created_at)}</span>
                     </div>
                     <p className="text-xs text-slate-600 leading-relaxed">{item.texto}</p>
                   </div>
                 ))}
                 {!comentarios.length && <p className="text-xs text-slate-400 text-center py-4">Nenhum comentário ainda.</p>}
               </div>

               <div className="p-3 border-t border-slate-100 bg-white">
                  <div className="relative">
                    <input
                      value={novoComentario}
                      onChange={(event) => setNovoComentario(event.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComentario()}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                      placeholder="Escreva um comentário..."
                    />
                    <button 
                      onClick={handleAddComentario}
                      disabled={!novoComentario.trim()}
                      className="absolute right-1.5 top-1.5 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 transition-all"
                    >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
               </div>
            </div>

            <div className="h-1/3 min-h-[200px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
               <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Histórico de Versões</p>
               </div>
               <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {versoes.map((item) => (
                   <button
                     key={item.id}
                     onClick={() => void handleCarregarVersao(item.id)}
                     className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                   >
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Versão #{item.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${statusClass(item.status)}`}>{item.status}</span>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                   </button>
                 ))}
                 {!versoes.length && <p className="text-xs text-slate-400 text-center py-6">Nenhuma versão anterior.</p>}
               </div>
            </div>
          </aside>
        </div>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-xl font-extrabold text-slate-900">Pré-visualização do Parecer</h2>
              <button type="button" className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setPreviewOpen(false)}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8">
               <div className="flex items-start gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                     👤
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-slate-900">{currentParecer?.candidato_nome || "Candidato Desconhecido"}</h3>
                     <p className="text-lg text-slate-500">{currentParecer?.vaga_titulo || "Vaga não selecionada"}</p>
                     <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-900 text-white shadow-sm">
                        {status.toUpperCase()}
                     </div>
                  </div>
               </div>
               
               <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-blue-600 hover:prose-a:text-blue-500">
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{editorContent || "Sem conteúdo."}</pre>
               </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
               <button onClick={() => setPreviewOpen(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50">
                  Voltar para Edição
               </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[130] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={`px-5 py-4 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-3 ${
            toast.kind === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
             {toast.kind === "success" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
             ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             )}
            {toast.message}
          </div>
        </div>
      )}
    </main>
  );
}
