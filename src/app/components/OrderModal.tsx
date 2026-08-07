import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, ShoppingBag, CheckCircle2, CupSoda, Expand } from "lucide-react";
import { EXTRAS, DRINKS, EXTRA_SAUCE_FEE, sauceBreakdown, parsePrice, formatPrice, type CartLine, type Drink } from "@/app/cart-data";
import { ImageLightbox } from "@/app/components/ImageLightbox";

type MenuItem = { name: string; price: string; img?: string };

export function OrderModal({
  item,
  onClose,
  onAddLine,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onAddLine: (line: CartLine) => void;
}) {
  const [step, setStep] = useState<"item" | "upsell">("item");
  const [qty, setQty] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [addedDrink, setAddedDrink] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    if (item) {
      setStep("item");
      setQty(1);
      setExtras([]);
      setAddedDrink(null);
    }
  }, [item]);

  if (!item) return null;

  const toggleExtra = (name: string) => {
    setExtras((prev) => (prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]));
  };

  const confirmItem = () => {
    onAddLine({ id: crypto.randomUUID(), name: item.name, unitPrice: parsePrice(item.price), qty, extras });
    setStep("upsell");
  };

  const addDrink = (drink: Drink) => {
    onAddLine({ id: crypto.randomUUID(), name: drink.name, unitPrice: drink.price, qty: 1 });
    setAddedDrink(drink.name);
    setTimeout(() => onClose(), 1100);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-card border border-border sm:border-primary/20 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-1">
                {step === "item" ? "Adicionar ao pedido" : "Quer aproveitar e adicionar?"}
              </p>
              <h3 className="text-foreground text-xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {step === "item" ? item.name : "Bebida na entrega"}
              </h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
              <X size={22} />
            </button>
          </div>

          {step === "item" && (
            <>
              {item.img && (
                <button type="button" onClick={() => setShowPhoto(true)}
                  className="photo-frame-bg relative w-full aspect-[4/3] rounded overflow-hidden mb-6 group">
                  <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] tracking-widest uppercase px-2 py-1 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Expand size={12} /> Ampliar
                  </span>
                </button>
              )}

              <div className="flex items-center justify-between mb-6">
                <span className="text-muted-foreground text-xs tracking-widest uppercase">Quantidade</span>
                <div className="flex items-center gap-4 border border-border px-3 py-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="text-foreground hover:text-primary transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="text-foreground font-semibold w-4 text-center">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="text-foreground hover:text-primary transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Personalizar (molhos e adicionais)</p>
              <p className="text-muted-foreground text-xs mb-3">
                Cada prato leva 1 potinho grátis, espalhado entre os molhos marcados. Os potinhos extras saem + {formatPrice(EXTRA_SAUCE_FEE)} cada.
              </p>
              <div className="flex flex-col gap-2 mb-8">
                {EXTRAS.map((extra) => {
                  const checked = extras.includes(extra);
                  // simula como ficaria se esse molho estivesse marcado, pra mostrar o preço
                  // real mesmo antes de clicar (o crédito grátis é dividido entre os marcados)
                  const previewExtras = checked ? extras : [...extras, extra];
                  const entry = sauceBreakdown(previewExtras, qty).find((b) => b.name === extra)!;
                  let priceLabel: string;
                  if (entry.paid === 0) {
                    priceLabel = "Grátis";
                  } else if (entry.free === 0) {
                    priceLabel = qty === 1 ? `+ ${formatPrice(EXTRA_SAUCE_FEE)}` : `${qty} x ${formatPrice(EXTRA_SAUCE_FEE)}`;
                  } else {
                    priceLabel = `${entry.free} grátis + ${entry.paid} x ${formatPrice(EXTRA_SAUCE_FEE)}`;
                  }
                  return (
                    <label key={extra}
                      className="flex items-center justify-between gap-3 border border-border px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors">
                      <span className="flex items-center gap-3">
                        <input type="checkbox" checked={checked} onChange={() => toggleExtra(extra)}
                          className="accent-red-600" />
                        <span className="text-foreground text-sm">{extra}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">{priceLabel}</span>
                    </label>
                  );
                })}
              </div>

              <button onClick={confirmItem}
                className="w-full py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={14} /> Adicionar ao carrinho
              </button>
            </>
          )}

          {step === "upsell" && (
            addedDrink ? (
              <div className="flex flex-col items-center text-center gap-3 py-10">
                <CheckCircle2 size={40} className="text-primary" />
                <p className="text-foreground font-semibold">{addedDrink} adicionado ao pedido!</p>
                <p className="text-muted-foreground text-xs">Fechando...</p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-6">Que tal adicionar uma bebida gelada ao pedido?</p>
                <div className="flex flex-col gap-2 mb-6">
                  {DRINKS.map((drink) => (
                    <div key={drink.name}
                      className="flex items-center gap-3 border border-border px-4 py-3">
                      {drink.img ? (
                        <span className="photo-frame-bg w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden flex items-center justify-center">
                          <img src={drink.img} alt={drink.name} className="w-full h-full object-contain" />
                        </span>
                      ) : (
                        <span className="w-12 h-12 flex items-center justify-center bg-input-background text-muted-foreground flex-shrink-0">
                          <CupSoda size={20} />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm">{drink.name}</p>
                        <p className="text-muted-foreground text-xs">{formatPrice(drink.price)}</p>
                      </div>
                      <button onClick={() => addDrink(drink)}
                        className="px-3 py-1.5 border border-primary/40 text-primary text-xs tracking-widest uppercase font-semibold hover:bg-primary/10 transition-colors flex-shrink-0">
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={onClose}
                  className="w-full py-3 border border-border text-foreground text-xs tracking-widest uppercase font-semibold hover:border-primary hover:text-primary transition-colors">
                  Não, obrigado
                </button>
              </>
            )
          )}
        </motion.div>
      </motion.div>

      {showPhoto && item.img && (
        <ImageLightbox
          images={[{ src: item.img, alt: item.name }]}
          index={0}
          onClose={() => setShowPhoto(false)}
          onNavigate={() => {}}
        />
      )}
    </AnimatePresence>
  );
}
