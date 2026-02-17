import type { LeadershipTab, ServiceTab, TeamMember } from "./types";

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Janine Feitosa",
    role: "Head de Estratégia",
    image: "/assets/images/janine.png",
    quote: "Conectar objetivos de negócio com gestão de pessoas é o que impulsiona resultados reais.",
    linkedin: "https://www.linkedin.com/in/janine-machado-monte-feitosa-bezerra-692a8942/",
  },
  {
    name: "Matheus Dresch",
    role: "Tech Recruiter Lead",
    image: "/assets/images/Matheus.jpg",
    quote: "Encontrar o talento certo é sobre entender cultura, não apenas requisitos técnicos.",
    linkedin: "https://www.linkedin.com/in/matheusddresch/",
  },
  {
    name: "George Feitosa",
    role: "Consultor Sênior",
    image: "/assets/images/george.jpg",
    quote: "Desenvolver liderança é criar um legado de sucessão e autonomia para a empresa.",
    linkedin: "https://www.linkedin.com/in/george-feitosa-37b831209/",
  },
  {
    name: "Tatiane Vasconcelos",
    role: "Psicóloga Organizacional",
    image: "/assets/images/tatiane.jpeg",
    quote: "Análise comportamental fornece os dados necessários para decisões assertivas.",
    linkedin: "https://www.linkedin.com/in/-tatianevasconcelos/",
  },
  {
    name: "Deyse Maia",
    role: "Customer Success",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    quote: "Meu foco é conectar pessoas com oportunidades reais de crescimento.",
    linkedin: "https://www.linkedin.com/in/deyse-maia-7301021a3/",
  },
];

export const SERVICE_TABS: ServiceTab[] = [
  {
    tag: "seleção",
    title: "Contrate melhor com seleção estruturada",
    desc: "Definimos perfil, critérios e etapas. Avaliamos aderência cultural e reduzimos decisões no feeling.",
    list: [
      "Alinhamento de perfil e cultura",
      "Entrevistas com roteiro e critérios",
      "Parecer final objetivo e documentado",
    ],
    bg: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=2000&q=70",
  },
  {
    tag: "t&d",
    title: "Desenvolva líderes e equipes com foco no dia a dia",
    desc: "Treinamentos aplicáveis: liderança, comunicação, rotina de gestão e performance.",
    list: ["Programas sob medida", "Acompanhamento e reforço", "Evolução com indicadores"],
    bg: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=70",
  },
  {
    tag: "clima",
    title: "Entenda o clima e transforme diagnóstico em ação",
    desc: "Pesquisa, leitura do cenário e plano prático para engajamento e produtividade.",
    list: ["Diagnóstico por áreas", "Prioridades e responsáveis", "Ações e acompanhamento"],
    bg: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=70",
  },
  {
    tag: "consultoria",
    title: "Estruture processos e indicadores de RH",
    desc: "Políticas, rotinas, cadência e métricas para sustentar o crescimento da empresa.",
    list: ["Processos claros", "Indicadores e cadência", "Gestão com previsibilidade"],
    bg: "https://images.unsplash.com/photo-1554774853-b414d2a2ad38?auto=format&fit=crop&w=2000&q=70",
  },
];

export const LEADERSHIP_TABS: LeadershipTab[] = [
  {
    tag: "Liderança",
    title: "Liderar com consciência, empatia e resultado",
    desc: "Liderar sem humanizar deixou de ser uma opção. Resultados sustentáveis caminham junto com relações saudáveis e engajamento genuíno.",
    list: [
      "Liderança relacional com responsabilidade",
      "Cultura de confiança e performance",
      "Desenvolvimento contínuo de gestores",
    ],
    bg: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    tag: "Desenvolvimento",
    title: "Capacitação contínua como estratégia",
    desc: "Investir em competências técnicas e comportamentais fortalece competitividade e inovação.",
    list: [
      "Jornadas práticas por contexto",
      "Aplicação no dia a dia das equipes",
      "Acompanhamento de evolução",
    ],
    bg: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80",
  },
  {
    tag: "RH do Futuro",
    title: "Diversidade e inclusão com consistência",
    desc: "Ambientes justos exigem processo, escuta ativa e métricas para sustentação no longo prazo.",
    list: [
      "Revisão de práticas e políticas",
      "Formação contínua de lideranças",
      "Ambiente seguro e produtivo",
    ],
    bg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80",
  },
];

export const LOGOS = Array.from({ length: 22 }, (_, i) => `/assets/logos/${i + 1}.png`);
