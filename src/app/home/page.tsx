/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { AppHeader } from "@/shared/components/AppHeader";

// Hero Component
function HeroSection() {
  return (
    <section id="sobre" className="max-w-6xl mx-auto px-5 py-12 md:py-16">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Text */}
        <div className="lg:col-span-4 space-y-6">
          <div className="pill inline-block">About Rhesult</div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Gestão de Recrutamento e Pessoas,
            <span className="text-[#F58634] block mt-2">com clareza e controle</span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            O Rhesult é um sistema completo para organizar vagas, candidatos, entrevistas, pareceres e histórico — com visual moderno, rápido e pronto para operação real.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/demo" className="btn btn-primary">
              <span>→</span> Ver demonstração
            </Link>
            <button className="btn btn-ghost">
              <span>✦</span> Falar com a Rhesult
            </button>
          </div>
        </div>

        {/* Right Cards */}
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-5">
          {/* Large Card */}
          <div className="relative overflow-hidden rounded-2xl md:col-span-1 h-[260px] bg-linear-to-br from-slate-900 to-slate-800 group cursor-pointer">
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
              Banco de Talentos
            </span>
            <img
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop"
              alt="Banco de talentos"
            />

            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent"></div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-white font-bold text-base">Pipeline completo de candidatos</p>
                <p className="text-white/75 text-xs mt-1">Triagem • Tags • Score • Histórico</p>
              </div>
              <button className="w-11 h-11 rounded-full bg-white/90 hover:bg-white transition-all hover:scale-110 grid place-items-center font-bold text-slate-900">
                ↗
              </button>
            </div>
          </div>

          {/* Small Card Top */}
          <div className="relative overflow-hidden rounded-2xl h-[120px] bg-linear-to-br from-blue-600 to-blue-700 group cursor-pointer">
            <span className="absolute top-3 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
              Agenda
            </span>
            <img
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300"
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
              alt="Agenda"
            />
            <div className="absolute inset-0 bg-linear-to-t from-blue-950 via-transparent to-transparent"></div>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Entrevistas sem caos</p>
                <p className="text-white/70 text-xs">Horários • links • lembretes</p>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white/90 hover:bg-white transition-all text-slate-900 text-xs grid place-items-center">←</button>
                <button className="w-8 h-8 rounded-full bg-white/90 hover:bg-white transition-all text-slate-900 text-xs grid place-items-center">→</button>
              </div>
            </div>
          </div>

          {/* Small Card Bottom */}
          <div className="relative overflow-hidden rounded-2xl h-[120px] bg-linear-to-br from-purple-600 to-purple-700 group cursor-pointer">
            <span className="absolute top-3 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
              Pareceres
            </span>
            <img
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300"
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop"
              alt="Pareceres"
            />
            <div className="absolute inset-0 bg-linear-to-t from-purple-950 via-transparent to-transparent"></div>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Decisão com critério</p>
                <p className="text-white/70 text-xs">Scorecards • evidências • recomendação</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/90 hover:bg-white transition-all text-slate-900 grid place-items-center font-bold">+</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA Ribbon
function CTARibbon() {
  return (
    <section className="max-w-6xl mx-auto px-5 pb-6">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-linear-to-r from-[#F58634]/10 to-orange-500/10 border border-[#F58634]/20 hover:border-[#F58634]/40 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#F58634] to-orange-500 text-white font-bold text-lg grid place-items-center shadow-lg">
              ⚡
            </div>
            <div>
              <p className="font-bold text-slate-900">Acelere sua operação em um clique</p>
              <p className="text-sm text-slate-600">Abra vaga, adicione candidato e agende entrevistas direto do atalho rápido.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vagas#nova" className="btn btn-primary">
              <span>+</span> Nova vaga
            </Link>
            <button className="btn bg-white border border-slate-200 hover:bg-slate-50">
              <span>👤</span> Novo candidato
            </button>
            <button className="btn bg-white border border-slate-200 hover:bg-slate-50">
              <span>🗓</span> Agendar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    { icon: "⚡", name: "Triagem rápida", desc: "Tags, filtros e ranking por aderência para acelerar decisões." },
    { icon: "📌", name: "Histórico completo", desc: "Registro de interações, avaliações e evolução do candidato." },
    { icon: "🧠", name: "Parecer inteligente", desc: "Modelo padronizado com resumo, hard skills e comportamento." },
    { icon: "🔒", name: "Organização e controle", desc: "Tudo no lugar certo, sem depender de mil planilhas soltas." },
  ];

  return (
    <section id="recursos" className="max-w-6xl mx-auto px-5 py-12">
      <div className="rounded-2xl border border-slate-200 p-6 md:p-8 bg-white shadow-sm">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left: Image */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="pill">Vagas</span>
              <span className="pill pill-accent">Triagem</span>
              <span className="pill">Entrevistas</span>
              <span className="pill">Onboarding</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl h-[280px] bg-slate-100 group">
              <img
                loading="lazy"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop"
                alt="Dashboard"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-base">Dashboard operacional</p>
                <p className="text-white/75 text-xs mt-2">
                  Acompanhe time-to-fill, funil e status por vaga.
                </p>
                <button className="mt-3 px-4 py-2 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors">
                  ↗ Abrir painel
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium">
                1 / 6
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="lg:col-span-6">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Experimente o melhor em
              <span className="text-[#F58634] block mt-2">Recrutamento, Processos e Pessoas</span>
            </h2>

            <p className="mt-4 text-slate-600 text-sm md:text-base leading-relaxed">
              Centralize a operação de RH em um fluxo simples:
              <span className="text-slate-900 font-semibold"> vaga → triagem → entrevista → parecer → decisão</span>.
              Menos retrabalho. Mais clareza.
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 hover:border-[#F58634]/30 hover:bg-[#F58634]/5 transition-all">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <span className="text-lg">{feature.icon}</span>
                    {feature.name}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Modules Section
function ModulesSection() {
  const modules = [
    { label: "Vagas", desc: "Status • prioridades • SLA", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop" },
    { label: "Candidatos", desc: "Filtros • tags • pipeline", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop" },
    { label: "Parecer", desc: "Resumo • skills • fit", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop" },
    { label: "Relatórios", desc: "Funil • fontes • conversão", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop" },
  ];

  return (
    <section id="modulos" className="max-w-6xl mx-auto px-5 py-12">
      <div className="rounded-2xl border border-slate-200 p-6 md:p-8 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="pill inline-block mb-3">Módulos</div>
            <h3 className="text-2xl md:text-3xl font-bold">Explore os módulos do Rhesult</h3>
            <p className="mt-2 text-slate-600 text-sm">
              Um sistema modular: você usa o essencial e evolui quando precisar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F58634]/30 transition-all"
              placeholder="Buscar módulo..."
            />
            <button className="btn btn-ghost">
              Ver todos ↗
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {modules.map((mod, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl h-[200px] bg-slate-100 group cursor-pointer hover:shadow-lg transition-all">
              <span className="absolute top-3 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 z-10">
                {mod.label}
              </span>
              <img
                loading="lazy"
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                src={mod.image}
                alt={mod.label}
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-sm">Gestão de {mod.label.toLowerCase()}</p>
                <p className="text-white/70 text-xs mt-1">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  return (
    <section id="depoimentos" className="max-w-6xl mx-auto px-5 pb-16">
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Testimonial */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 p-6 md:p-8 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="pill inline-block">Depoimentos</div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full border border-slate-200 hover:border-slate-300 grid place-items-center hover:bg-slate-50">←</button>
              <button className="w-10 h-10 rounded-full border border-slate-200 hover:border-slate-300 grid place-items-center hover:bg-slate-50">→</button>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5">
              <div className="relative overflow-hidden rounded-2xl h-[240px] bg-slate-100">
                <img
                  loading="lazy"
                  className="w-full h-full object-cover opacity-95"
                  src="https://images.unsplash.com/photo-1520975682071-a5c35fcd4a11?q=80&w=1200&auto=format&fit=crop"
                  alt="Cliente"
                />
              </div>
            </div>

            <div className="md:col-span-7">
              <p className="text-5xl leading-none font-black text-slate-200 select-none">&quot;</p>
              <p className="text-xl md:text-2xl font-bold leading-snug -mt-3">
                &quot;Depois que começamos a usar o Rhesult, a triagem ficou muito mais rápida, e o time parou de se perder entre planilhas e mensagens.&quot;
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Equipe de RH</p>
                  <p className="text-xs text-slate-600">Operação • Seleção • Pessoas</p>
                </div>
                <p className="text-xs text-slate-600">1 / 8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Satisfaction Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 p-6 md:p-8 bg-linear-to-br from-slate-50 to-white shadow-sm flex flex-col justify-between">
          <div>
            <p className="font-bold text-slate-900">Satisfação do cliente</p>
            <p className="text-4xl md:text-5xl font-bold text-[#F58634] mt-2">4.9</p>
            <p className="text-sm text-slate-600 mt-1">Baseado em operações reais</p>

            <div className="mt-5 space-y-4">
              {[
                { label: "Organização", value: 92 },
                { label: "Velocidade", value: 88 },
                { label: "Clareza", value: 94 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#F58634] to-orange-500"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary mt-7 justify-center w-full">
            ↗ Solicitar acesso
          </button>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="max-w-6xl mx-auto px-5 pb-10">
      <div className="rounded-2xl border border-slate-200 p-6 md:p-8 bg-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="font-bold text-slate-900">Rhesult — Sistema de RH</p>
          <p className="text-sm text-slate-600 mt-1">
            Recrutamento com método. Pessoas com critério. Operação com clareza.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost">Política</button>
          <button className="btn btn-ghost">Termos</button>
          <Link href="/vagas" className="btn btn-primary">
            → Começar agora
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        © {year} Rhesult. Todos os direitos reservados.
      </p>
    </footer>
  );
}

// Main Page
export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="page-shell">
        <HeroSection />
        <CTARibbon />
        <FeaturesSection />
        <ModulesSection />
        <TestimonialsSection />
        <Footer />
      </main>
    </>
  );
}
