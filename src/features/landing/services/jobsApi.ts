import type { Job, JobApplication } from "../types";

function getApiBase() {
  if (typeof window !== "undefined") {
    const globalAuth = (window as Window & { RhesultAuth?: { apiBase?: () => string } }).RhesultAuth;
    if (globalAuth?.apiBase) {
      return globalAuth.apiBase();
    }
  }

  return process.env.NEXT_PUBLIC_API_BASE ?? "";
}

export async function fetchJobsRequest(): Promise<Job[]> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/vagas` : "/vagas";

  const response = await fetch(`${url}?_t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  return (await response.json()) as Job[];
}

export async function submitApplicationRequest(
  payload: JobApplication,
  file: File | null,
): Promise<void> {
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/public/candidatos` : "/public/candidatos";

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, typeof value === "boolean" ? String(value) : value);
    }
  });

  if (file) {
    formData.append("curriculum_file", file);
  }

  const response = await fetch(url, { method: "POST", body: formData });
  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
}
