import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Menu, X, Phone, Clock, ChevronDown, Bike, ShoppingBag, Star, MapPin, Flame, Tag, Sailboat, UtensilsCrossed, Layers, IceCreamCone, Disc, Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { OrderModal } from "@/app/components/OrderModal";
import { CartDrawer } from "@/app/components/CartDrawer";
import { buildOrderMessage, type CartLine, type DeliveryMode } from "@/app/cart-data";
import logoFull from "@/imports/logo-transparent.png";
import logoIcon from "@/imports/logo-mark.png";

const WHATSAPP_NUMBER = "5511994597259";

// depoimento: visitante envia -> Cloudflare Worker guarda como pendente e devolve
// um link de aprovação de 1 toque -> esse link vai dentro da mensagem de WhatsApp
// para o dono -> nada é publicado até ele tocar no link e aprovar.
const TESTIMONIAL_API = "https://esthan-depoimentos.rieres.workers.dev";
const TESTIMONIAL_SENT_KEY = "esthan_depoimento_enviado";

const NAV_LINKS = ["Início", "Cardápio", "Sobre", "Pedido"];

// ─── CARDÁPIO COMPLETO ────────────────────────────────────────

const BARCAS = [
  {
    name: "Barca Hot",
    desc: "4 Joy grelhados · 4 Niguiri grelhados · 4 Sushi Uramaki Skin · 4 Hot Especial · 4 Hot Doritos · 4 Hot Salmão",
    price: "R$ 94,90",
  },
  {
    name: "Barca Salmão",
    desc: "10 Sashimis · 4 Filadélfia · 4 Skin · 4 Hot Especial · 6 Uramaki Salmão · 6 Hossomaki Salmão",
    price: "R$ 99,90",
  },
  {
    name: "Mini Barca Salmão",
    desc: "05 Sashimis · 06 Uramaki Salmão · 06 Hossomaki Salmão",
    price: "R$ 59,90",
  },
];

const COMBINADOS = [
  { name: "Combinado Califórnia", desc: "1 Temaki Califórnia · 4 Uramaki Califórnia · 2 Niguiri de Kani", price: "R$ 39,90" },
  { name: "Combinado Casal", desc: "02 Temaki Salmão Completo · 04 Filadélfia · 04 Uramaki Filadélfia", price: "R$ 74,90" },
  { name: "Combinado Casal Hot", desc: "02 Temaki Hot · 04 Sushi Filadélfia · 04 Uramaki Filadélfia", price: "R$ 76,90" },
  { name: "Combinado Hot + Filadélfia", desc: "4 Hot Roll Salmão · 4 Sushi Filadélfia", price: "R$ 25,90" },
  { name: "Combinado Joy", desc: "04 Joy Salmão · 04 Joy Pepino · 04 Joy Salmão Grelhado", price: "R$ 58,90" },
  { name: "Combinado Joy + Niguiri", desc: "04 Joy Salmão · 04 Niguiri", price: "R$ 28,90" },
  { name: "Combinado Misto Hossomaki", desc: "6 Hossomaki Skin · 6 Hossomaki Pepino · 6 Hossomaki Kani · 6 Mini Hot Roll · 6 Uramaki Salmão · 6 Hossomaki Salmão", price: "R$ 79,90" },
  { name: "Combinado Nachos", desc: "1 Temaki Salmão Grelhado · 4 Hot Roll Doritos Especial", price: "R$ 42,90" },
  { name: "Combinado Sushi Uramaki", desc: "08 Uramaki Filadélfia · 08 Uramaki Califórnia · 06 Uramaki Skin", price: "R$ 59,90" },
  { name: "Combinado Temaki + Hot", desc: "01 Temaki Salmão · 04 Hot Roll", price: "R$ 39,90" },
  { name: "Combinado Temaki + Joy", desc: "01 Temaki Salmão Completo · 04 Joy Salmão", price: "R$ 41,90" },
  { name: "Combinado Temaki + Niguiri", desc: "01 Temaki Salmão Completo · 04 Niguiri", price: "R$ 38,90" },
  { name: "Combinado Temaki + Sashimi", desc: "01 Temaki Salmão Completo · 05 Sashimis", price: "R$ 41,90" },
  { name: "Temaki Hot + Hot", desc: "01 Temaki Hot · 04 Hot Roll", price: "R$ 41,90" },
];

const PROMOCOES = [
  { name: "Promoção Combinado Casal", desc: "02 Temaki Salmão Completo · 04 Filadélfia · 04 Uramaki Filadélfia", oldPrice: "R$ 74,90", price: "R$ 68,90" },
  { name: "Promoção Combinado Casal Hot", desc: "02 Temaki Salmão Completo · 04 Filadélfia · 04 Uramaki Filadélfia", oldPrice: null, price: "R$ 69,90" },
  { name: "Promoção Hot Roll Salmão", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", oldPrice: "R$ 29,90", price: "R$ 25,90" },
  { name: "Promoção Mini Barca", desc: "05 Sashimis · 06 Uramaki Salmão · 06 Hossomaki Salmão", oldPrice: "R$ 59,90", price: "R$ 49,90" },
  { name: "Promoção Sushi Uramaki Skin", desc: "Arroz com gergilim, pele de salmão frita, cream cheese e cebolinha · 8 unidades", oldPrice: "R$ 22,90", price: "R$ 18,90" },
  { name: "Promoção Temaki Hot", desc: "Salmão, cream cheese, cebolinha, arroz e panko", oldPrice: "R$ 31,90", price: "R$ 26,90" },
  { name: "Temaki Hot + Hot (Promo)", desc: "01 Temaki Hot · 04 Hot Roll", oldPrice: null, price: "R$ 37,90" },
];

const TEMAKIS = [
  { name: "Temaki Califórnia", desc: "Arroz, kani, manga e pepino", price: "R$ 26,90" },
  { name: "Temaki Grill", desc: "Arroz, salmão grelhado, cream cheese e cebolinha", price: "R$ 29,90" },
  { name: "Temaki Hot", desc: "Salmão, cream cheese, cebolinha, arroz e panko", price: "R$ 31,90" },
  { name: "Temaki Salmão Completo", desc: "Arroz, salmão, cream cheese e cebolinha", price: "R$ 28,90" },
  { name: "Temaki Skin", desc: "Arroz, pele de salmão frita e cream cheese", price: "R$ 25,90" },
];

const HOT_ROLLS = [
  { name: "Hot Roll Doritos Especial", desc: "Arroz, salmão grelhado, cream cheese, cebolinha e doritos · 8 unidades", price: "R$ 35,90" },
  { name: "Hot Roll Especial", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 35,90" },
  { name: "Hot Roll Salmão", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 29,90" },
];

const URAMAKIS = [
  { name: "Sushi Filadélfia", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 24,90" },
  { name: "Sushi Uramaki Califórnia", desc: "Arroz com gergilim, kani, manga e pepino · 8 unidades", price: "R$ 24,90" },
  { name: "Sushi Uramaki Filadélfia", desc: "Arroz com gergilim, cream cheese e cebolinha · 8 unidades", price: "R$ 25,90" },
  { name: "Sushi Uramaki Skin", desc: "Arroz com gergilim, pele de salmão frita, cream cheese e cebolinha · 8 unidades", price: "R$ 22,90" },
  { name: "Uramaki Salmão", desc: "Arroz com gergelim e salmão · 8 unidades", price: "R$ 17,90" },
  { name: "Uramaki Skin", desc: "Arroz com gergelim, pele de salmão frita, cream cheese e cebolinha · 8 unidades", price: "R$ 22,90" },
];

const HOSSOMAKIS_OUTROS = [
  { name: "Hossomaki de Pepino", desc: "Arroz e pepino · 6 unidades", price: "R$ 12,90" },
  { name: "Hossomaki de Salmão", desc: "Arroz e salmão · 6 unidades", price: "R$ 16,90" },
  { name: "Joy de Salmão", desc: "Arroz, salmão, cream cheese e cebolinha · 6 unidades", price: "R$ 35,90" },
  { name: "Niguiri Salmão", desc: "Salmão e arroz · 4 unidades", price: "R$ 14,90" },
  { name: "Sashimi", desc: "20 unidades", price: "R$ 69,90" },
];

const SECTION_IMGS: Record<string, string> = {
  barcas: "https://images.unsplash.com/photo-1663334038419-71e6f82e333f?w=800&h=600&fit=crop&auto=format",
  combinados: "https://images.unsplash.com/photo-1617196035303-964a45bbc9f4?w=800&h=600&fit=crop&auto=format",
  temakis: "https://images.unsplash.com/photo-1556906918-c3071bd11598?w=800&h=600&fit=crop&auto=format",
  hotrolls: "https://images.unsplash.com/photo-1562436260-8c9216eeb703?w=800&h=600&fit=crop&crop=focalpoint&fp-x=0.9&fp-y=0.55&auto=format",
  uramakis: "https://images.unsplash.com/photo-1774635800472-41eaa93c1453?w=800&h=600&fit=crop&auto=format",
  promocoes: "https://images.unsplash.com/photo-1676037150398-c46c57172f28?w=800&h=600&fit=crop&auto=format",
  outros: "https://images.unsplash.com/photo-1772285283419-b34f42b4a4df?w=800&h=600&fit=crop&auto=format",
};

const REVIEWS = [
  { name: "Camila R.", stars: 5, text: "Delivery chegou rapidíssimo e o sushi estava impecável. A Barca Hot é incrível!" },
  { name: "Marcos S.", stars: 5, text: "Peço toda semana. O Combinado Casal é perfeito. Nunca chegou tarde nem em mal estado." },
  { name: "Valentina P.", stars: 5, text: "Primeira vez pedindo e fiquei encantado. Tudo fresquíssimo, sabores incríveis." },
];

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

function ListItem({ name, desc, price, oldPrice, onSelect }: { name: string; desc?: string; price: string; oldPrice?: string | null; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-start justify-between gap-4 py-4 border-b border-border group hover:bg-card/40 px-2 -mx-2 transition-colors rounded text-left"
    >
      <div className="flex-1">
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

function TwoColLayout({ children, imgKey }: { children: React.ReactNode; imgKey: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-border">
      <div className="bg-background p-8 lg:p-12 order-2 lg:order-1">{children}</div>
      <div className="overflow-hidden order-1 lg:order-2 lg:self-center aspect-[4/3]">
        <ImageWithFallback src={SECTION_IMGS[imgKey]} alt={imgKey}
          className="w-full h-full object-cover object-center" />
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeMenuItem, setActiveMenuItem] = useState<{ name: string; price: string } | null>(null);

  const addLineToCart = (line: CartLine) => setCart((prev) => [...prev, line]);
  const updateCartQty = (id: string, qty: number) =>
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  const checkoutViaWhatsApp = (customerName: string, deliveryMode: DeliveryMode, address: string, etaMinutes?: number, scheduledFor?: string) => {
    const text = buildOrderMessage(cart, customerName, deliveryMode, address, etaMinutes, scheduledFor);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    setCart([]);
  };

  const [approvedTestimonials, setApprovedTestimonials] = useState<
    { nome: string; item?: string; nota: number; texto: string }[]
  >([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialSent, setTestimonialSent] = useState(false);
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

  async function sendTestimonialToWhatsApp(e: FormEvent) {
    e.preventDefault();
    const stars = "★".repeat(depNota) + "☆".repeat(5 - depNota);

    let approveUrl = "";
    try {
      const resp = await fetch(`${TESTIMONIAL_API}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: depNome, item: depItem, nota: depNota, texto: depTexto }),
      });
      const data = await resp.json();
      approveUrl = data.approveUrl || "";
    } catch {
      // serviço de aprovação fora do ar — envia a mensagem pro WhatsApp mesmo assim,
      // só sem o link de aprovação de 1 toque
    }

    const linkLine = approveUrl ? `\n\n✅ Aprovar e publicar no site: ${approveUrl}` : "";
    const text = `Novo depoimento para aprovação no site:\nNome: ${depNome}\nItem pedido: ${depItem}\nAvaliação: ${stars} (${depNota}/5)\nDepoimento: ${depTexto}${linkLine}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");

    try { localStorage.setItem(TESTIMONIAL_SENT_KEY, "1"); } catch { /* localStorage indisponível */ }
    setTestimonialSent(true);
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
    { id: "uramakis", label: "Uramakis", icon: <Disc size={12} /> },
    { id: "outros", label: "Outros", icon: <Sparkles size={12} /> },
  ];

  const allReviews = [
    ...REVIEWS,
    ...approvedTestimonials.map((t) => ({ name: t.nome, stars: t.nota, text: t.texto })),
  ];

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

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button key={link} onClick={() => scrollTo(link.toLowerCase().replace("í", "i"))}
                className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-medium">
                {link}
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
              <button key={link} onClick={() => scrollTo(link.toLowerCase().replace("í", "i"))}
                className="text-left text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">
                {link}
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
            Segunda a Sábado · 19h30 às 23h30 · Vila Nova Cachoeirinha
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
            { icon: <Bike size={22} className="text-primary" />, title: "Entrega Rápida", desc: "45 minutos na sua porta" },
            { icon: <Clock size={22} className="text-primary" />, title: "Horário de Delivery", desc: "Segunda a Sábado · 19h30 às 23h30" },
            { icon: <MapPin size={22} className="text-primary" />, title: "Região de Entrega", desc: "Vila Nova Cachoeirinha e região" },
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
            <h2 className="text-gradient text-4xl md:text-5xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>CARDÁPIO</h2>
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
            <div className="max-w-6xl mx-auto flex flex-col gap-16">
              {[
                { title: "Barcas", items: BARCAS, imgKey: "barcas" },
                { title: "Combinados", items: COMBINADOS, imgKey: "combinados" },
                { title: "Promoções", items: PROMOCOES, imgKey: "promocoes" },
                { title: "Temakis", items: TEMAKIS, imgKey: "temakis" },
                { title: "Hot Rolls", items: HOT_ROLLS, imgKey: "hotrolls" },
                { title: "Uramakis", items: URAMAKIS, imgKey: "uramakis" },
                { title: "Outros", items: HOSSOMAKIS_OUTROS, imgKey: "outros" },
              ].map((section) => (
                <div key={section.title} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  <div className="overflow-hidden aspect-[4/3] order-1">
                    <ImageWithFallback src={SECTION_IMGS[section.imgKey]} alt={section.imgKey}
                      className="w-full h-full object-cover object-center" />
                  </div>
                  <div className="order-2">
                    <h3 className="text-gradient text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {section.title}
                    </h3>
                    <div className="divide-y divide-border">
                      {section.items.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARCAS */}
          {activeTab === "barcas" && (
            <TwoColLayout imgKey="barcas">
              <SectionHeader label="Para compartilhar com todo mundo!" title="BARCAS" />
              <div className="divide-y divide-border">
                {BARCAS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* COMBINADOS */}
          {activeTab === "combinados" && (
            <TwoColLayout imgKey="combinados">
              <SectionHeader label="A melhor escolha para compartilhar!" title="COMBINADOS" />
              <div className="divide-y divide-border">
                {COMBINADOS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* PROMOÇÕES */}
          {activeTab === "promocoes" && (
            <TwoColLayout imgKey="promocoes">
              <div className="flex items-center gap-3 mb-8">
                <Tag size={20} className="text-primary" />
                <div>
                  <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-1">Aproveite!</p>
                  <h3 className="text-gradient text-3xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>PROMOÇÕES</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {PROMOCOES.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* TEMAKIS */}
          {activeTab === "temakis" && (
            <TwoColLayout imgKey="temakis">
              <SectionHeader label="Generosos e irresistíveis!" title="TEMAKIS" />
              <div className="divide-y divide-border">
                {TEMAKIS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* HOT ROLLS */}
          {activeTab === "hotrolls" && (
            <TwoColLayout imgKey="hotrolls">
              <SectionHeader label="Crocantes por fora, cremosos por dentro!" title="HOT ROLLS" />
              <div className="flex items-center gap-2 mb-5 text-primary text-xs font-semibold">
                <Flame size={14} /> Todos grelhados na hora
              </div>
              <div className="divide-y divide-border">
                {HOT_ROLLS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* URAMAKIS */}
          {activeTab === "uramakis" && (
            <TwoColLayout imgKey="uramakis">
              <SectionHeader label="Sabor e sofisticação em cada detalhe!" title="URAMAKIS" />
              <div className="divide-y divide-border">
                {URAMAKIS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}

          {/* OUTROS */}
          {activeTab === "outros" && (
            <TwoColLayout imgKey="outros">
              <SectionHeader label="Hossomakis, Joy, Niguiri e Sashimi" title="OUTROS" />
              <div className="divide-y divide-border">
                {HOSSOMAKIS_OUTROS.map((item) => <ListItem key={item.name} {...item} onSelect={() => setActiveMenuItem(item)} />)}
              </div>
            </TwoColLayout>
          )}
        </div>
      </section>

      {/* ─── SOBRE ─── */}
      <section id="sobre" className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square overflow-hidden bg-secondary">
              <ImageWithFallback src="https://images.unsplash.com/photo-1709984110217-57d7d18e5299?w=800&h=800&fit=crop&auto=format"
                alt="Sushi fresco preparado por Esthan Sushi" className="w-full h-full object-cover" />
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
            {allReviews.map((r, idx) => (
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

          <div className="mt-14 max-w-xl mx-auto text-center">
            {!showTestimonialForm && !testimonialSent && (
              <button onClick={() => setShowTestimonialForm(true)}
                className="px-6 py-3 border border-primary/40 text-primary text-xs tracking-widest uppercase font-semibold hover:bg-primary/10 transition-colors">
                Enviar seu depoimento
              </button>
            )}

            {showTestimonialForm && !testimonialSent && (
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
                <button type="submit"
                  className="mt-2 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all">
                  Enviar depoimento para aprovação
                </button>
              </form>
            )}

            {testimonialSent && (
              <p className="text-muted-foreground text-sm leading-relaxed border border-border p-6">
                Obrigado pelo seu depoimento! Ele foi enviado para nossa equipe pelo WhatsApp e será publicado aqui assim que for revisado e aprovado.
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
            PEÇA AGORA,<br />COMA EM 45 MIN
          </h2>
          <p className="text-white/90 text-lg mb-10 font-light max-w-xl mx-auto">
            Monte seu pedido no site e a gente prepara na hora. Sem aplicativo, sem taxa extra, direto com a gente.
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
                { icon: <Clock size={18} className="text-primary" />, label: "Horário de delivery", val: "Segunda a Sábado · 19h30 às 23h30" },
                { icon: <MapPin size={18} className="text-primary" />, label: "Localização", val: "Rua Marina Lemos de Abreu, 68 B · Jardim Centenário" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4 border-b border-border pb-5">
                  <div className="w-10 h-10 border border-primary/30 flex items-center justify-center flex-shrink-0">{c.icon}</div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">{c.label}</p>
                    <p className="text-foreground text-sm">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-foreground font-semibold tracking-widest uppercase text-sm mb-2">Como fazer seu pedido?</p>
            {[
              { step: "01", title: "Escolha do cardápio", desc: "Selecione seus rolls favoritos e anote nome e quantidade." },
              { step: "02", title: "Mande no WhatsApp", desc: "Envie seu pedido com o endereço de entrega pelo WhatsApp." },
              { step: "03", title: "Confirme e pague", desc: "Confirmamos o total. Pagamento em dinheiro ou transferência na entrega." },
              { step: "04", title: "Aproveite!", desc: "Seu pedido chega em 45 minutos, fresco e pronto para comer." },
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
      </footer>

      <OrderModal item={activeMenuItem} onClose={() => setActiveMenuItem(null)} onAddLine={addLineToCart} />
      <CartDrawer cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onCheckout={checkoutViaWhatsApp} />
    </div>
  );
}
