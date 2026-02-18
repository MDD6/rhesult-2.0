"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventInput } from "@fullcalendar/core";
import { AppHeader } from "@/shared/components/AppHeader";
import { fetchCandidatos, fetchVagas, type Candidato, type Vaga } from "@/features/talent-bank/services/talentBankApi";
import {
  createEntrevista,
  fetchEntrevistas,
  type Entrevista,
  type EntrevistaStatus,
  type EntrevistaTipo,
  updateEntrevista,
} from "@/features/agenda/services/agendaApi";

type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

type ToastKind = "success" | "error" | "warn";

type AgendaFilters = {
  quickSearch: string;
  status: "" | EntrevistaStatus;
  tipo: "" | EntrevistaTipo;
  recrutadorId: string;
};

type FormState = {
  id?: number;
  candidatoId: string;
  candidatoNome: string;
  vagaId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: EntrevistaTipo;
  status: EntrevistaStatus;
  observacoes: string;
};

const STATUS_COLORS: Record<EntrevistaStatus, string> = {
  Agendada: "#2563eb",
  Confirmada: "#16a34a",
  Reagendada: "#eab308",
  Cancelada: "#ef4444",
  Realizada: "#64748b",
};

const EMPTY_FORM: FormState = {
  candidatoId: "",
  candidatoNome: "",
  vagaId: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  tipo: "RH",
  status: "Agendada",
  observacoes: "",
};

function formatDateToInput(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatTimeToInput(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toTimeString().slice(0, 5);
}

type CalendarInteractionArg = {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
  };
  revert: () => void;
};

function inNextHours(dateIso: string, hours: number) {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return target >= now && target <= now + hours * 60 * 60 * 1000;
}

function isPast(dateIso: string) {
  return new Date(dateIso).getTime() < Date.now();
}

function toWhatsAppLink(phone: string | null | undefined, text: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`;
}

export function AgendaPageClient() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);

  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [filters, setFilters] = useState<AgendaFilters>({
    quickSearch: "",
    status: "",
    tipo: "",
    recrutadorId: "",
  });

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [candidateSuggestions, setCandidateSuggestions] = useState<Candidato[]>([]);

  const showToast = (kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cand, vg] = await Promise.all([fetchCandidatos(), fetchVagas()]);
      setCandidatos(cand);
      setVagas(vg);
    } catch {
      setError("Não foi possível carregar dados base da agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadEntrevistas = useCallback(async (range?: { start?: string; end?: string }) => {
    try {
      const list = await fetchEntrevistas(range);
      setEntrevistas(list);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao carregar entrevistas.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadBase();
      await reloadEntrevistas();
    })();
  }, [loadBase, reloadEntrevistas]);

  const filteredEntrevistas = useMemo(() => {
    const q = filters.quickSearch.toLowerCase().trim();
    return entrevistas.filter((item) => {
      const text = `${item.candidato_nome} ${item.vaga_titulo}`.toLowerCase();
      const okQ = !q || text.includes(q);
      const okStatus = !filters.status || item.status === filters.status;
      const okTipo = !filters.tipo || item.tipo === filters.tipo;
      const okRecrutador = !filters.recrutadorId || String(item.recrutador_id || "") === filters.recrutadorId;
      return okQ && okStatus && okTipo && okRecrutador;
    });
  }, [entrevistas, filters]);

  const events = useMemo<EventInput[]>(() => {
    return filteredEntrevistas.map((item) => ({
      id: String(item.id),
      title: `${item.candidato_nome} – ${item.vaga_titulo}`,
      start: item.data_inicio,
      end: item.data_fim,
      backgroundColor: STATUS_COLORS[item.status],
      borderColor: "transparent",
      extendedProps: item,
    }));
  }, [filteredEntrevistas]);

  const selectedEntrevista = useMemo(
    () => entrevistas.find((item) => item.id === selectedEventId) || null,
    [entrevistas, selectedEventId]
  );

  const nextEvents = useMemo(() => {
    const now = Date.now();
    const max = now + 7 * 24 * 60 * 60 * 1000;
    return filteredEntrevistas
      .filter((item) => {
        const ts = new Date(item.data_inicio).getTime();
        return ts >= now && ts <= max && item.status !== "Cancelada";
      })
      .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
      .slice(0, 5);
  }, [filteredEntrevistas]);

  const metrics = useMemo(() => {
    const count = (status: EntrevistaStatus) => filteredEntrevistas.filter((item) => item.status === status).length;
    const pendenteConfirm = filteredEntrevistas.filter((item) => item.status === "Agendada" && inNextHours(item.data_inicio, 24)).length;
    const slaVencido = filteredEntrevistas.filter((item) => item.status === "Agendada" && isPast(item.data_inicio)).length;
    const next24h = filteredEntrevistas.filter((item) => item.status !== "Cancelada" && inNextHours(item.data_inicio, 24)).length;
    return {
      agendadas: count("Agendada") + count("Confirmada") + count("Reagendada"),
      confirmadas: count("Confirmada"),
      reagendadas: count("Reagendada"),
      canceladas: count("Cancelada"),
      realizadas: count("Realizada"),
      pendenteConfirm,
      slaVencido,
      next24h,
    };
  }, [filteredEntrevistas]);

  const openCreateModal = (date?: Date) => {
    const baseDate = date ? formatDateToInput(date) : "";
    setFormState({ ...EMPTY_FORM, data: baseDate, vagaId: String(vagas[0]?.id || "") });
    setCandidateSuggestions([]);
    setModalOpen(true);
  };

  const openEditModal = (item: Entrevista) => {
    setFormState({
      id: item.id,
      candidatoId: String(item.candidato_id),
      candidatoNome: item.candidato_nome,
      vagaId: String(item.vaga_id),
      data: formatDateToInput(item.data_inicio),
      horaInicio: formatTimeToInput(item.data_inicio),
      horaFim: formatTimeToInput(item.data_fim),
      tipo: item.tipo,
      status: item.status,
      observacoes: item.observacoes || "",
    });
    setCandidateSuggestions([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormState(EMPTY_FORM);
    setCandidateSuggestions([]);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.candidatoId || !formState.vagaId || !formState.data || !formState.horaInicio || !formState.horaFim) {
      showToast("error", "Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      candidato_id: Number(formState.candidatoId),
      vaga_id: Number(formState.vagaId),
      data: formState.data,
      hora_inicio: formState.horaInicio,
      hora_fim: formState.horaFim,
      tipo: formState.tipo,
      status: formState.status,
      observacoes: formState.observacoes,
    };

    try {
      if (formState.id) {
        await updateEntrevista(formState.id, payload);
        showToast("success", "Entrevista atualizada.");
      } else {
        await createEntrevista(payload);
        showToast("success", "Entrevista criada.");
      }
      closeModal();
      await reloadEntrevistas();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao salvar entrevista.");
    }
  };

  const updateStatus = async (id: number, status: EntrevistaStatus) => {
    try {
      await updateEntrevista(id, { status });
      showToast("success", `Status atualizado: ${status}`);
      await reloadEntrevistas();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao atualizar status.");
    }
  };

  const persistMove = async (arg: CalendarInteractionArg) => {
    const id = Number(arg.event.id);
    const start = arg.event.start;
    const end = arg.event.end;

    if (!start || !end) {
      arg.revert();
      return;
    }

    try {
      await updateEntrevista(id, {
        data: formatDateToInput(start),
        hora_inicio: formatTimeToInput(start),
        hora_fim: formatTimeToInput(end),
        status: "Reagendada",
      });
      showToast("success", "Entrevista reagendada.");
      await reloadEntrevistas();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao reagendar.");
      arg.revert();
    }
  };

  const onCandidateInput = (value: string) => {
    setFormState((prev) => ({ ...prev, candidatoNome: value, candidatoId: "" }));
    const term = value.trim().toLowerCase();
    if (term.length < 2) {
      setCandidateSuggestions([]);
      return;
    }
    setCandidateSuggestions(candidatos.filter((item) => item.nome?.toLowerCase().includes(term)).slice(0, 8));
  };

  const onDateClick = (arg: { date: Date }) => {
    openCreateModal(arg.date);
  };

  const onEventClick = (arg: { event: { id: string } }) => {
    setSelectedEventId(Number(arg.event.id));
  };

  const onViewChange = (nextView: CalendarView) => {
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  const exportCsv = () => {
    const header = ["id", "candidato", "vaga", "tipo", "status", "inicio", "fim", "meet"];
    const rows = [header.join(";")]
      .concat(
        filteredEntrevistas.map((item) =>
          [
            String(item.id),
            item.candidato_nome,
            item.vaga_titulo,
            item.tipo,
            item.status,
            item.data_inicio,
            item.data_fim,
            item.meet_link || "",
          ]
            .map((field) => field.replaceAll(";", " "))
            .join(";")
        )
      )
      .join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agenda_rhesult_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("success", "CSV exportado.");
  };

  const eventContent = (arg: { event: { title: string; extendedProps: unknown } }) => {
    const status = (arg.event.extendedProps as Entrevista).status;
    return (
      <div className="text-[11px] leading-tight">
        <p className="font-semibold truncate">{arg.event.title}</p>
        <p className="opacity-90">{status}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bt-page">
        <AppHeader />
        <main className="max-w-6xl mx-auto w-full px-4 py-8 text-sm text-slate-600">Carregando agenda...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen has-header bt-page">
      <AppHeader />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-lg text-xs text-white shadow-lg ${
              toast.kind === "success" ? "bg-emerald-500" : toast.kind === "warn" ? "bg-amber-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {error && <div className="mb-3 text-sm text-red-600 font-semibold">{error}</div>}

        <section className="glass rounded-2xl px-4 py-3 mb-4 flex flex-col gap-3">
          <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Agenda de Entrevistas</h1>
              <p className="text-xs text-gray-500">Arraste para reagendar. Clique para ver detalhes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => openCreateModal()} className="text-xs px-3 py-1.5 rounded-full bg-[#F58634] text-white font-semibold hover:bg-[#e9792e]">
                + Nova entrevista
              </button>
              <button onClick={() => showToast("warn", "Sincronização Google ainda não conectada ao backend.")} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50">
                Sincronizar Google
              </button>
              <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50">
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <div className="md:col-span-2">
              <label className="block text-[11px] text-gray-600 mb-1">Busca rápida (candidato/vaga)</label>
              <input
                type="search"
                value={filters.quickSearch}
                onChange={(event) => setFilters((prev) => ({ ...prev, quickSearch: event.target.value }))}
                placeholder="Ex.: Ana Silva, Dev Full Stack..."
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-xs focus:ring-1 focus:ring-[#F58634] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as AgendaFilters["status"] }))}
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-xs"
              >
                <option value="">Todos</option>
                <option>Agendada</option>
                <option>Confirmada</option>
                <option>Reagendada</option>
                <option>Cancelada</option>
                <option>Realizada</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Tipo</label>
              <select
                value={filters.tipo}
                onChange={(event) => setFilters((prev) => ({ ...prev, tipo: event.target.value as AgendaFilters["tipo"] }))}
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-xs"
              >
                <option value="">Todos</option>
                <option>RH</option>
                <option>Tecnica</option>
                <option>Gestor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Recrutador</label>
              <select
                value={filters.recrutadorId}
                onChange={(event) => setFilters((prev) => ({ ...prev, recrutadorId: event.target.value }))}
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-xs"
              >
                <option value="">Todos</option>
                <option value="1">João Silva</option>
                <option value="2">Janine Feitosa</option>
              </select>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <div className="flex flex-col gap-3">
            <section className="glass rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => openCreateModal()} className="px-4 py-2 bg-[#F58634] text-white text-xs font-semibold rounded-full">Nova Entrevista</button>
                <button onClick={exportCsv} className="px-3 py-2 border border-gray-300 bg-white text-xs rounded-full">Exportar CSV</button>
                <button onClick={() => showToast("warn", "Sincronização Google ainda não conectada ao backend.")} className="px-3 py-2 border border-gray-300 bg-white text-xs rounded-full">Sincronizar</button>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"].map((item) => (
                    <button
                      key={item}
                      onClick={() => onViewChange(item as CalendarView)}
                      className={`text-xs px-3 py-1.5 rounded-full ${view === item ? "bg-[#0A2725] text-white" : "bg-gray-100 text-gray-700"}`}
                    >
                      {item === "dayGridMonth" ? "Mês" : item === "timeGridWeek" ? "Semana" : item === "timeGridDay" ? "Dia" : "Lista"}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-gray-600 flex items-center gap-2">
                  <span className="font-semibold text-gray-800">SLA:</span>
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pendentes: {metrics.pendenteConfirm}</span>
                  <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Vencidos: {metrics.slaVencido}</span>
                </div>
              </div>
            </section>

            <section className="glass rounded-2xl p-3 min-h-140">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                locale="pt-br"
                initialView="dayGridMonth"
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                nowIndicator
                editable
                selectable
                dayMaxEvents={3}
                events={events}
                eventContent={eventContent}
                dateClick={onDateClick}
                eventClick={onEventClick}
                eventDrop={(arg) => {
                  if (!window.confirm("Confirmar reagendamento deste evento?")) {
                    arg.revert();
                    return;
                  }
                  void persistMove(arg);
                }}
                eventResize={(arg) => {
                  if (!window.confirm("Confirmar alteração de duração?")) {
                    arg.revert();
                    return;
                  }
                  void persistMove(arg);
                }}
              />
            </section>
          </div>

          <aside className="flex flex-col gap-3">
            <section className="glass rounded-2xl flex flex-col h-85">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Detalhes</p>
                  <p className="text-[11px] text-gray-500">Clique em um evento para ações rápidas.</p>
                </div>
                <button onClick={() => setSelectedEventId(null)} className="text-[11px] px-2 py-1 rounded-full border border-gray-300 bg-white">Limpar</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-800">
                {!selectedEntrevista ? (
                  <div className="flex flex-col items-center justify-center text-center mt-6 text-xs text-gray-500">
                    <div className="w-10 h-10 rounded-full border border-dashed border-gray-300 flex items-center justify-center mb-2">📅</div>
                    <p className="font-medium text-gray-700">Nenhuma entrevista selecionada</p>
                    <p className="mt-1">Clique em um evento para ver detalhes completos.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">Candidato</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedEntrevista.candidato_nome}</p>
                        <p className="text-[11px] text-gray-500 mt-1">Vaga • <span className="font-medium text-gray-700">{selectedEntrevista.vaga_titulo}</span></p>
                      </div>
                      <span className="px-2 py-1 rounded-full border text-[11px] bg-white">{selectedEntrevista.status}</span>
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-500 mb-1">Horário</p>
                      <p>
                        {new Date(selectedEntrevista.data_inicio).toLocaleDateString("pt-BR")} • {new Date(selectedEntrevista.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(selectedEntrevista.data_fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-500 mb-1">Observações</p>
                      <p className="whitespace-pre-wrap">{selectedEntrevista.observacoes || "-"}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                      <button onClick={() => openEditModal(selectedEntrevista)} className="px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 text-[11px]">Editar/Reagendar</button>
                      <button onClick={() => void updateStatus(selectedEntrevista.id, "Confirmada")} className="px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px]">Confirmar</button>
                      <button onClick={() => void updateStatus(selectedEntrevista.id, "Cancelada")} className="px-3 py-1.5 rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-[11px]">Cancelar</button>
                      {selectedEntrevista.candidato_telefone ? (
                        <a
                          className="px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={toWhatsAppLink(
                            selectedEntrevista.candidato_telefone,
                            `Olá, ${selectedEntrevista.candidato_nome}! Sua entrevista para ${selectedEntrevista.vaga_titulo} está ${selectedEntrevista.status}.`
                          )}
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="glass rounded-2xl flex flex-col h-70">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-800">⏰ Próximas Entrevistas</p>
                <p className="text-[11px] text-gray-500">Entrevistas dos próximos 7 dias.</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-xs">
                {!nextEvents.length ? (
                  <div className="flex items-center justify-center h-full text-gray-400">Nenhuma entrevista próxima</div>
                ) : (
                  nextEvents.map((item) => (
                    <button key={item.id} onClick={() => setSelectedEventId(item.id)} className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition">
                      <p className="text-[11px] font-semibold text-gray-900 truncate">{item.candidato_nome}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.vaga_titulo}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-700">{new Date(item.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-[10px] text-gray-500">{new Date(item.data_inicio).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="glass rounded-2xl p-4 text-xs text-gray-800">
              <p className="text-[11px] font-semibold text-gray-800 mb-3">Resumo & SLA</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-gray-600">Total agendadas</span><span className="font-semibold text-gray-900">{metrics.agendadas}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Confirmadas</span><span className="font-semibold text-emerald-600">{metrics.confirmadas}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Reagendadas</span><span className="font-semibold text-yellow-700">{metrics.reagendadas}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Canceladas</span><span className="font-semibold text-red-600">{metrics.canceladas}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Realizadas</span><span className="font-semibold text-gray-800">{metrics.realizadas}</span></div>
                <div className="pt-2 border-t border-dashed border-gray-200 flex items-center justify-between"><span className="text-gray-600">Próximas 24h</span><span className="font-semibold text-indigo-700">{metrics.next24h}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Pendente confirmação</span><span className="font-semibold text-amber-700">{metrics.pendenteConfirm}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">SLA vencido</span><span className="font-semibold text-red-700">{metrics.slaVencido}</span></div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" onClick={closeModal}>
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{formState.id ? "Editar entrevista" : "Nova entrevista"}</p>
                <p className="text-xs text-gray-500">Defina candidato, vaga, data e horário.</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-800 text-xl leading-none">×</button>
            </div>

            <form onSubmit={submitForm} className="px-4 py-3 space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 mb-1">Candidato</label>
                <input
                  value={formState.candidatoNome}
                  onChange={(event) => onCandidateInput(event.target.value)}
                  className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5"
                  placeholder="Nome do candidato"
                />
                {!!candidateSuggestions.length && (
                  <div className="mt-1 bg-white border border-gray-200 rounded-lg max-h-32 overflow-y-auto text-xs shadow-sm">
                    {candidateSuggestions.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setFormState((prev) => ({ ...prev, candidatoId: String(candidate.id), candidatoNome: candidate.nome }));
                          setCandidateSuggestions([]);
                        }}
                        className="w-full text-left px-2 py-2 hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{candidate.nome}</div>
                        <div className="text-[11px] text-gray-500">ID: {candidate.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Vaga</label>
                <select value={formState.vagaId} onChange={(event) => setFormState((prev) => ({ ...prev, vagaId: event.target.value }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5">
                  <option value="">Selecione...</option>
                  {vagas.map((vaga) => (
                    <option key={vaga.id} value={String(vaga.id)}>{vaga.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">Data</label>
                  <input type="date" value={formState.data} onChange={(event) => setFormState((prev) => ({ ...prev, data: event.target.value }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5" />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">Início</label>
                  <input type="time" value={formState.horaInicio} onChange={(event) => setFormState((prev) => ({ ...prev, horaInicio: event.target.value }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5" />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 mb-1">Fim</label>
                  <input type="time" value={formState.horaFim} onChange={(event) => setFormState((prev) => ({ ...prev, horaFim: event.target.value }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 mb-1">Tipo</label>
                  <select value={formState.tipo} onChange={(event) => setFormState((prev) => ({ ...prev, tipo: event.target.value as EntrevistaTipo }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5">
                    <option value="RH">RH</option>
                    <option value="Tecnica">Técnica</option>
                    <option value="Gestor">Gestor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Status</label>
                  <select value={formState.status} onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as EntrevistaStatus }))} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5">
                    <option>Agendada</option>
                    <option>Confirmada</option>
                    <option>Reagendada</option>
                    <option>Cancelada</option>
                    <option>Realizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Observações internas</label>
                <textarea value={formState.observacoes} onChange={(event) => setFormState((prev) => ({ ...prev, observacoes: event.target.value }))} rows={3} className="w-full rounded-lg bg-white border border-gray-300 px-2 py-1.5 resize-none" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 mt-2">
                <button type="button" onClick={closeModal} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100">Cancelar</button>
                <button type="submit" className="text-xs px-3 py-1.5 rounded-full bg-[#F58634] text-white font-semibold hover:bg-[#e9792e]">{formState.id ? "Atualizar" : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
