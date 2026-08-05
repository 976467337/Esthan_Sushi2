import { useEffect, useState, type FormEvent } from "react";
import { Lock, Search, LogOut, UtensilsCrossed, Tag } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { MENU_CATEGORIES } from "@/app/menu-data";

const API = "https://esthan-depoimentos.rieres.workers.dev";
const PASSWORD_KEY = "esthan_admin_pw";

type PromoState = Record<string, { active: boolean; price: string }>;

// Painel simples pra o dono escolher, sem mexer em código, quais pratos estão em
// promoção agora e por qual preço. Fica em /admin, protegido por senha (guardada
// só no Worker). Ao salvar, o site público já reflete a mudança na hora.
export default function AdminPromocoes() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  const [promoState, setPromoState] = useState<PromoState>({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");

  async function loadCurrentPromotions() {
    try {
      const resp = await fetch(`${API}/promotions`);
      const cfg = await resp.json();
      if (cfg && typeof cfg === "object") setPromoState(cfg);
    } catch {
      // não conseguiu carregar o que já está configurado — painel abre em branco,
      // o dono ainda consegue marcar e salvar promoções normalmente
    }
  }

  async function tryPassword(pw: string, opts: { silent?: boolean } = {}) {
    setChecking(true);
    setAuthError("");
    try {
      const resp = await fetch(`${API}/admin/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (resp.ok) {
        setUnlocked(true);
        try { localStorage.setItem(PASSWORD_KEY, pw); } catch { /* modo privado etc. */ }
        await loadCurrentPromotions();
      } else if (!opts.silent) {
        setAuthError("Senha incorreta. Confere e tenta de novo.");
      }
    } catch {
      if (!opts.silent) setAuthError("Não consegui conectar. Confere sua internet e tenta de novo.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    let cached = "";
    try { cached = localStorage.getItem(PASSWORD_KEY) || ""; } catch { /* modo privado etc. */ }
    if (cached) {
      setPassword(cached);
      tryPassword(cached, { silent: true });
    } else {
      setChecking(false);
    }
  }, []);

  function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    tryPassword(password);
  }

  function logout() {
    try { localStorage.removeItem(PASSWORD_KEY); } catch { /* modo privado etc. */ }
    setUnlocked(false);
    setPassword("");
    setPromoState({});
  }

  function toggleItem(name: string, basePrice: string) {
    setPromoState((prev) => {
      const current = prev[name];
      return {
        ...prev,
        [name]: { active: !current?.active, price: current?.price || basePrice },
      };
    });
  }

  function setItemPrice(name: string, price: string) {
    setPromoState((prev) => ({ ...prev, [name]: { active: true, price } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    const payload = Object.fromEntries(Object.entries(promoState).filter(([, v]) => v.active));
    try {
      const resp = await fetch(`${API}/admin/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": password },
        body: JSON.stringify(payload),
      });
      if (resp.status === 401) {
        logout();
        setAuthError("Sua sessão expirou. Digite a senha de novo.");
        return;
      }
      setSaveStatus(resp.ok ? "ok" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }

  const activeCount = Object.values(promoState).filter((v) => v.active).length;
  const filter = query.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
      <header className="border-b border-border px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-primary" />
          <h1 className="text-lg font-black tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            PAINEL DE <span className="text-primary">PROMOÇÕES</span>
          </h1>
        </div>
        {unlocked && (
          <button onClick={logout} className="flex items-center gap-1.5 text-muted-foreground text-xs tracking-widest uppercase hover:text-primary transition-colors">
            <LogOut size={14} /> Sair
          </button>
        )}
      </header>

      {checking && !unlocked && (
        <div className="max-w-sm mx-auto mt-24 text-center text-muted-foreground text-sm">Verificando...</div>
      )}

      {!checking && !unlocked && (
        <div className="max-w-sm mx-auto mt-16 px-6">
          <div className="border border-border p-8 text-center">
            <Lock size={28} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>Área restrita</h2>
            <p className="text-muted-foreground text-sm mb-6">Digite a senha pra escolher quais pratos entram em promoção.</p>
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors text-center"
              />
              {authError && <p className="text-destructive text-xs">{authError}</p>}
              <button type="submit" disabled={checking}
                className="py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all disabled:opacity-60">
                {checking ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {unlocked && (
        <>
          <div className="max-w-3xl mx-auto px-6 pt-6 pb-32">
            <p className="text-muted-foreground text-sm mb-6">
              Ligue a chavinha nos pratos que você quer colocar em promoção agora e defina o preço promocional.
              Quando terminar, aperte "Salvar promoções" lá embaixo — o site atualiza na hora pra quem visitar.
            </p>

            <div className="relative mb-8">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar prato..."
                className="w-full bg-input-background border border-border pl-9 pr-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-10">
              {MENU_CATEGORIES.map((cat) => {
                const items = filter
                  ? cat.items.filter((item) => item.name.toLowerCase().includes(filter))
                  : cat.items;
                if (items.length === 0) return null;

                return (
                  <div key={cat.title}>
                    <h3 className="text-primary text-xs tracking-[0.3em] uppercase font-semibold mb-3">{cat.title}</h3>
                    <div className="divide-y divide-border border-t border-b border-border">
                      {items.map((item) => {
                        const state = promoState[item.name];
                        const active = !!state?.active;
                        return (
                          <div key={item.name} className="flex items-center gap-4 py-3">
                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded bg-secondary">
                              {item.img ? (
                                <ImageWithFallback src={item.img} alt={item.name} className="w-full h-full object-cover object-center" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <UtensilsCrossed size={16} className="text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground font-semibold text-sm truncate">{item.name}</p>
                              <p className="text-muted-foreground text-xs">Preço normal: {item.price}</p>
                              {active && (
                                <input
                                  value={state?.price ?? item.price}
                                  onChange={(e) => setItemPrice(item.name, e.target.value)}
                                  placeholder="Ex: R$ 25,90"
                                  className="mt-2 w-32 bg-input-background border border-border px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none transition-colors"
                                />
                              )}
                            </div>
                            <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none">
                              <span className="text-[10px] tracking-widest uppercase text-muted-foreground hidden sm:inline">
                                {active ? "Em promoção" : "Promoção"}
                              </span>
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggleItem(item.name, item.price)}
                                className="w-5 h-5 accent-primary cursor-pointer"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-md px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <span className="text-muted-foreground text-xs">
                {activeCount === 0 ? "Nenhum prato em promoção" : `${activeCount} prato(s) em promoção`}
                {saveStatus === "ok" && <span className="text-primary font-semibold"> · Salvo! Já está valendo no site.</span>}
                {saveStatus === "error" && <span className="text-destructive font-semibold"> · Não consegui salvar, tenta de novo.</span>}
              </span>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all disabled:opacity-60 flex-shrink-0">
                {saving ? "Salvando..." : "Salvar promoções"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
