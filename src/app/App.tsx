import { useState } from "react";
import { Menu, X, Phone, Clock, Instagram, Facebook, ChevronDown, Bike, ShoppingBag, Star } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import brandLogo from "@/imports/image.png";

const NAV_LINKS = ["Inicio", "Menú", "Nosotros", "Pedido"];

const MENU_ITEMS = [
  {
    id: 1,
    name: "Temáki Salmón",
    category: "Temáki",
    price: "$8.500",
    description: "Cono de alga nori relleno de arroz sushi, salmón fresco, palta y queso crema.",
    tag: "Clásico",
    img: "https://images.unsplash.com/photo-1709984110217-57d7d18e5299?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Hot Rol Ebi",
    category: "Hot Rol",
    price: "$9.200",
    description: "Tempura de camarón cubierta con salsa teriyaki caramelizada y tobiko naranja.",
    tag: "Más pedido",
    img: "https://images.unsplash.com/photo-1562436260-8c9216eeb703?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Uramaki Philadelphia",
    category: "Uramaki",
    price: "$7.800",
    description: "Roll invertido con salmón ahumado, queso Philadelphia, pepino y sésamo tostado.",
    tag: "Sin gluten",
    img: "https://images.unsplash.com/photo-1617196035303-964a45bbc9f4?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 4,
    name: "Temáki Tuna Spicy",
    category: "Temáki",
    price: "$9.000",
    description: "Cono con atún rojo picante, sriracha mayo, cebolla morada y aguacate maduro.",
    tag: "Picante",
    img: "https://images.unsplash.com/photo-1709984110217-57d7d18e5299?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 5,
    name: "Hot Rol Veggie",
    category: "Hot Rol",
    price: "$7.200",
    description: "Tempura de zapallo y zanahoria, espinaca, queso crema y salsa de soya dulce.",
    tag: "Vegano",
    img: "https://images.unsplash.com/photo-1562436260-8c9216eeb703?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 6,
    name: "Uramaki Dragon",
    category: "Uramaki",
    price: "$10.500",
    description: "Roll con láminas de palta, langostino grillado, mayo de ají amarillo y masago.",
    tag: "Especial",
    img: "https://images.unsplash.com/photo-1617196035303-964a45bbc9f4?w=600&h=400&fit=crop&auto=format",
  },
];

const CATEGORIES = ["Todos", "Temáki", "Hot Rol", "Uramaki"];

const REVIEWS = [
  { name: "Camila R.", stars: 5, text: "El delivery llegó súper rápido y el sushi estaba impecable. El Hot Rol Ebi es una locura de rico." },
  { name: "Andrés M.", stars: 5, text: "Primera vez pidiendo y quedé maravillado. Packaging perfecto, todo fresquísimo y los sabores increíbles." },
  { name: "Valentina P.", stars: 5, text: "Pido todas las semanas. El Uramaki Dragon es adictivo. Nunca me ha llegado tarde ni en mal estado." },
];

const WHATSAPP_NUMBER = "56987654321";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20hacer%20un%20pedido%20de%20delivery%20%F0%9F%8D%A3`;

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = activeCategory === "Todos"
    ? MENU_ITEMS
    : MENU_ITEMS.filter((i) => i.category === activeCategory);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ fontFamily: "'Raleway', sans-serif" }}
    >
      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("inicio")} className="flex items-center group">
            <ImageWithFallback
              src={brandLogo}
              alt="Esthan Sushi"
              className="h-10 w-10 object-contain"
            />
            <span
              className="ml-2 text-xl font-black tracking-widest text-foreground group-hover:text-primary transition-colors"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ESTHAN<span className="text-primary"> SUSHI</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {link}
              </button>
            ))}
          </nav>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold tracking-wider uppercase hover:bg-red-700 transition-colors"
          >
            <ShoppingBag size={15} />
            Pedir ahora
          </a>

          <button className="md:hidden text-foreground" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {navOpen && (
          <div className="md:hidden bg-card border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className="text-left text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {link}
              </button>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-5 py-3 bg-primary text-primary-foreground text-sm font-semibold tracking-wider uppercase text-center"
            >
              Pedir por WhatsApp
            </a>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section
        id="inicio"
        className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1775435616600-d09a2c040027?w=1800&h=1200&fit=crop&auto=format)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          <div className="mb-8" style={{ filter: "drop-shadow(0 0 60px rgba(192,57,43,0.4))" }}>
            <ImageWithFallback
              src={brandLogo}
              alt="Esthan Sushi — Sabor que Conecta"
              className="w-72 h-72 md:w-96 md:h-96 object-contain"
            />
          </div>

          {/* delivery badge */}
          <div className="flex items-center gap-2 border border-primary/40 px-4 py-2 mb-6 text-primary text-xs tracking-widest uppercase font-semibold">
            <Bike size={14} />
            Solo Delivery · Entrega en 30–45 min
          </div>

          <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed mb-10 font-light">
            Rolls artesanales frescos directo a tu puerta.
            Hacemos tu pedido al momento — sin intermediarios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold tracking-widest uppercase text-sm hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Pedir por WhatsApp
            </a>
            <button
              onClick={() => scrollTo("menú")}
              className="px-8 py-4 border border-border text-foreground font-semibold tracking-widest uppercase text-sm hover:border-primary hover:text-primary transition-all duration-200"
            >
              Ver Menú
            </button>
          </div>
        </div>

        <button
          onClick={() => scrollTo("menú")}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors animate-bounce"
        >
          <ChevronDown size={28} />
        </button>
      </section>

      {/* ─── DELIVERY INFO STRIP ─── */}
      <section className="py-10 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { icon: <Bike size={22} className="text-primary" />, title: "Entrega Rápida", desc: "30 a 45 minutos a tu domicilio" },
            { icon: <Clock size={22} className="text-primary" />, title: "Horario Delivery", desc: "Lun–Vie 12:00–22:00 · Sáb–Dom 12:00–23:00" },
            { icon: <ShoppingBag size={22} className="text-primary" />, title: "Pedido Mínimo", desc: "$12.000 · Pago en efectivo o transferencia" },
          ].map((info) => (
            <div key={info.title} className="flex items-center gap-4 px-8 py-6">
              <div className="w-12 h-12 border border-primary/30 flex items-center justify-center flex-shrink-0">
                {info.icon}
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{info.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{info.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MENÚ ─── */}
      <section id="menú" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Nuestra Carta</p>
              <h2
                className="text-4xl md:text-5xl font-black text-foreground"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                MENÚ
              </h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 text-xs tracking-widest uppercase font-semibold border transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {filtered.map((item) => (
              <div key={item.id} className="bg-background group overflow-hidden flex flex-col">
                <div className="relative h-52 overflow-hidden bg-card">
                  <ImageWithFallback
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase px-3 py-1 font-bold">
                    {item.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 text-foreground text-lg font-bold">
                    {item.price}
                  </span>
                </div>

                <div className="p-6 border-t border-border flex flex-col flex-1">
                  <p className="text-primary text-[10px] tracking-[0.3em] uppercase mb-1">{item.category}</p>
                  <h3
                    className="text-xl font-bold text-foreground mb-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{item.description}</p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20pedir%20${encodeURIComponent(item.name)}%20%E2%80%94%20${encodeURIComponent(item.price)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-2.5 border border-primary text-primary text-xs tracking-widest uppercase font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    Pedir este roll
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NOSOTROS ─── */}
      <section id="nosotros" className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square overflow-hidden bg-secondary">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1709984110217-57d7d18e5299?w=800&h=800&fit=crop&auto=format"
                alt="Sushi fresco preparado por Esthan Sushi"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-primary flex-col items-center justify-center text-center p-4 hidden lg:flex">
              <span className="text-3xl font-black text-primary-foreground" style={{ fontFamily: "'Cinzel', serif" }}>5+</span>
              <span className="text-primary-foreground text-xs tracking-widest uppercase mt-1">Años de sabor</span>
            </div>
          </div>

          <div>
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-4">Nuestra Historia</p>
            <h2
              className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              SABOR<br />
              <span className="text-primary">QUE CONECTA</span>
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Esthan Sushi nació de la pasión por fusionar la tradición japonesa con los sabores
                de nuestra tierra. Cada roll que preparamos es elaborado al momento de tu pedido,
                con ingredientes frescos seleccionados diariamente.
              </p>
              <p>
                Trabajamos exclusivamente por delivery para que disfrutes la misma calidad del
                restaurante sin salir de casa. Rápido, fresco y con el sabor que conecta.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              {[
                { num: "+30", label: "Variedades" },
                { num: "100%", label: "Fresco al momento" },
                { num: "+2K", label: "Pedidos entregados" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-primary" style={{ fontFamily: "'Cinzel', serif" }}>
                    {stat.num}
                  </div>
                  <div className="text-muted-foreground text-xs tracking-widest uppercase mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Clientes</p>
            <h2 className="text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              LO QUE DICEN
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-background p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{r.text}"</p>
                <p className="text-foreground text-xs tracking-widest uppercase font-semibold">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA DELIVERY BAND ─── */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-red-200 text-xs tracking-[0.4em] uppercase mb-4">Delivery</p>
          <h2
            className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            PIDE AHORA,<br />COME EN 40 MIN
          </h2>
          <p className="text-red-100 text-lg mb-10 font-light max-w-xl mx-auto">
            Envíanos tu pedido por WhatsApp y nuestro equipo lo prepara al instante.
            Sin apps, sin comisiones, directo con nosotros.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-white text-primary font-bold tracking-widest uppercase text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Pedir por WhatsApp
            </a>
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="px-10 py-4 border border-white/40 text-white font-bold tracking-widest uppercase text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              Llamar ahora
            </a>
          </div>
        </div>
      </section>

      {/* ─── PEDIDO / CONTACTO ─── */}
      <section id="pedido" className="py-24 px-6 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-4">Delivery</p>
            <h2
              className="text-4xl md:text-5xl font-black text-foreground mb-8"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              HAZ TU<br />PEDIDO
            </h2>

            <div className="space-y-5 mb-8">
              {[
                { icon: <Phone size={18} className="text-primary" />, label: "WhatsApp / Teléfono", val: "+56 9 8765 4321" },
                { icon: <Clock size={18} className="text-primary" />, label: "Horario de delivery", val: "Lun–Vie 12:00–22:00 · Sáb–Dom 12:00–23:00" },
                { icon: <Bike size={18} className="text-primary" />, label: "Zonas de entrega", val: "Santiago Centro, Providencia, Ñuñoa, Las Condes" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4 border-b border-border pb-5">
                  <div className="w-10 h-10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">{c.label}</p>
                    <p className="text-foreground text-sm">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              {[
                { icon: <Instagram size={18} />, label: "Instagram" },
                { icon: <Facebook size={18} />, label: "Facebook" },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-10 h-10 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-foreground font-semibold tracking-widest uppercase text-sm mb-2">¿Cómo hacer tu pedido?</p>

            {[
              { step: "01", title: "Elige del menú", desc: "Selecciona tus rolls favoritos y anota el nombre y cantidad." },
              { step: "02", title: "Escríbenos", desc: "Envíanos tu pedido por WhatsApp con tu dirección de entrega." },
              { step: "03", title: "Confirma y paga", desc: "Te confirmamos el total. Pagás en efectivo o transferencia al recibir." },
              { step: "04", title: "¡A disfrutar!", desc: "Tu pedido llega en 30–45 minutos, fresco y listo para comer." },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 border border-border p-5 hover:border-primary/40 transition-colors">
                <span
                  className="text-3xl font-black text-primary/20 leading-none flex-shrink-0"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-foreground font-semibold text-sm mb-1">{s.title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 py-4 bg-primary text-primary-foreground font-semibold tracking-widest uppercase text-sm hover:bg-red-700 transition-colors text-center flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Pedir ahora por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-black tracking-widest text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
            ESTHAN <span className="text-primary">SUSHI</span>
          </span>
          <p className="text-muted-foreground text-xs tracking-widest">
            © 2024 Esthan Sushi · Solo Delivery · Sabor que Conecta
          </p>
          <p className="text-muted-foreground text-xs tracking-widest">
            手巻き · ホットロール · 裏巻き
          </p>
        </div>
      </footer>
    </div>
  );
}
