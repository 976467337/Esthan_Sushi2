const API_BASE = "https://esthan-depoimentos.rieres.workers.dev";

export const RESTAURANT_ADDRESS = "Rua Marina Lemos de Abreu, 68 - Jardim Centenário, São Paulo - SP";

// Usado quando não dá pra calcular o trajeto de verdade (endereço não geocodificou,
// ou o serviço de rota falhou) — mesma média que já anunciamos no site, pra sempre
// mostrar um tempo aproximado ao cliente em vez de nada.
export const FALLBACK_TOTAL_MINUTES = 45;

// Acima disso, a taxa fixa de R$7 não vale mais — o frete precisa ser combinado
// com os parceiros de entrega antes de confirmar o pedido.
export const FAR_DELIVERY_KM_THRESHOLD = 20;

export type GeocodeResult = { found: boolean; lat?: number; lon?: number; displayName?: string };
export type EtaResult = { travelMinutes: number; prepMinutes: number; totalMinutes: number; distanceKm: number };

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
