import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Menu, X, Phone, Clock, ChevronDown, Bike, ShoppingBag, Star, MapPin, Flame, Tag, Sailboat, UtensilsCrossed, Layers, IceCreamCone, Disc, CircleDot, Sparkles, Images } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { OrderModal } from "@/app/components/OrderModal";
import { AllReviewsModal } from "@/app/components/AllReviewsModal";
import { PhotoGalleryModal } from "@/app/components/PhotoGalleryModal";
import { CartDrawer } from "@/app/components/CartDrawer";
import { buildOrderMessage, type CartLine, type DeliveryMode, type PaymentInfo, type DeliveryPaymentMethod } from "@/app/cart-data";
import logoFull from "@/imports/logo-transparent.png";
import logoIcon from "@/imports/logo-mark.png";
import { BARCAS, COMBINADOS, TEMAKIS, HOT_ROLLS, SUSHI, URAMAKIS, HOSSOMAKIS_OUTROS, DEFAULT_PROMO_CONFIG, ALL_MENU_ITEMS, imgBarcaSobre, type MenuItem } from "@/app/menu-data";

const WHATSAPP_NUMBER = "5511994597259";

// mesmas coordenadas usadas no Worker pro cálculo de rota (RESTAURANT_ORIGIN) — usar lat/lon
// direto em vez do endereço em texto porque o número exato dessa rua não está bem indexado
// no Google/Waze, então buscar pelo texto às vezes cai num ponto errado da rua.
const RESTAURANT_COORDS = "-23.4737,-46.6695";

// depoimento: visitante envia -> Cloudflare Worker guarda como pendente, dispara
// (server-side, via CallMeBot) um aviso automático no WhatsApp do dono com um link
// de aprovação de 1 toque -> nada é publicado até ele tocar no link e aprovar.
// O visitante nunca abre o próprio WhatsApp nesse fluxo.
const TESTIMONIAL_API = "https://esthan-depoimentos.rieres.workers.dev";
const TESTIMONIAL_SENT_KEY = "esthan_depoimento_enviado";

// promoções: o dono edita pelo painel /admin (sem mexer em código) -> Worker guarda
// -> site público busca aqui a cada carregamento. Enquanto ele nunca salvou nada,
// mostra o pacote de promoções padrão (DEFAULT_PROMO_CONFIG) como estava até agora.
const PROMOTIONS_API = "https://esthan-depoimentos.rieres.workers.dev";

// id explícito em vez de derivar do texto — assim o texto do menu pode mudar
// livremente sem quebrar o scroll até a seção (ex: "Cardápio" com acento não
// batia com o id "cardapio" sem acento; ficava sem rolar até a seção certa).
const NAV_LINKS = [
  { label: "Início", id: "inicio" },
  { label: "Cardápio", id: "cardapio" },
  { label: "Sobre", id: "sobre" },
  { label: "Como fazer seu pedido", id: "pedido" },
];

const REVIEWS = [
  { name: "Camila R.", stars: 5, text: "Delivery chegou rapidíssimo e o sushi estava impecável. A Barca Hot é incrível!" },
  { name: "Marcos S.", stars: 5, text: "Peço toda semana. O Combinado Casal é perfeito. Nunca chegou tarde nem em mal estado." },
  { name: "Valentina P.", stars: 5, text: "Primeira vez pedindo e fiquei encantado. Tudo fresquíssimo, sabores incríveis." },
];

// Mostra só os mais recentes na página pra não poluir — o resto fica disponível
// só pelo botão "Ver todos os depoimentos".
const MAX_VISIBLE_REVIEWS = 9;

// ─── HELPERS ──────────────────────────────────────────────────
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-2">{label}</p>
      <h3 className="text-gradient text-3xl md:text-4xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        {title}
      </h3>
    </div>
  );
}

function ListItem({ name, desc, price, oldPrice, img, onSelect }: { name: string; desc?: string; price: string; oldPrice?: string | null; img?: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 py-4 border-b border-border group hover:bg-card/40 px-2 -mx-2 transition-colors rounded text-left"
    >
      {/* Quadro sempre do mesmo tamanho pra todos os pratos. object-contain garante que
          a foto nunca é cortada; o que sobra é preenchido pelo gradiente da marca
          (photo-frame-bg) em vez de deixar espaço vazio/preto liso. */}
      <div className="photo-frame-bg w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded">
        {img ? (
          <ImageWithFallback src={img} alt={name} className="w-full h-full object-contain object-center" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={20} className="text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-semibold text-sm group-hover:text-primary transition-colors">{name}</span>
        {desc && <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        {oldPrice && <p className="text-muted-foreground text-xs line-through">{oldPrice}</p>}
        <span className="text-primary font-bold text-sm whitespace-nowrap">{price}</span>
      </div>
    </button>
  );
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const addLineToCart = (line: CartLine) => setCart((prev) => [...prev, line]);
  const updateCartQty = (id: string, qty: number) =>
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  const checkoutViaWhatsApp = (
    customerName: string,
    deliveryMode: DeliveryMode,
    address: string,
    etaMinutes?: number,
    scheduledFor?: string,
    paymentInfo?: PaymentInfo,
    deliveryPaymentMethod?: DeliveryPaymentMethod,
    changeInfo?: string,
    distanceKm?: number,
    distanceUnknown?: boolean
  ) => {
    const text = buildOrderMessage(cart, customerName, deliveryMode, address, etaMinutes, scheduledFor, paymentInfo, deliveryPaymentMethod, changeInfo, distanceKm, distanceUnknown);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    setCart([]);
  };

  const [approvedTestimonials, setApprovedTestimonials] = useState<
    { nome: string; item?: string; nota: number; texto: string }[]
  >([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialSent, setTestimonialSent] = useState(false);
  const [testimonialBlocked, setTestimonialBlocked] = useState(false);
  const [testimonialError, setTestimonialError] = useState(false);
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [depNome, setDepNome] = useState("");
  const [depItem, setDepItem] = useState("");
  const [depNota, setDepNota] = useState(5);
  const [depTexto, setDepTexto] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(TESTIMONIAL_SENT_KEY) === "1") setTestimonialSent(true);
    } catch { /* localStorage indisponível (modo privado, etc.) */ }

    fetch(`${TESTIMONIAL_API}/approved`)
      .then((r) => r.json())
      .then((list) => setApprovedTestimonials(Array.isArray(list) ? list : []))
      .catch(() => { /* serviço de aprovação fora do ar — a seção só fica sem os novos depoimentos */ });
  }, []);

  // promoções configuradas pelo dono no painel /admin (nome do prato -> preço promocional).
  // null = ele nunca salvou nada ainda (ou o Worker está fora do ar) -> mostra o pacote padrão.
  // Um objeto (mesmo vazio, {}) = ele já salvou pelo menos uma vez -> respeita exatamente o
  // que ele escolheu, incluindo a escolha de não deixar nenhum prato em promoção.
  const [promoConfig, setPromoConfig] = useState<Record<string, { active: boolean; price: string }> | null>(null);

  useEffect(() => {
    fetch(`${PROMOTIONS_API}/promotions`)
      .then((r) => r.json())
      .then((cfg) => setPromoConfig(cfg && typeof cfg === "object" ? cfg : null))
      .catch(() => {}); // Worker fora do ar -> mantém null, cai no pacote padrão abaixo
  }, []);

  const activePromoConfig = promoConfig ?? DEFAULT_PROMO_CONFIG;

  const PROMOCOES: MenuItem[] = ALL_MENU_ITEMS
    .filter((item) => activePromoConfig[item.name]?.active)
    .map((item) => ({
      name: item.name,
      desc: item.desc,
      img: item.img,
      oldPrice: item.price,
      price: activePromoConfig[item.name].price || item.price,
    }));

  async function sendTestimonialToWhatsApp(e: FormEvent) {
    e.preventDefault();
    setTestimonialError(false);
    setTestimonialSubmitting(true);

    try {
      const resp = await fetch(`${TESTIMONIAL_API}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: depNome, item: depItem, nota: depNota, texto: depTexto }),
      });

      // já existe um depoimento enviado a partir deste IP -> bloqueia
      if (resp.status === 429) {
        setTestimonialBlocked(true);
        return;
      }

      if (!resp.ok) throw new Error("submit_failed");

      // o Worker já dispara (server-side) o aviso automático no WhatsApp do dono —
      // o visitante não precisa abrir nem enviar nada pelo próprio WhatsApp.
      try { localStorage.setItem(TESTIMONIAL_SENT_KEY, "1"); } catch { /* localStorage indisponível */ }
      setTestimonialSent(true);
    } catch {
      // serviço de envio fora do ar — pede pra tentar de novo em vez de cair
      // no fallback antigo de abrir o WhatsApp do visitante
      setTestimonialError(true);
    } finally {
      setTestimonialSubmitting(false);
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  };

  const TABS = [
    { id: "geral", label: "Geral", icon: <UtensilsCrossed size={12} /> },
    { id: "barcas", label: "Barcas", icon: <Sailboat size={12} /> },
    { id: "combinados", label: "Combinados", icon: <Layers size={12} /> },
    { id: "promocoes", label: "Promoções", icon: <Tag size={12} /> },
    { id: "temakis", label: "Temakis", icon: <IceCreamCone size={12} /> },
    { id: "hotrolls", label: "Hot Rolls", icon: <Flame size={12} /> },
    { id: "sushi", label: "Sushi", icon: <Disc size={12} /> },
    { id: "uramakis", label: "Uramaki/Hossomaki", icon: <CircleDot size={12} /> },
    { id: "outros", label: "Joy, Niguiri e Sashimi", icon: <Sparkles size={12} /> },
  ];

  // depoimentos aprovados são os mais recentes (o Worker já devolve os mais novos
  // primeiro) -> mostramos eles antes dos depoimentos-base fixos.
  const allReviews = [
    ...approvedTestimonials.map((t) => ({ name: t.nome, stars: t.nota, text: t.texto })),
    ...REVIEWS,
  ];
  const visibleReviews = allReviews.slice(0, MAX_VISIBLE_REVIEWS);
  const [showAllReviews, setShowAllReviews] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: "'Raleway', sans-serif" }}>

      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("inicio")} className="flex items-center group">
            <ImageWithFallback src={logoIcon} alt="Esthan Sushi" className="h-9 w-auto object-contain" />
            <span className="ml-2 text-xl font-black tracking-widest text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ESTHAN<span className="text-primary"> SUSHI</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
                {link.label}
              </button>
            ))}
          </nav>

          <button onClick={() => scrollTo("cardapio")}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold tracking-wider uppercase hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,22,13,0.5)] transition-all">
            <ShoppingBag size={15} /> Ver Cardápio
          </button>

          <button className="md:hidden text-foreground" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {navOpen && (
          <div className="md:hidden bg-card border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="text-left text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </button>
            ))}
            <button onClick={() => scrollTo("cardapio")}
              className="mt-2 px-5 py-3 bg-primary text-primary-foreground text-sm font-semibold tracking-wider uppercase text-center">
              Ver Cardápio
            </button>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section id="inicio" className="relative flex flex-col items-center justify-center pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1775435616600-d09a2c040027?w=1800&h=1200&fit=crop&auto=format)` }} />
        <div className="grid-overlay absolute inset-0 opacity-60" />
        <div className="orb orb-red w-[36rem] h-[36rem] -top-40 -left-40" />
        <div className="orb orb-gold w-[30rem] h-[30rem] bottom-0 -right-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto"
        >
          <div className="mb-6 w-64 md:w-96 mx-auto"
            style={{ filter: "drop-shadow(0 0 40px rgba(226,22,13,0.45))" }}>
            <ImageWithFallback src={logoFull} alt="Esthan Sushi — Sabor que Conecta"
              className="w-full h-auto object-contain" />
          </div>

          <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed mb-4 font-light">
            Rolls artesanais frescos na sua porta.
          </p>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-10 font-light">
            Segunda a Sábado · 19h30 às 23h · Vila Nova Cachoeirinha
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => scrollTo("cardapio")}
              className="glow-pulse px-8 py-4 bg-primary text-primary-foreground font-semibold tracking-widest uppercase text-sm hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2">
              <ShoppingBag size={16} /> Ver Cardápio
            </button>
          </div>

          <button onClick={() => scrollTo("cardapio")}
            className="mt-10 text-muted-foreground hover:text-primary transition-colors animate-bounce">
            <ChevronDown size={28} />
          </button>
        </motion.div>
      </section>

      {/* ─── INFO STRIP ─── */}
      <section className="py-10 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { icon: <Bike size={22} className="text-primary" />, title: "Entrega Rápida", desc: "Média de 45 minutos na sua porta" },
            { icon: <Clock size={22} className="text-primary" />, title: "Horário de Delivery", desc: "Segunda a Sábado · 19h30 às 23h" },
            { icon: <MapPin size={22} className="text-primary" />, title: "Região de Entrega", desc: "Vila Nova Cachoeirinha e região · Até 20 km por R$ 7,00" },
          ].map((info) => (
            <div key={info.title} className="flex items-center gap-4 px-8 py-6">
              <div className="w-12 h-12 border border-primary/30 flex items-center justify-center flex-shrink-0">{info.icon}</div>
              <div>
                <p className="text-foreground font-semibold text-sm">{info.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{info.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CARDÁPIO ─── */}
      <section id="cardapio" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Nossa Carta</p>
            <h2 className="text-gradient text-4xl md:text-5xl font-black mb-5" style={{ fontFamily: "'Orbitron', sans-serif" }}>CARDÁPIO</h2>
            <button onClick={() => setGalleryOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary/40 text-primary text-xs tracking-widest uppercase font-semibold hover:bg-primary/10 transition-colors">
              <Images size={14} /> Ver fotos em tamanho grande
            </button>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap border border-border mb-12">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs tracking-widest uppercase font-semibold flex-1 min-w-max transition-all duration-200 border-r border-border last:border-r-0 ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary hover:bg-card"
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* GERAL */}
          {activeTab === "geral" && (
            <div className="max-w-3xl mx-auto flex flex-col gap-14">
              {[
                { title: "Barcas", items: BARCAS },
                { title: "Combinados", items: COMBINADOS },
                { title: "Promoções", items: PROMOCOES },
                { title: "Temakis", items: TEMAKIS },
                { title: "Hot Rolls", items: HOT_ROLLS },
                { title: "Sushi", items: SUSHI },
                { title: "Uramaki/Hossomaki", items: URAMAKIS },
                { title: "Joy, Niguiri e Sashimi", items: HOSSOMAKIS_OUTROS },
              ].filter((section) => section.items.length > 0).map((section) => (
                <div key={section.title}>
                  <h3 className="text-gradient text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {section.title}
                  </h3>
                  <div className="divide-y divide-border">
                    {section.items.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARCAS */}
          {activeTab === "barcas" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Para compartilhar com todo mundo!" title="BARCAS" />
              <div className="divide-y divide-border">
                {BARCAS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* COMBINADOS */}
          {activeTab === "combinados" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="A melhor escolha para compartilhar!" title="COMBINADOS" />
              <div className="divide-y divide-border">
                {COMBINADOS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* PROMOÇÕES */}
          {activeTab === "promocoes" && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Tag size={20} className="text-primary" />
                <div>
                  <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-1">Aproveite!</p>
                  <h3 className="text-gradient text-3xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>PROMOÇÕES</h3>
                </div>
              </div>
              {PROMOCOES.length > 0 ? (
                <div className="divide-y divide-border">
                  {PROMOCOES.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10 border border-border">
                  Nenhuma promoção ativa no momento — mas dá uma olhada no resto do cardápio!
                </p>
              )}
            </div>
          )}

          {/* TEMAKIS */}
          {activeTab === "temakis" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Generosos e irresistíveis!" title="TEMAKIS" />
              <div className="divide-y divide-border">
                {TEMAKIS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* HOT ROLLS */}
          {activeTab === "hotrolls" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Crocantes por fora, cremosos por dentro!" title="HOT ROLLS" />
              <div className="flex items-center gap-2 mb-5 text-primary text-xs font-semibold">
                <Flame size={14} /> Todos grelhados na hora
              </div>
              <div className="divide-y divide-border">
                {HOT_ROLLS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* SUSHI */}
          {activeTab === "sushi" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Clássicos que não podem faltar!" title="SUSHI" />
              <div className="divide-y divide-border">
                {SUSHI.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* URAMAKIS */}
          {activeTab === "uramakis" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Sabor e sofisticação em cada detalhe!" title="URAMAKI & HOSSOMAKI" />
              <div className="divide-y divide-border">
                {URAMAKIS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}

          {/* OUTROS */}
          {activeTab === "outros" && (
            <div className="max-w-3xl mx-auto">
              <SectionHeader label="Joy, Niguiri e Sashimi" title="OUTROS" />
              <div className="divide-y divide-border">
                {HOSSOMAKIS_OUTROS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── SOBRE ─── */}
      <section id="sobre" className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="photo-frame-bg aspect-square overflow-hidden">
              <ImageWithFallback src={imgBarcaSobre}
                alt="Sushi fresco preparado por Esthan Sushi" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-primary flex-col items-center justify-center text-center p-4 hidden lg:flex">
              <span className="text-3xl font-black text-primary-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>5+</span>
              <span className="text-primary-foreground text-xs tracking-widest uppercase mt-1">Anos de sabor</span>
            </div>
          </div>
          <div>
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-4">Nossa História</p>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              SABOR<br /><span className="text-gradient">QUE CONECTA</span>
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Peixes selecionados, sempre frescos e de qualidade. Cada roll é preparado na hora com muito cuidado, para que seu pedido chegue quente e com agilidade.</p>
              <p>Trabalhamos exclusivamente por delivery para que você aproveite a mesma qualidade no conforto da sua casa.</p>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              {[
                { num: "+60", label: "Itens no cardápio" },
                { num: "100%", label: "Fresco no momento" },
                { num: "+2K", label: "Pedidos entregues" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-primary" style={{ fontFamily: "'Orbitron', sans-serif" }}>{stat.num}</div>
                  <div className="text-muted-foreground text-xs tracking-widest uppercase mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── AVALIAÇÕES ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Clientes</p>
            <h2 className="text-gradient text-4xl md:text-5xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>O QUE DIZEM</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {visibleReviews.map((r, idx) => (
              <motion.div
                key={r.name + idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                className="bg-background p-8 hover:bg-card/60 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{r.text}"</p>
                <p className="text-foreground text-xs tracking-widest uppercase font-semibold">{r.name}</p>
              </motion.div>
            ))}
          </div>

          {allReviews.length > MAX_VISIBLE_REVIEWS && (
            <div className="mt-8 text-center">
              <button onClick={() => setShowAllReviews(true)}
                className="px-6 py-3 border border-border text-muted-foreground text-xs tracking-widest uppercase font-semibold hover:border-primary hover:text-primary transition-colors">
                Ver todos os depoimentos ({allReviews.length})
              </button>
            </div>
          )}

          <div className="mt-14 max-w-xl mx-auto text-center">
            {!showTestimonialForm && !testimonialSent && !testimonialBlocked && (
              <button onClick={() => setShowTestimonialForm(true)}
                className="px-6 py-3 border border-primary/40 text-primary text-xs tracking-widest uppercase font-semibold hover:bg-primary/10 transition-colors">
                Enviar seu depoimento
              </button>
            )}

            {testimonialBlocked && (
              <p className="text-muted-foreground text-sm leading-relaxed border border-border p-6">
                Já identificamos um depoimento enviado a partir deste endereço. Cada cliente pode enviar apenas uma avaliação.
              </p>
            )}

            {showTestimonialForm && !testimonialSent && !testimonialBlocked && (
              <form onSubmit={sendTestimonialToWhatsApp} className="flex flex-col gap-4 text-left border border-border p-6 md:p-8">
                <div>
                  <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Nome</label>
                  <input required value={depNome} onChange={(e) => setDepNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">O que você pediu (opcional)</label>
                  <input value={depItem} onChange={(e) => setDepItem(e.target.value)}
                    placeholder="Ex: Barca Hot, Temaki Skin..."
                    className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Sua avaliação</label>
                  <select value={depNota} onChange={(e) => setDepNota(Number(e.target.value))}
                    className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors">
                    <option value={5}>★★★★★ (5 de 5)</option>
                    <option value={4}>★★★★☆ (4 de 5)</option>
                    <option value={3}>★★★☆☆ (3 de 5)</option>
                    <option value={2}>★★☆☆☆ (2 de 5)</option>
                    <option value={1}>★☆☆☆☆ (1 de 5)</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs tracking-widest uppercase mb-2 block">Seu depoimento</label>
                  <textarea required rows={3} value={depTexto} onChange={(e) => setDepTexto(e.target.value)}
                    placeholder="Conte como foi sua experiência com a Esthan Sushi"
                    className="w-full bg-input-background border border-border px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-colors resize-none" />
                </div>
                {testimonialError && (
                  <p className="text-destructive text-xs leading-relaxed">
                    Não conseguimos enviar seu depoimento agora. Tente novamente em instantes.
                  </p>
                )}
                <button type="submit" disabled={testimonialSubmitting}
                  className="mt-2 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {testimonialSubmitting ? "Enviando..." : "Enviar depoimento para aprovação"}
                </button>
              </form>
            )}

            {testimonialSent && (
              <p className="text-muted-foreground text-sm leading-relaxed border border-border p-6">
                Obrigado pelo seu depoimento! Ele foi enviado automaticamente para nossa equipe e será publicado aqui assim que for revisado e aprovado.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── CTA BAND ─── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(115deg, #7a0c08 0%, #e2160d 45%, #d4900f 100%)" }}>
        <div className="grid-overlay absolute inset-0 opacity-30" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-white/80 text-xs tracking-[0.4em] uppercase mb-4 font-semibold">Delivery</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            PEÇA AGORA,<br />COMA EM APROXIMADAMENTE 45 MIN
          </h2>
          <p className="text-white/90 text-lg mb-10 font-light max-w-xl mx-auto">
            Monte seu pedido no site e a gente prepara na hora. Tempo médio de entrega, pode variar conforme o
            endereço e o movimento — sem aplicativo, sem taxa extra, direto com a gente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollTo("cardapio")}
              className="px-10 py-4 bg-[#1a0f05] text-white font-bold tracking-widest uppercase text-sm hover:brightness-125 transition-all flex items-center justify-center gap-2">
              <ShoppingBag size={16} /> Ver Cardápio
            </button>
            <a href="tel:+5511994597259"
              className="px-10 py-4 border border-white/50 text-white font-bold tracking-widest uppercase text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Phone size={16} /> (11) 99459-7259
            </a>
          </div>
        </div>
      </section>

      {/* ─── PEDIDO ─── */}
      <section id="pedido" className="py-24 px-6 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-4">Delivery</p>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              FAÇA SEU<br />PEDIDO
            </h2>
            <div className="space-y-5 mb-8">
              {[
                { icon: <Phone size={18} className="text-primary" />, label: "WhatsApp", val: "(11) 99459-7259" },
                { icon: <Clock size={18} className="text-primary" />, label: "Horário de delivery", val: "Segunda a Sábado · 19h30 às 23h" },
                {
                  icon: <MapPin size={18} className="text-primary" />, label: "Localização",
                  val: "Rua Marina Lemos de Abreu, 68 B · Jardim Centenário",
                  href: `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT_COORDS}`,
                  wazeHref: `https://waze.com/ul?ll=${RESTAURANT_COORDS}&navigate=yes`,
                },
                { icon: <Bike size={18} className="text-primary" />, label: "Taxa de entrega", val: "Para endereços em até 20 km, cobramos R$ 7,00. Fora desse raio, combinamos o valor certinho com você antes de confirmar o pedido." },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4 border-b border-border pb-5">
                  <div className="w-10 h-10 border border-primary/30 flex items-center justify-center flex-shrink-0">{c.icon}</div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">{c.label}</p>
                    {c.href ? (
                      <>
                        <a href={c.href} target="_blank" rel="noopener noreferrer"
                          className="text-foreground text-sm hover:text-primary transition-colors underline decoration-dotted underline-offset-4">
                          {c.val}
                        </a>
                        <a href={c.wazeHref} target="_blank" rel="noopener noreferrer"
                          className="block text-primary text-xs mt-1 hover:brightness-110 transition-all">
                          Abrir no Waze
                        </a>
                      </>
                    ) : (
                      <p className="text-foreground text-sm">{c.val}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-foreground font-semibold tracking-widest uppercase text-sm mb-2">Como fazer seu pedido?</p>
            {[
              { step: "01", title: "Monte seu carrinho", desc: "Clique nos pratos que quiser direto no cardápio do site e vá adicionando ao carrinho." },
              { step: "02", title: "Entrega ou retirada", desc: "Informe seu endereço (a gente calcula o tempo estimado na hora) ou escolha retirar no local." },
              { step: "03", title: "Pagamento e envio", desc: "Escolha como vai pagar na entrega (dinheiro, crédito, débito, VR/voucher ou Pix) e envie — a mensagem já sai pronta no WhatsApp." },
              { step: "04", title: "Aproveite!", desc: "Aguarde em média 45 minutos e é só se deliciar com os nossos pratos, preparados com todo carinho para você!" },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 border border-border p-5 hover:border-primary/40 transition-colors">
                <span className="text-3xl font-black text-primary/20 leading-none flex-shrink-0" style={{ fontFamily: "'Orbitron', sans-serif" }}>{s.step}</span>
                <div>
                  <p className="text-foreground font-semibold text-sm mb-1">{s.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
            <button onClick={() => scrollTo("cardapio")}
              className="mt-2 py-4 bg-primary text-primary-foreground font-semibold tracking-widest uppercase text-sm hover:brightness-110 hover:shadow-[0_0_20px_rgba(226,22,13,0.5)] transition-all text-center flex items-center justify-center gap-2">
              <ShoppingBag size={16} /> Ver Cardápio e Fazer Pedido
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-black tracking-widest text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            ESTHAN <span className="text-primary">SUSHI</span>
          </span>
          <p className="text-muted-foreground text-xs tracking-widest">© 2024 Esthan Sushi · Só Delivery · Sabor que Conecta</p>
          <span className="text-muted-foreground text-xs tracking-widest">
            Vila Nova Cachoeirinha
          </span>
        </div>
        <div className="max-w-7xl mx-auto mt-2 text-right">
          <a href="/admin" className="text-muted-foreground/50 text-[10px] tracking-widest hover:text-muted-foreground transition-colors">
            Painel do dono
          </a>
        </div>
      </footer>

      <OrderModal item={activeMenuItem} onClose={() => setActiveMenuItem(null)} onAddLine={addLineToCart} />
      <AllReviewsModal open={showAllReviews} reviews={allReviews} onClose={() => setShowAllReviews(false)} />
      <PhotoGalleryModal open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <CartDrawer cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onCheckout={checkoutViaWhatsApp} />
    </div>
  );
}
