/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { LEADERSHIP_TABS, LOGOS, SERVICE_TABS, TEAM_MEMBERS } from "../data";
import { getTimeAgo, isNewJob, useJobsPolling } from "../hooks/useJobsPolling";
import { useTabs } from "../hooks/useTabs";
import { submitApplicationRequest } from "../services/jobsApi";
import type { Job, JobApplication } from "../types";

type ApplyFormState = Omit<JobApplication, "vaga_id">;

const INITIAL_FORM: ApplyFormState = {
  nome: "",
  telefone: "",
  email: "",
  cidade: "",
  senioridade: "",
  cargo_desejado: "",
  historico: "",
  linkedin: "",
  curriculum_url: "",
  pretensao: "",
  consentimento: false,
};

function formatSalaryRange(job: Job) {
  const minRaw = Number(job.salario_min);
  const maxRaw = Number(job.salario_max);
  const hasMin = Number.isFinite(minRaw) && minRaw > 0;
  const hasMax = Number.isFinite(maxRaw) && maxRaw > 0;

  if (!hasMin && !hasMax) return "Faixa salarial a combinar";

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  if (hasMin && hasMax) {
    return `${formatter.format(minRaw)} - ${formatter.format(maxRaw)}`;
  }

  if (hasMin) {
    return `A partir de ${formatter.format(minRaw)}`;
  }

  return `Até ${formatter.format(maxRaw)}`;
}

function getRequirementHighlights(job: Job) {
  const fullText = String(job.descricao || job.descricao_curta || "").trim();
  if (!fullText) return [] as string[];

  const requisitosMatch = fullText.match(/requisitos?\s*[:\-]?\s*([\s\S]+)/i);
  const source = (requisitosMatch ? requisitosMatch[1] : fullText).replace(/\r/g, " ").replace(/\n+/g, " ");

  const items = source
    .split(/\s*[|;,•]\s*|\s-\s/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
    .slice(0, 3);

  return items;
}

export function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<ApplyFormState>(INITIAL_FORM);
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const serviceTabs = useTabs(SERVICE_TABS);
  const leadershipTabs = useTabs(LEADERSHIP_TABS);
  const { jobs, loading, error } = useJobsPolling();

  const visibleJobs = useMemo(() => {
    if (showAllJobs) return jobs;
    return jobs.slice(0, 3);
  }, [jobs, showAllJobs]);

  const modalRequirements = useMemo(
    () => (selectedJob ? getRequirementHighlights(selectedJob) : []),
    [selectedJob],
  );

  const openApplicationModal = (job: Job) => {
    setSelectedJob(job);
    setFeedback("");
  };

  const closeApplicationModal = () => {
    setSelectedJob(null);
    setFormState(INITIAL_FORM);
    setCurriculumFile(null);
    setFeedback("");
  };

  const onSubmitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedJob) return;

    if (!formState.consentimento) {
      setFeedback("Você precisa aceitar o consentimento de dados.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      await submitApplicationRequest(
        {
          ...formState,
          vaga_id: String(selectedJob.id ?? ""),
        },
        curriculumFile,
      );

      setFeedback("✅ Candidatura enviada com sucesso.");
      setTimeout(() => closeApplicationModal(), 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar candidatura.";
      setFeedback(`❌ ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white text-slate-900 selection:bg-orange-100 selection:text-slate-900">
      <section className="relative min-h-[92vh] heroPhoto">
        <header className="fixed top-6 left-0 right-0 z-50 px-5 flex justify-center pointer-events-none">
          <div className="pointer-events-auto navPanel rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-8 max-w-6xl w-auto transition-all duration-300 hover:-translate-y-px">
            <a href="#" className="flex items-center gap-2 mr-auto md:mr-0 group">
              <img
                src="/Rhesult.png"
                alt="RHesult"
                className="h-8 w-auto group-hover:-rotate-6 transition-transform duration-300"
              />
            </a>

            <nav className="hidden md:flex items-center gap-1">
              <a href="#sobre" className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover-accent transition-colors">Quem Somos</a>
              <a href="#servicos" className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover-accent transition-colors">Serviços</a>
              <a href="#vagas" className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover-accent transition-colors">Vagas</a>
              <a href="#time" className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover-accent transition-colors">Time</a>
            </nav>

            <div className="flex items-center gap-2">
              <a href="/login" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Entrar</a>
              <button
                type="button"
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700 border border-slate-200"
                aria-label="Menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                ≡
              </button>
              <a href="https://wa.me/558597000229?text=Ol%C3%A1%20gostaria%20de%20falar%20com%20a%20RHesult" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full bg-ink text-white text-xs font-bold hover-bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 group">
                <span>Falar agora</span>
              </a>
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-60 bg-black/45 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-full max-w-xs bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <p className="font-bold">Menu</p>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="text-2xl leading-none">&times;</button>
              </div>
              <nav className="flex flex-col gap-2">
                {[
                  ["#sobre", "Quem Somos"],
                  ["#servicos", "Serviços"],
                  ["#vagas", "Vagas"],
                  ["#time", "Time"],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileMenuOpen(false)}>
                    {label}
                  </a>
                ))}
                <a href="/login" className="px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  Entrar
                </a>
                <a
                  href="https://wa.me/558597000229?text=Ol%C3%A1%20gostaria%20de%20falar%20com%20a%20RHesult"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 btnPrimary px-4 py-2 text-center text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Falar agora
                </a>
              </nav>
            </div>
          </div>
        )}

        <div className="absolute right-4 top-28 z-20 hidden md:flex flex-col gap-2">
          <a href="https://www.linkedin.com/company/rhesult/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="fab text-slate-700 hover:text-[#0077b5] transition-colors font-bold text-sm" title="LinkedIn">in</a>
          <a href="https://www.instagram.com/rhesult/" target="_blank" rel="noopener noreferrer" className="fab text-slate-700 hover:text-pink-600 transition-colors font-bold text-lg" title="Instagram">◎</a>
          <a href="https://wa.me/558597000229" target="_blank" rel="noopener noreferrer" className="fab text-slate-700 hover:text-emerald-500 transition-colors font-bold text-lg" title="WhatsApp">✆</a>
        </div>

        <div className="absolute inset-0 heroBG" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-16">
          <div className="relative">
            <div className="mx-auto max-w-4xl text-center">
              <p className="inline-flex items-center gap-2 pill px-4 py-2 text-xs text-slate-700">
                Gestão de Pessoas • Desenvolvimento • Performance
              </p>
              <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,.28)]">
                Conectando Talentos
                <span className="block">a resultados extraordinários</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-[0_10px_30px_rgba(0,0,0,.25)]">
                A RHesult ajuda empresas a contratar melhor, desenvolver lideranças e fortalecer equipes
                com método, clareza e acompanhamento.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20diagn%C3%B3stico%20com%20a%20RHesult."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btnPrimary px-6 py-3 text-sm font-semibold w-full sm:w-auto text-center"
                >
                  Agendar diagnóstico
                </a>
                <a href="#sobre" className="btnGhost px-6 py-3 text-sm font-semibold w-full sm:w-auto text-center text-slate-900">
                  Ver como funciona
                </a>
              </div>
              <div className="mt-10 pill px-4 py-3 inline-flex items-center gap-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">talentos@rhesult.com.br</span>
                <span className="opacity-60">•</span>
                <span className="font-semibold text-slate-900">(85) 9700-0229</span>
              </div>
            </div>
          </div>
        </div>
        <a href="#sobre" className="absolute bottom-4 right-4 z-20 fab" aria-label="Rolar para baixo">↓</a>
      </section>

      <section className="py-12 bg-white border-b border-slate-100 relative z-20">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[.2em] mb-8">Empresas que confiam na RHesult</p>
          <div className="marquee-wrapper w-full select-none py-8">
            <div className="marquee-track items-center">
              {[...LOGOS, ...LOGOS].map((logo, idx) => (
                <img key={`${logo}-${idx}`} src={logo} alt="Parceiro" className="h-24 md:h-40 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="relative py-18 md:py-26 bg-[#f7f8fb] overflow-hidden">
        <div className="orbit opacity-[.18]" />
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-3xl mx-auto">
            <p className="eyebrow">Sobre</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Pare de adivinhar o RH</h2>
            <p className="mt-4 text-slate-600">A RHesult estrutura decisões de pessoas com método e acompanhamento: recrutamento assertivo, liderança preparada e times mais engajados.</p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <a href="#servicos" className="btnGhost px-5 py-3 text-sm font-semibold text-slate-900">Explorar benefícios</a>
              <a href="#contato" className="btnPrimary px-5 py-3 text-sm font-semibold">Falar com a RHesult</a>
            </div>
          </div>

          <div className="mt-14 grid lg:grid-cols-4 gap-5 items-end">
            <div className="glassCard shadowSoft p-6">
              <p className="text-xs text-slate-500">Rotina</p>
              <p className="mt-2 text-lg font-bold text-slate-900 leading-tight">Diagnósticos periódicos e planos de ação</p>
              <p className="mt-3 text-sm text-slate-600">Clareza de prioridades, métricas e execução.</p>
              <div className="mt-5 flex gap-2">
                <span className="pill px-3 py-1 text-xs">Clima</span>
                <span className="pill px-3 py-1 text-xs">Performance</span>
              </div>
            </div>

            <div className="glassCard shadowSoft p-6">
              <p className="text-xs text-slate-500">Seleção</p>
              <p className="mt-2 text-lg font-bold">Contratar melhor</p>
              <p className="mt-3 text-sm text-slate-600">Critérios, aderência cultural e redução de erro de contratação.</p>
              <div className="mt-5 flex items-center gap-2">
                <div className="fab w-9! h-9!">✓</div>
                <span className="text-xs text-slate-600">Pipeline e parecer</span>
              </div>
            </div>

            <div className="glassCard shadowSoft p-6">
              <p className="text-xs text-slate-500">Desenvolvimento</p>
              <p className="mt-2 text-lg font-bold">Lideranças fortes</p>
              <p className="mt-3 text-sm text-slate-600">Treinamento prático e alinhado ao dia a dia da empresa.</p>
              <div className="mt-5 flex items-center gap-2">
                <span className="pill px-3 py-1 text-xs">T&D</span>
                <span className="pill px-3 py-1 text-xs">Gestão</span>
              </div>
            </div>

            <div className="glassCard shadowSoft p-6">
              <p className="text-xs text-slate-500">Cultura</p>
              <p className="mt-2 text-lg font-bold">Engajamento</p>
              <p className="mt-3 text-sm text-slate-600">Ações para fortalecer ambiente, retenção e produtividade.</p>
              <div className="mt-5 text-xs text-slate-500">“Não é o que fazemos, mas como fazemos.”</div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glassCard p-6 text-center md:text-left">
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Missão</h3>
              <p className="text-slate-600">Promover a valorização profissional e o desenvolvimento organizacional através de uma ação integrada das estratégias de gestão de pessoas com o objetivo de gerar os melhores resultados.</p>
            </div>

            <div className="glassCard p-6 text-center md:text-left">
              <h4 className="text-sm font-bold text-slate-900 uppercase mb-3">Valores</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• Ética</li>
                <li>• Responsabilidade social</li>
                <li>• Foco no resultado</li>
                <li>• Valorização do capital humano</li>
              </ul>
            </div>

            <div className="glassCard p-6 text-center md:text-left">
              <h4 className="text-sm font-bold text-slate-900 uppercase mb-3">Objetivo</h4>
              <p className="text-slate-600">Transformar informação em conhecimento, habilidades e atitudes, alinhados à estratégia da empresa, valorizando a força do trabalho humano como diferencial na gestão empresarial.</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20RHesult." target="_blank" rel="noopener noreferrer" className="btnPrimary px-6 py-3 text-sm font-semibold">Falar com a RHesult</a>
          </div>
        </div>
      </section>

      <section id="servicos" className="relative py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="eyebrow">Serviços</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Gestão de pessoas, com método</h2>
              <p className="mt-4 text-slate-600 max-w-2xl">Da seleção ao desenvolvimento, a RHesult estrutura processos que viram rotina.</p>
            </div>
            <div className="pill p-1 inline-flex gap-1 shadowSoft">
              {SERVICE_TABS.map((tab, index) => (
                <button
                  key={tab.tag}
                  type="button"
                  onClick={() => serviceTabs.setIndex(index)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full ${serviceTabs.index === index ? "bg-white shadowSoft" : "text-slate-700"}`}
                >
                  {tab.tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="premium-card overflow-hidden">
              <div className="h-90" style={{ background: `radial-gradient(900px 420px at 20% 10%, rgba(245,134,52,.14), transparent 55%), url('${serviceTabs.current.bg}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>
            <div className="premium-card p-8">
              <div className="flex justify-between items-center">
                <p className="pill px-4 py-2 text-xs font-semibold">{serviceTabs.current.tag}</p>
                <div className="flex gap-2">
                  <button type="button" className="fab" onClick={serviceTabs.prev}>‹</button>
                  <button type="button" className="fab" onClick={serviceTabs.next}>›</button>
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-extrabold text-slate-900">{serviceTabs.current.title}</h3>
              <p className="mt-3 text-slate-600">{serviceTabs.current.desc}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {serviceTabs.current.list.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-accent">✓</span>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <div className="glassCard shadowSoft p-6">
              <p className="text-sm font-bold">Diagnóstico</p>
              <p className="mt-2 text-sm text-slate-600">Entendemos cenário, dores e contexto. Definimos foco e prioridade.</p>
            </div>
            <div className="glassCard shadowSoft p-6">
              <p className="text-sm font-bold">Critérios e método</p>
              <p className="mt-2 text-sm text-slate-600">Processos claros para contratar, avaliar, desenvolver e reter.</p>
            </div>
            <div className="glassCard shadowSoft p-6">
              <p className="text-sm font-bold">Execução</p>
              <p className="mt-2 text-sm text-slate-600">Seleção, T&D, clima e consultoria aplicados ao dia a dia.</p>
            </div>
            <div className="glassCard shadowSoft p-6">
              <p className="text-sm font-bold">Acompanhamento</p>
              <p className="mt-2 text-sm text-slate-600">Ajustes finos, orientação e métricas para sustentar resultado.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="lideranca" className="relative py-16 md:py-24 bg-white overflow-hidden border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="eyebrow">Liderança & Desenvolvimento</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Liderança que inspira e transforma</h2>
            </div>
            <div className="pill p-1 inline-flex gap-1 flex-wrap">
              {LEADERSHIP_TABS.map((tab, index) => (
                <button
                  key={tab.tag}
                  type="button"
                  onClick={() => leadershipTabs.setIndex(index)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full ${leadershipTabs.index === index ? "bg-white shadowSoft" : "text-slate-700"}`}
                >
                  {tab.tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="premium-card overflow-hidden">
              <div className="h-90" style={{ background: `radial-gradient(900px 420px at 20% 10%, rgba(245,134,52,.14), transparent 55%), url('${leadershipTabs.current.bg}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>
            <div className="premium-card p-8">
              <div className="flex items-center justify-between">
                <div className="pill px-4 py-2 text-xs font-semibold text-slate-700">{leadershipTabs.current.tag}</div>
                <div className="flex items-center gap-2">
                  <button type="button" className="fab" onClick={leadershipTabs.prev}>‹</button>
                  <button type="button" className="fab" onClick={leadershipTabs.next}>›</button>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">{leadershipTabs.current.title}</h3>
              <p className="mt-3 text-slate-600">{leadershipTabs.current.desc}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {leadershipTabs.current.list.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-accent">•</span>{item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20conversar%20sobre%20o%20Programa%20de%20Desenvolvimento%20de%20Lideran%C3%A7as%20da%20RHESULT." target="_blank" rel="noopener noreferrer" className="btnPrimary px-8 py-3 text-sm font-semibold text-center">Saiba mais</a>
                <a href="#contato" className="btnGhost px-8 py-3 text-sm font-semibold text-center text-slate-900">Falar com consultor</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="time" className="relative py-20 md:py-24 bg-[#f6f7fb] overflow-hidden border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-5 relative z-10">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-bold text-accent uppercase tracking-[.2em] mb-4">Quem faz acontecer</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Humanos por trás dos dados.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
            <div className="relative w-full h-75 md:h-105 rounded-[20px] overflow-hidden shadow-2xl border border-white/60 group">
              <video
                id="manifestoVideo"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                controls
                poster="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
              >
                <source src="/assets/images/RHESULT I AFAGO.mp4" type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
            </div>

            <div className="max-w-xl">
              <p className="text-xs tracking-[.18em] uppercase text-slate-500">Manifesto</p>
              <h3 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">Cultura de alta performance</h3>
              <p className="mt-3 text-slate-600">Veja como transformamos ambientes corporativos com metodologia proprietária. Do diagnóstico ao plano de ação, medimos impacto e garantimos evolução.</p>

              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3"><span className="text-(--accent) font-bold">•</span> Metodologia prática e escalável</li>
                <li className="flex items-start gap-3"><span className="text-(--accent) font-bold">•</span> Indicadores para decisão contínua</li>
                <li className="flex items-start gap-3"><span className="text-(--accent) font-bold">•</span> Acompanhamento e responsabilização</li>
              </ul>

              <div className="mt-6 flex gap-3">
                <a href="#contato" className="btnPrimary px-5 py-3 text-sm font-semibold">Agendar diagnóstico</a>
                <a href="#manifestoVideo" className="btnGhost px-5 py-3 text-sm font-semibold">Ver manifesto →</a>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="premium-card p-6 flex flex-col items-center text-center h-full bg-white/60">
                <img src={member.image} alt={member.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-sm mb-5 transition-transform duration-300 hover:scale-105" />
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">“{member.quote}”</p>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover-bg-accent hover:text-white hover-border-accent transition-all">in</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="vagas" className="relative py-16 md:py-24 bg-[#f7f8fb] overflow-hidden">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-3xl mx-auto">
            <p className="eyebrow">Vagas e oportunidades</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Alinhadas ao seu perfil</h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {loading && (
              <div className="glassCard p-6 text-center text-slate-500 col-span-full">Carregando vagas...</div>
            )}
            {!loading && error && (
              <div className="glassCard p-6 text-center text-red-500 col-span-full">{error}</div>
            )}
            {!loading && !error && jobs.length === 0 && (
              <div className="glassCard p-6 text-center text-slate-500 col-span-full">Nenhuma vaga ativa no momento.</div>
            )}

            {visibleJobs.map((job) => {
              const requirements = getRequirementHighlights(job);

              return (
              <article key={String(job.id ?? job.titulo)} className="premium-card relative p-6 flex flex-col">
                {isNewJob(job) && <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full">Nova</span>}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="pill px-2.5 py-1 text-[10px] font-bold">{job.tipo_contrato || "CLT"}</span>
                  <span className="pill px-2.5 py-1 text-[10px] font-bold">{job.senioridade || "Nível não informado"}</span>
                  {job.status && <span className="pill px-2.5 py-1 text-[10px] font-bold">{job.status}</span>}
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{job.titulo}</h3>
                <p className="text-sm text-slate-600 line-clamp-3">{job.descricao_curta ?? job.descricao ?? "Oportunidade para seu próximo passo profissional."}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">Local</span>
                    <span className="text-right">{job.cidade || "Não informado"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">Modelo</span>
                    <span className="text-right">{job.modelo_trabalho || "Não informado"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">Salário</span>
                    <span className="text-right">{formatSalaryRange(job)}</span>
                  </div>
                </div>

                {requirements.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">Requisitos</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {requirements.map((item) => (
                        <li key={`${String(job.id ?? job.titulo)}-${item}`} className="flex items-start gap-2">
                          <span className="text-accent leading-none mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 text-xs text-slate-500">{getTimeAgo(job.created_at || job.data_criacao)}</div>

                <button type="button" onClick={() => openApplicationModal(job)} className="mt-5 w-full btnPrimary px-4 py-3 text-sm font-semibold">
                  Candidatar-se
                </button>
              </article>
            );
            })}
          </div>

          {!loading && jobs.length > 3 && !showAllJobs && (
            <div className="mt-10 text-center">
              <button type="button" className="btnPrimary px-8 py-3 text-sm font-semibold" onClick={() => setShowAllJobs(true)}>
                Ver mais {jobs.length - 3} oportunidades
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="contato" className="relative py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-3xl mx-auto">
            <p className="eyebrow">Contato</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Vamos conversar?</h2>
            <p className="mt-4 text-slate-600">Conte o cenário da sua empresa e receba um direcionamento claro sobre os próximos passos.</p>
          </div>

          <div className="mt-12 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 premium-card p-8">
              <h3 className="text-xl font-extrabold">Agendar diagnóstico</h3>
              <form className="mt-6 grid sm:grid-cols-2 gap-4">
                <input className="sm:col-span-1 inputPremium" placeholder="Nome" />
                <input className="sm:col-span-1 inputPremium" placeholder="Empresa" />
                <input className="sm:col-span-1 inputPremium" placeholder="WhatsApp" />
                <input className="sm:col-span-1 inputPremium" placeholder="E-mail" />
                <select className="sm:col-span-2 inputPremium" defaultValue="">
                  <option value="" disabled>Principal desafio</option>
                  <option>Contratação e seleção</option>
                  <option>Desenvolvimento de liderança</option>
                  <option>Clima e engajamento</option>
                  <option>Processos de RH e indicadores</option>
                  <option>Outro</option>
                </select>
                <button type="button" className="sm:col-span-2 btnPrimary px-6 py-3 text-sm font-semibold">Enviar e agendar</button>
              </form>
            </div>

            <div className="lg:col-span-5 premium-card p-8">
              <h3 className="text-xl font-extrabold">Dados</h3>
              <p className="mt-2 text-sm text-slate-600">RHesult • Consultoria em Gestão de Pessoas</p>
              <div className="mt-6 space-y-4 text-sm">
                <div className="pill px-4 py-3">
                  <p className="font-semibold text-slate-900">Endereço</p>
                  <p className="text-slate-600">Av. Dom Luís, 500, Sala 925 • Shopping Aldeota</p>
                  <p className="text-slate-600">Meireles • Fortaleza, CE</p>
                </div>
                <div className="pill px-4 py-3">
                  <p className="font-semibold text-slate-900">E-mail</p>
                  <p className="text-slate-600">talentos@rhesult.com.br</p>
                </div>
                <div className="pill px-4 py-3">
                  <p className="font-semibold text-slate-900">Telefone</p>
                  <p className="text-slate-600">(85) 9700-0229</p>
                </div>
                <div className="pill px-4 py-3">
                  <p className="font-semibold text-slate-900">Frase-chave</p>
                  <p className="text-slate-600">Não é o que fazemos, mas como fazemos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <a href="#" className="flex items-center gap-2 mb-6 group">
                <img src="/Rhesult.png" alt="RHesult" className="h-8 w-auto group-hover:-rotate-6 transition-transform" />
              </a>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Transformamos empresas através da gestão estratégia de pessoas. Consultoria, recrutamento e desenvolvimento.
              </p>
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/company/rhesult/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-colors">in</a>
                <a href="https://www.instagram.com/rhesult/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">ig</a>
                <a href="https://wa.me/558597000229" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">wa</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#sobre" className="hover:text-(--accent) transition-colors">Quem Somos</a></li>
                <li><a href="#time" className="hover:text-(--accent) transition-colors">Nossa Equipe</a></li>
                <li><a href="#time" className="hover:text-(--accent) transition-colors">Manifesto</a></li>
                <li><a href="#vagas" className="hover:text-(--accent) transition-colors">Trabalhe Conosco</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Soluções</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#servicos" className="hover:text-(--accent) transition-colors">Recrutamento Tech</a></li>
                <li><a href="#servicos" className="hover:text-(--accent) transition-colors">Consultoria de RH</a></li>
                <li><a href="#servicos" className="hover:text-(--accent) transition-colors">Treinamento &amp; DHO</a></li>
                <li><a href="#servicos" className="hover:text-(--accent) transition-colors">Diagnóstico de Cultura</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Fale Conosco</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Fortaleza - CE</li>
                <li>(85) 99700-0229</li>
                <li>talentos@rhesult.com.br</li>
                <li className="pt-2">
                  <a href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20diagn%C3%B3stico%20com%20a%20RHesult." target="_blank" rel="noopener noreferrer" className="text-(--accent) font-bold hover:underline">Agendar Diagnóstico →</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} RHesult Consultoria. Todos os direitos reservados.</p>
            <div className="flex gap-6 text-xs text-slate-500">
              <a href="#" className="hover:text-slate-800">Privacidade</a>
              <a href="#" className="hover:text-slate-800">Termos</a>
            </div>
          </div>
        </div>
      </footer>

      {selectedJob && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={closeApplicationModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100" onClick={(event) => event.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Candidatar-se</h3>
              <button type="button" className="text-2xl leading-none text-slate-500" onClick={closeApplicationModal}>&times;</button>
            </div>
            <form className="p-5 space-y-4" onSubmit={onSubmitApplication}>
              <input value={selectedJob.titulo} disabled className="w-full inputPremium bg-slate-50" />

              {modalRequirements.length > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">Requisitos da vaga</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {modalRequirements.map((item) => (
                      <li key={`modal-${String(selectedJob.id ?? selectedJob.titulo)}-${item}`} className="flex items-start gap-2">
                        <span className="text-accent leading-none mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <input required placeholder="Nome" className="w-full inputPremium" value={formState.nome} onChange={(event) => setFormState((prev) => ({ ...prev, nome: event.target.value }))} />
              <input required placeholder="Telefone" className="w-full inputPremium" value={formState.telefone} onChange={(event) => setFormState((prev) => ({ ...prev, telefone: event.target.value }))} />
              <input required type="email" placeholder="E-mail" className="w-full inputPremium" value={formState.email} onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))} />
              <select required className="w-full inputPremium" value={formState.senioridade} onChange={(event) => setFormState((prev) => ({ ...prev, senioridade: event.target.value }))}>
                <option value="">Selecione a senioridade</option>
                <option value="Júnior">Júnior</option>
                <option value="Pleno">Pleno</option>
                <option value="Sênior">Sênior</option>
                <option value="Especialista">Especialista</option>
              </select>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCurriculumFile(event.target.files?.[0] ?? null)} className="w-full inputPremium" />
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={formState.consentimento} onChange={(event) => setFormState((prev) => ({ ...prev, consentimento: event.target.checked }))} />
                Concordo com o armazenamento dos dados para banco de talentos.
              </label>

              {feedback && <p className="text-sm text-slate-600">{feedback}</p>}

              <div className="flex gap-2">
                <button type="button" className="w-1/2 rounded-lg border border-slate-300 py-2" onClick={closeApplicationModal}>Cancelar</button>
                <button type="submit" disabled={submitting} className="w-1/2 btnPrimary py-2 text-sm font-semibold">
                  {submitting ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
