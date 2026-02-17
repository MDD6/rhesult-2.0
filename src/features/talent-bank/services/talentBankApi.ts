export type Candidato = {
  id: string | number;
  nome: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  senioridade?: string;
  cargo_desejado?: string;
  etapa?: string;
  criado_em?: string;
  vaga_id?: string | number | null;
  vaga_titulo?: string | null;
  origem?: string | null;
  historico?: string;
  linkedin?: string;
  curriculum_url?: string;
};

export type Vaga = {
  id: string | number;
  titulo: string;
};

export type CreateCandidatoInput = {
  nome: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  senioridade?: string;
  cargo_desejado?: string;
  etapa?: string;
  vaga_id?: string | number | null;
  origem?: string | null;
  historico?: string;
  linkedin?: string;
  curriculum_url?: string;
};

export type UpdateCandidatoInput = Partial<CreateCandidatoInput>;

function getApiBase() {
  if (typeof window !== "undefined") {
    const globalAuth = (window as Window & { RhesultAuth?: { apiBase?: () => string } }).RhesultAuth;
    if (globalAuth?.apiBase) {
      return globalAuth.apiBase();
    }
  }

  return process.env.NEXT_PUBLIC_API_BASE ?? "";
}

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("rhesult_token") || "";
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

function normalizeCandidate(input: Record<string, unknown>): Candidato {
  return {
    id: (input.id ?? input.candidato_id ?? crypto.randomUUID()) as string | number,
    nome: String(input.nome ?? input.name ?? "").trim(),
    email: String(input.email ?? "").trim() || undefined,
    telefone: String(input.telefone ?? input.phone ?? "").trim() || undefined,
    cidade: String(input.cidade ?? "").trim() || undefined,
    senioridade: String(input.senioridade ?? "").trim() || undefined,
    cargo_desejado: String(input.cargo_desejado ?? input.cargo ?? "").trim() || undefined,
    etapa: String(input.etapa ?? input.status ?? "Inscricao").trim(),
    criado_em: String(input.criado_em ?? input.created_at ?? "").trim() || undefined,
    vaga_id: (input.vaga_id ?? null) as string | number | null,
    vaga_titulo: String(input.vaga_titulo ?? "").trim() || null,
    origem: String(input.origem ?? "").trim() || null,
    historico: String(input.historico ?? "").trim() || undefined,
    linkedin: String(input.linkedin ?? "").trim() || undefined,
    curriculum_url: String(input.curriculum_url ?? "").trim() || undefined,
  };
}

export async function fetchCandidatos(): Promise<Candidato[]> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/candidatos` : "/api/candidatos";

  const response = await fetch(url, {
    cache: "no-store",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar candidatos.");
  }

  const data = (await response.json()) as unknown;
  const list = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data || [];

  return list.map((item) => normalizeCandidate(item as Record<string, unknown>));
}

export async function fetchVagas(): Promise<Vaga[]> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/vagas` : "/api/vagas";

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: buildHeaders(),
    });

    if (!response.ok) {
      console.warn(`[fetchVagas] Server responded with status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as unknown;
    const list = Array.isArray(data)
      ? data
      : (data as { data?: unknown[] })?.data || [];

    return list
      .map((item) => item as Record<string, unknown>)
      .filter((item) => item.id && item.titulo)
      .map((item) => ({ id: item.id as string | number, titulo: String(item.titulo) }));
  } catch (error) {
    console.error("[fetchVagas] Failed to fetch vagas:", error);
    return [];
  }
}

export async function patchCandidatoEtapa(id: string | number, etapa: string) {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/candidatos/${id}` : `/api/candidatos/${id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(),
    },
    body: JSON.stringify({ etapa }),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar etapa do candidato.");
  }
}

export async function createCandidato(input: CreateCandidatoInput): Promise<Candidato> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/candidatos` : "/api/candidatos";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar candidato.");
  }

  const data = (await response.json()) as unknown;
  const payload = (data as { data?: unknown })?.data ?? data;
  return normalizeCandidate(payload as Record<string, unknown>);
}

export async function updateCandidato(
  id: string | number,
  input: UpdateCandidatoInput
): Promise<Candidato> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/candidatos/${id}` : `/api/candidatos/${id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar candidato.");
  }

  const data = (await response.json()) as unknown;
  const payload = (data as { data?: unknown })?.data ?? data;
  return normalizeCandidate(payload as Record<string, unknown>);
}

export async function deleteCandidato(id: string | number): Promise<void> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/api/candidatos/${id}` : `/api/candidatos/${id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao excluir candidato.");
  }
}
