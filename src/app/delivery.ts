const API_BASE = "https://esthan-depoimentos.rieres.workers.dev";

export const RESTAURANT_ADDRESS = "Rua Marina Lemos de Abreu, 68 - Jardim Centenário, São Paulo - SP";

export type GeocodeResult = { found: boolean; lat?: number; lon?: number; displayName?: string };
export type EtaResult = { travelMinutes: number; prepMinutes: number; totalMinutes: number };

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const resp = await fetch(`${API_BASE}/geocode?address=${encodeURIComponent(address)}`);
  if (!resp.ok) return { found: false };
  return resp.json();
}

export async function estimateDelivery(lat: number, lon: number): Promise<EtaResult | null> {
  try {
    const resp = await fetch(`${API_BASE}/eta?lat=${lat}&lon=${lon}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export type CepResult = { found: boolean; rua?: string; bairro?: string; cidade?: string; uf?: string };

export async function lookupCep(cep: string): Promise<CepResult> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return { found: false };

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!resp.ok) return { found: false };
    const data = await resp.json();
    if (data.erro) return { found: false };
    return { found: true, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf };
  } catch {
    return { found: false };
  }
}
