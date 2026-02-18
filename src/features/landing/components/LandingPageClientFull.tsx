/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LEADERSHIP_TABS, LOGOS, SERVICE_TABS, TEAM_MEMBERS } from "../data";
import { getTimeAgo, isNewJob, useJobsPolling } from "../hooks/useJobsPolling";
import { useTabs } from "../hooks/useTabs";
import { submitApplicationRequest } from "../services/jobsApi";
import type { Job, JobApplication } from "../types";

// --- Components Ultra Premium ---

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

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden group/spotlight bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(234, 88, 12, 0.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function RevealOnScroll({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0 filter blur-0" : "opacity-0 translate-y-10 filter blur-sm"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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
  const [scrolled, setScrolled] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const [formState, setFormState] = useState<ApplyFormState>(INITIAL_FORM);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setOffsetY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <main className="bg-white text-slate-900 selection:bg-orange-100 selection:text-slate-900 overflow-x-hidden">
      <div className="noise-overlay" />
      <section className="relative min-h-[92vh] heroPhoto">
        <header
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-500 ease-in-out ${
            scrolled ? "py-2 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100" : "py-6 px-5 pointer-events-none"
          }`}
        >
          <div
            className={`pointer-events-auto flex items-center justify-between gap-4 md:gap-8 transition-all duration-500 max-w-7xl w-full ${
              scrolled
                ? "px-6"
                : "rounded-full px-6 py-2.5 bg-white/80 backdrop-blur-lg border border-white/60 shadow-xl shadow-slate-200/40 hover:-translate-y-0.5 mx-auto w-auto"
            }`}
          >
            <a href="#" className="flex items-center gap-2 mr-auto md:mr-0 group">
              <img
                src="/Rhesult.png"
                alt="RHesult"
                className={`transition-all duration-300 ${scrolled ? "h-7" : "h-8"} w-auto group-hover:-rotate-3`}
              />
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {["Quem Somos", "Serviços", "Vagas", "Liderança", "Time"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "")}`}
                  className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-orange-600 transition-colors group"
                >
                  {item}
                  <span className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-orange-600 group-hover:w-1/2 group-hover:left-1/4 transition-all duration-300"></span>
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a href="/login" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Entrar</a>
              <button
                type="button"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-700 border border-slate-200"
                aria-label="Menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                ≡
              </button>
              <a 
                href="https://wa.me/558597000229?text=Ol%C3%A1%20gostaria%20de%20falar%20com%20a%20RHesult" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 group ${scrolled ? "shadow-none" : "shadow-lg shadow-slate-900/20"}`}
              >
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
        
        {/* Decorative Blobs with Parallax */}
        <div 
          className="absolute top-1/4 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '4s', transform: `translateY(${offsetY * 0.3}px)` }} 
        />
        <div 
          className="absolute bottom-1/4 right-10 w-96 h-96 bg-orange-300/10 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '7s', transform: `translateY(${offsetY * 0.5}px)` }} 
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-20 text-center lg:pt-40">
          <div className="mx-auto max-w-5xl">
            {/* Pill Badge */}
            <RevealOnScroll delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200/60 mb-8 hover:bg-white hover:shadow transition-all cursor-default">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Soluções completas em Gestão de Pessoas
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[1.05]">
                Talentos que geram <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 relative">
                  resultados reais
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
            </RevealOnScroll>
            
            <RevealOnScroll delay={400}>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
                Transforme a sua empresa com recrutamento assertivo, desenvolvimento de lideranças e consultoria estratégica de RH.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={600}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20diagn%C3%B3stico%20com%20a%20RHesult."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btnPrimary px-8 py-4 text-base font-semibold w-full sm:w-auto shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all scale-100 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Agendar diagnóstico gratuito</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <a href="#sobre" className="group px-8 py-4 text-base font-semibold text-slate-600 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-full hover:bg-white hover:border-slate-300 transition-all w-full sm:w-auto shadow-sm flex items-center justify-center gap-2">
                  Conhecer solucões
                </a>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={800}>
              <div className="mt-16 pt-8 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-sm text-slate-500">
               <div className="flex flex-col items-center gap-1">
                 <span className="text-3xl font-bold text-slate-900">+10k</span>
                 <span>Vidas impactadas</span>
               </div>
               <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-3xl font-bold text-slate-900">98%</span>
                 <span>Satisfação de clientes</span>
               </div>
               <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-3xl font-bold text-slate-900">15+</span>
                 <span>Anos de experiência</span>
               </div>
            </div>
          </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 relative z-20 shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">Empresas que confiam na RHesult</p>
          <div className="relative marquee-wrapper w-full select-none overflow-hidden mask-linear-fade">
             <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 z-10"></div>
             <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 z-10"></div>
            <div className="marquee-track flex gap-16 items-center animate-scroll">
              {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, idx) => (
                <img key={`${logo}-${idx}`} src={logo} alt="Parceiro" className="h-[110px] w-auto max-w-[200px] object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-105" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="relative py-24 bg-slate-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div 
          className="absolute -left-20 top-40 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl opacity-60 transition-transform duration-75 will-change-transform"
          style={{ transform: `translateY(${offsetY * 0.15}px)` }}
        />
        <div 
          className="absolute -right-20 bottom-20 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl opacity-60 transition-transform duration-75 will-change-transform"
          style={{ transform: `translateY(${offsetY * -0.1}px)` }}
        />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Sobre a RHesult</h2>
            <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
              Pare de adivinhar no <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700">RH</span>
            </p>
            <p className="text-lg leading-relaxed text-slate-600">
              Estruturamos decisões de pessoas com método, dados e acompanhamento próximo.
              Do recrutamento assertivo à cultura forte que retém talentos.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <a href="#servicos" className="btnGhost px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white hover:shadow-sm transition-all rounded-full">Explorar serviços</a>
              <a href="#contato" className="btnPrimary px-6 py-3 text-sm font-semibold shadow-lg shadow-orange-500/20 rounded-full">Falar com consultor</a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealOnScroll delay={0} className="h-full">
              <SpotlightCard className="p-8 h-full group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-3xl mb-6 text-orange-600 group-hover:scale-110 transition-transform shadow-sm">📊</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Diagnóstico Preciso</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Análise profunda do cenário, dores e cultura para definir as prioridades que trazem retorno rápido.
                </p>
              </SpotlightCard>
            </RevealOnScroll>

            <RevealOnScroll delay={100} className="h-full">
              <SpotlightCard className="p-8 h-full group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-3xl mb-6 text-blue-600 group-hover:scale-110 transition-transform shadow-sm">🎯</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Recrutamento Ágil</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Processos seletivos estruturados que encontram o fit cultural ideal, reduzindo turnover.
                </p>
              </SpotlightCard>
            </RevealOnScroll>

            <RevealOnScroll delay={200} className="h-full">
              <SpotlightCard className="p-8 h-full group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-3xl mb-6 text-purple-600 group-hover:scale-110 transition-transform shadow-sm">🚀</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Desenvolvimento</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Treinamento de líderes e times com foco em performance e resultados reais.
                </p>
              </SpotlightCard>
            </RevealOnScroll>

            <RevealOnScroll delay={300} className="h-full">
              <SpotlightCard className="p-8 h-full group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-3xl mb-6 text-green-600 group-hover:scale-110 transition-transform shadow-sm">🤝</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Cultura Forte</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ações práticas para fortalecer o ambiente, reter talentos e aumentar a produtividade.
                </p>
              </SpotlightCard>
            </RevealOnScroll>
          </div>

          {/* Mission/Vision/Values Strip */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 pt-16 border-t border-slate-200">
            <RevealOnScroll delay={0}>
              <div className="text-center md:text-left group cursor-default p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="w-8 h-1 bg-orange-500 rounded-full group-hover:w-12 transition-all"></span>
                  <h4 className="font-bold text-slate-900 uppercase tracking-widest text-sm">Missão</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">Promover a valorização profissional e o desenvolvimento organizacional através de estratégias integradas de gestão.</p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={100}>
              <div className="text-center md:text-left group cursor-default p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="w-8 h-1 bg-blue-500 rounded-full group-hover:w-12 transition-all"></span>
                  <h4 className="font-bold text-slate-900 uppercase tracking-widest text-sm">Visão</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">Ser referência em gestão de pessoas no Norte/Nordeste, transformando o capital humano em diferencial competitivo.</p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <div className="text-center md:text-left group cursor-default p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="w-8 h-1 bg-green-500 rounded-full group-hover:w-12 transition-all"></span>
                  <h4 className="font-bold text-slate-900 uppercase tracking-widest text-sm">Valores</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">Ética, Transparência, Foco no Resultado e Valorização Humana como pilares inegociáveis.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section id="filosofia" className="relative py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          
          {/* Liderança Humanizada */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 lg:mb-24">
            <div 
              className="relative will-change-transform transition-transform duration-100 ease-out mx-auto w-full max-w-md lg:max-w-none"
              style={{ 
                // Disable parallax on mobile by using a media eqv check or just setting to 0 if width < lg, 
                // but since we don't have width in JS easily without hook, let's use a class-based approach 
                // or ensure the transform is only applied on larger screens if possible.
                // However, inline styles override classes. 
                // Let's modify the translateY calculation to be 0 for small screens if we can't detect it,
                // OR better, Apply the style via a class that is only active on lg viewports if we were using tailwind arbitrary values, 
                // but we use dynamic values.
                // A common fix: render the style only if window width is large, or reduce the intensity drastically.
                // For now, let's REDUCE the intensity significantly or clamp it. 
                // Actually, the best fix for mobile overlapping is to NOT apply this transform on mobile.
                
                // Let's use a conditional spread or just make the factor much smaller and ensure layout spacing handles it.
                // The issue is likely that "offsetY" is large, pushing the image way down.
                transform: `translateY(${(offsetY - 1800) * 0.04}px)` 
              }}
            >
              <div className="absolute -inset-4 bg-orange-100 rounded-full blur-3xl opacity-30"></div>
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Liderança Humanizada" 
                className="relative rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl rotate-1 md:rotate-2 hover:rotate-0 transition-transform duration-500 w-full object-cover h-[300px] md:h-auto"
              />
            </div>
            <RevealOnScroll delay={100} className="relative z-10 bg-white/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none p-4 rounded-2xl lg:p-0 -mt-10 lg:mt-0 shadow-lg lg:shadow-none border border-white/50 lg:border-none">
              <h2 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Filosofia</h2>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">Liderança Humanizada e Performance Sustentável</h3>
              <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
                <p>
                  Liderar sem humanizar deixou de ser uma opção. As organizações que desejam crescer de forma sólida precisam compreendender que resultados financeiros sustentáveis caminham junto com relações saudáveis, engajamento genuíno e desenvolvimento real das pessoas.
                </p>
                <p>
                  Hoje, líderes são avaliados não apenas por metas alcançadas, mas por indicadores como clima organizacional, escuta ativa, confiança e capacidade de desenvolver equipes. É nesse contexto que o RH assume um papel verdadeiramente estratégico.
                </p>
                <p>
                  Na RHESULT, vamos além dos processos. Formamos lideranças preparadas para conduzir pessoas, relações e decisões com consciência, empatia e responsabilidade. 
                </p>
                <div className="pl-4 border-l-4 border-orange-500 italic text-slate-700 font-medium my-6 text-sm md:text-base bg-orange-50/50 p-4 rounded-r-lg">
                  "Transformamos liderança em resultado humano e estratégico."
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Desenvolvimento Contínuo */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 lg:mb-24">
            <RevealOnScroll className="order-2 lg:order-1 relative z-10 bg-white/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none p-4 rounded-2xl lg:p-0 -mt-10 lg:mt-0 shadow-lg lg:shadow-none border border-white/50 lg:border-none">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Estratégia</h2>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">Desenvolvimento Contínuo como Estratégia de Negócio</h3>
              <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
                <p>
                  Capacitação contínua não é mais um diferencial — é uma necessidade estratégica. Em um mercado onde funções, tecnologias e modelos de trabalho mudam em ritmo acelerado, investir apenas em habilidades técnicas já não sustenta resultados no médio e longo prazo.
                </p>
                <p>
                  O novo foco do RH está no desenvolvimento de competências comportamentais essenciais para o futuro, como adaptabilidade, colaboração, pensamento crítico e capacidade de aprender continuamente.
                </p>
                <p className="font-semibold text-slate-900 bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-500">
                  Capacitação não é custo. É investimento direto em competitividade, inovação e sustentabilidade dos resultados.
                </p>
              </div>
            </RevealOnScroll>
            <div 
              className="relative order-1 lg:order-2 will-change-transform transition-transform duration-100 ease-out mx-auto w-full max-w-md lg:max-w-none"
              style={{ transform: `translateY(${(offsetY - 2300) * 0.04}px)` }}
            >
              <div className="absolute -inset-4 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Desenvolvimento Contínuo" 
                className="relative rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl -rotate-1 md:-rotate-2 hover:rotate-0 transition-transform duration-500 w-full object-cover h-[300px] md:h-auto"
              />
            </div>
          </div>

          {/* Destaque 2026 */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 py-12 px-6 md:py-16 md:px-16 text-center shadow-xl md:shadow-2xl mx-auto w-full">
            <div 
              className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] will-change-transform"
              style={{ backgroundPosition: `center ${offsetY * 0.1}px` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900/80"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <RevealOnScroll>
                <h3 className="text-xl md:text-4xl font-bold text-white mb-4 md:mb-6 leading-snug">
                  EM 2026, O RH do futuro assume um papel ainda mais ativo
                </h3>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-6 md:mb-8 text-justify md:text-center">
                  O RH do futuro assume um papel ainda mais ativo e responsável na construção de ambientes organizacionais justos, diversos e inclusivos. Isso envolve investir em formações contínuas, revisar políticas com um viés verdadeiramente inclusivo e criar canais consistentes de escuta ativa.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={400}>
                <div className="inline-block px-4 py-2 md:px-6 md:py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur text-white text-xs md:text-sm font-semibold mx-auto">
                  Diversidade com estratégia, consistência e resultado humano.
                </div>
              </RevealOnScroll>
            </div>
          </div>

        </div>
      </section>

      <section id="servicos" className="relative py-24 bg-slate-50 overflow-hidden">
        <div 
          className="absolute -left-40 top-20 w-96 h-96 bg-orange-300/10 rounded-full blur-3xl opacity-60 will-change-transform"
          style={{ transform: `translateY(${(offsetY - 2800) * 0.1}px)` }}
        />
        <div 
          className="absolute -right-40 bottom-20 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl opacity-60 will-change-transform"
          style={{ transform: `translateY(${(offsetY - 3200) * -0.05}px)` }}
        />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold leading-7 text-orange-600 uppercase tracking-widest mb-3">Nossos Serviços</h2>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">Gestão de pessoas com método</h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Soluções completas para estruturar seu RH, da atração de talentos ao desenvolvimento de lideranças.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 backdrop-blur rounded-full">
              {SERVICE_TABS.map((tab, index) => (
                <button
                  key={tab.tag}
                  type="button"
                  onClick={() => serviceTabs.setIndex(index)}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wide rounded-full transition-all duration-300 ${
                    serviceTabs.index === index 
                    ? "bg-white text-orange-600 shadow-md transform scale-105" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  {tab.tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="min-h-[400px] rounded-3xl overflow-hidden shadow-2xl relative group">
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors duration-500 z-10" />
              <div 
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                style={{ 
                  background: `url('${serviceTabs.current.bg}')`, 
                  backgroundSize: "cover", 
                  backgroundPosition: "center" 
                }} 
              />
            </div>
            
            <div className="flex flex-col justify-center bg-slate-50 rounded-3xl p-8 lg:p-12 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                  {serviceTabs.current.tag}
                </span>
                <div className="flex gap-2">
                  <button type="button" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-all" onClick={serviceTabs.prev}>←</button>
                  <button type="button" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-all" onClick={serviceTabs.next}>→</button>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-slate-900 mb-4">{serviceTabs.current.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">{serviceTabs.current.desc}</p>
              
              <ul className="space-y-4">
                {serviceTabs.current.list.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <div className="mt-1 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">✓</div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-900 mb-2">Diagnóstico</p>
              <p className="text-sm text-slate-600">Entendemos cenário, dores e contexto. Definimos foco.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-900 mb-2">Critérios e método</p>
              <p className="text-sm text-slate-600">Processos claros para contratar e avaliar.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-900 mb-2">Execução</p>
              <p className="text-sm text-slate-600">Seleção e consultoria aplicados ao dia a dia.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-900 mb-2">Acompanhamento</p>
              <p className="text-sm text-slate-600">Ajustes finos e métricas para sustentar resultados.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="lideranca" className="relative py-24 bg-white overflow-hidden border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Liderança</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
              Programa de Desenvolvimento de Lideranças
            </h3>
            <p className="max-w-3xl mx-auto text-lg leading-relaxed text-slate-600">
              Desenvolver líderes é construir resultados sustentáveis. Nosso programa leva conhecimento estratégico para perto de quem faz a gestão acontecer no dia a dia.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-20 bg-slate-50 rounded-3xl p-8 lg:p-12 shadow-inner">
            <div>
              <h4 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-orange-500 pl-4">Como funciona</h4>
              <p className="text-slate-600 mb-4">Os encontros são conduzidos a partir da realidade da organização e marcados por:</p>
              <ul className="space-y-4">
                {[
                  "Aprendizado aplicado aos desafios reais do negócio",
                  "Trocas qualificadas entre gestores e líderes",
                  "Reflexões profundas sobre comportamento e postura",
                  "Discussões práticas sobre desafios cotidianos",
                  "Desenvolvimento de uma gestão mais humana e eficiente"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-green-500 pl-4">Resultados para a empresa</h4>
              <p className="text-slate-600 mb-4">Quando uma empresa investe no desenvolvimento de seus líderes, ela colhe:</p>
              <ul className="space-y-4">
                {[
                  "Times mais engajados e comprometidos",
                  "Comunicação mais clara e objetiva",
                  "Redução de retrabalho e conflitos",
                  "Tomadas de decisão mais seguras",
                  "Entregas consistentes e alinhadas à estratégia"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">★</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Práticas de Liderança - Cards Grid */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">
              Práticas que impulsionam o engajamento
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Escutar antes de agir", icon: "👂", desc: "Compreendendo contextos, desafios e percepções da equipe." },
                { title: "Reconhecer esforços", icon: "🏆", desc: "Não apenas resultados, valorizando o processo e o desenvolvimento." },
                { title: "Comunicação Clara", icon: "💬", desc: "Clara e empática, fortalecendo relações de confiança." },
                { title: "Autonomia responsável", icon: "🚀", desc: "Estimulando protagonismo e senso de pertencimento." },
                { title: "Saúde Mental", icon: "🧠", desc: "Promovendo ambientes psicologicamente seguros e sustentáveis." },
                { title: "Liderar com Propósito", icon: "⭐", desc: "Criar ambientes onde as pessoas entreguem seu melhor." }
              ].map((card, idx) => (
                <div key={idx} className="glassCard p-6 group hover:bg-white transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{card.icon}</div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center bg-slate-900 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-blue-600/20 group-hover:opacity-75 transition-opacity"></div>
            <h3 className="relative z-10 text-2xl font-bold mb-4">Desenvolver liderança não é tendência. É necessidade.</h3>
            <p className="relative z-10 text-slate-300 max-w-2xl mx-auto mb-8">
              Se a sua empresa busca fortalecer gestores e preparar equipes para os desafios do mercado, a RHESULT pode ajudar.
            </p>
            <a 
              href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20conversar%20sobre%20o%20Programa%20de%20Desenvolvimento%20de%20Lideran%C3%A7as." 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative z-10 btnPrimary bg-white text-orange-600 hover:bg-slate-100 hover:text-orange-700 px-8 py-3 font-bold shadow-lg"
            >
              Conhecer o Programa
            </a>
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
            {TEAM_MEMBERS.map((member, idx) => (
              <RevealOnScroll key={member.name} delay={idx * 100} className="h-full">
                <div className="premium-card p-6 flex flex-col items-center text-center h-full bg-white/60 hover:-translate-y-2 transition-transform duration-300">
                  <img src={member.image} alt={member.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-sm mb-5 transition-transform duration-300 hover:scale-105" />
                  <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                  <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3">{member.role}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">“{member.quote}”</p>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover-bg-accent hover:text-white hover-border-accent transition-all">in</a>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="vagas" className="relative py-24 bg-slate-50 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold leading-7 text-orange-600 uppercase tracking-widest mb-3">Carreira</h2>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">Oportunidades abertas</h3>
            <p className="text-lg leading-relaxed text-slate-600">
              Transforme sua carreira conectando-se com empresas que valorizam pessoas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && (
              <div className="bg-white rounded-3xl p-10 text-center text-slate-500 col-span-full shadow-sm border border-slate-100">Carregando vagas...</div>
            )}
            {!loading && error && (
              <div className="bg-white rounded-3xl p-10 text-center text-red-500 col-span-full shadow-sm border border-slate-100">{error}</div>
            )}
            {!loading && !error && jobs.length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center text-slate-500 col-span-full shadow-sm border border-slate-100">Nenhuma vaga ativa no momento.</div>
            )}

            {visibleJobs.map((job) => {
              const requirements = getRequirementHighlights(job);

              return (
              <article key={String(job.id ?? job.titulo)} className="group relative flex flex-col bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {isNewJob(job) && <span className="absolute top-6 right-6 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">Nova</span>}
                
                <div className="flex flex-wrap gap-2 mb-6 pr-12">
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">{job.tipo_contrato || "CLT"}</span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">{job.senioridade || "Nível não informado"}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-orange-600 transition-colors">{job.titulo}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{job.descricao_curta ?? job.descricao ?? "Oportunidade para seu próximo passo profissional."}</p>

                {requirements.length > 0 && (
                  <div className="mb-6 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requisitos principais</p>
                    <ul className="space-y-2">
                       {requirements.map((req, i) => (
                         <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                           <span className="text-orange-500 mt-0.5">•</span>
                           <span className="line-clamp-2">{req}</span>
                         </li>
                       ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto space-y-3 pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.003.002.001.003.001a.75.75 0 01-.69 1.486 14.75 14.75 0 0110.32-.933zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg> {job.cidade || "Remoto"}</span>
                    <span className="font-medium">{formatSalaryRange(job)}</span>
                  </div>
                </div>

                <button type="button" onClick={() => openApplicationModal(job)} className="mt-6 w-full btnPrimary py-3 text-sm font-semibold rounded-xl shadow-none hover:shadow-lg transition-all">
                  Ver detalhes e aplicar
                </button>
              </article>
            );
            })}
          </div>

          {!loading && jobs.length > 3 && !showAllJobs && (
            <div className="mt-16 text-center">
              <button type="button" className="btnGhost px-8 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border-slate-200" onClick={() => setShowAllJobs(true)}>
                Ver mais {jobs.length - 3} oportunidades
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="contato" className="relative py-24 bg-slate-900 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-xs font-bold leading-7 text-orange-500 uppercase tracking-widest mb-3">Contato</h2>
              <h3 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">Vamos construir o futuro da sua empresa?</h3>
              <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-lg">
                Conte o cenário da sua organização e receba um direcionamento estratégico de nossos especialistas.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-6 group">
                  <div className="flex-none w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Onde estamos</h4>
                    <p className="mt-2 text-slate-400 text-sm">Av. Dom Luís, 500, Sala 925 • Shopping Aldeota<br/>Meireles • Fortaleza, CE</p>
                  </div>
                </div>
                
                <div className="flex gap-6 group">
                  <div className="flex-none w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/10">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Fale conosco</h4>
                    <p className="mt-2 text-slate-400 text-sm">talentos@rhesult.com.br<br/>(85) 9700-0229</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5 9.5 9.75 12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Agendar diagnóstico</h3>
              <p className="text-slate-400 text-sm mb-8">Preencha e entraremos em contato em até 24h.</p>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm" placeholder="Nome" />
                   <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm" placeholder="Sobrenome" />
                </div>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm" placeholder="Empresa" />
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm" placeholder="WhatsApp" />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm" placeholder="E-mail" />
                </div>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none" defaultValue="">
                  <option value="" disabled className="text-slate-800">Qual seu desafio principal?</option>
                  <option className="text-slate-800">Contratação e seleção</option>
                  <option className="text-slate-800">Desenvolvimento de liderança</option>
                  <option className="text-slate-800">Clima e engajamento</option>
                  <option className="text-slate-800">Estruturação de RH</option>
                </select>
                <button type="button" className="w-full btnPrimary px-6 py-4 text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 border-none">Enviar solicitação</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <a href="#" className="flex items-center gap-2 mb-6 group">
                <span className="text-2xl font-bold text-white tracking-tighter">RHesult<span className="text-orange-500">.</span></span>
              </a>
              <p className="text-sm leading-relaxed mb-6 opacity-80">
                Transformando empresas através da gestão estratégica de pessoas. Consultoria, recrutamento e desenvolvimento de alta performance.
              </p>
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/company/rhesult/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-colors">in</a>
                <a href="https://www.instagram.com/rhesult/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">ig</a>
                <a href="https://wa.me/558597000229" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">wa</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Empresa</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#sobre" className="hover:text-orange-500 transition-colors">Quem Somos</a></li>
                <li><a href="#time" className="hover:text-orange-500 transition-colors">Nossa Equipe</a></li>
                <li><a href="#time" className="hover:text-orange-500 transition-colors">Manifesto</a></li>
                <li><a href="#vagas" className="hover:text-orange-500 transition-colors">Trabalhe Conosco</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Soluções</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#servicos" className="hover:text-orange-500 transition-colors">Recrutamento Tech</a></li>
                <li><a href="#servicos" className="hover:text-orange-500 transition-colors">Consultoria de RH</a></li>
                <li><a href="#servicos" className="hover:text-orange-500 transition-colors">Treinamento &amp; DHO</a></li>
                <li><a href="#servicos" className="hover:text-orange-500 transition-colors">Diagnóstico de Cultura</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Fale Conosco</h4>
              <ul className="space-y-3 text-sm">
                <li>Fortaleza - CE</li>
                <li>(85) 99700-0229</li>
                <li>talentos@rhesult.com.br</li>
                <li className="pt-2">
                  <a href="https://wa.me/558597000229?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20diagn%C3%B3stico%20com%20a%20RHesult." target="_blank" rel="noopener noreferrer" className="text-orange-500 font-bold hover:underline">Agendar Diagnóstico →</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs opacity-60">© {new Date().getFullYear()} RHesult Consultoria. Todos os direitos reservados.</p>
            <div className="flex gap-6 text-xs opacity-60">
              <a href="#" className="hover:text-white">Privacidade</a>
              <a href="#" className="hover:text-white">Termos</a>
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
