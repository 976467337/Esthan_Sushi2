import { motion, AnimatePresence } from "motion/react";
import { X, Star } from "lucide-react";

type Review = { name: string; stars: number; text: string };

export function AllReviewsModal({ open, reviews, onClose }: { open: boolean; reviews: Review[]; onClose: () => void }) {
  if (!open) return null;

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
          className="w-full sm:max-w-3xl bg-card border border-border sm:border-primary/20 max-h-[90vh] flex flex-col"
        >
          <div className="flex items-start justify-between p-6 md:p-8 pb-4 border-b border-border flex-shrink-0">
            <div>
              <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-1">Clientes</p>
              <h3 className="text-foreground text-xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                TODOS OS DEPOIMENTOS
              </h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 md:p-8 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((r, idx) => (
                <div key={r.name + idx} className="border border-border p-5">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} size={13} className="text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 italic">"{r.text}"</p>
                  <p className="text-foreground text-xs tracking-widest uppercase font-semibold">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
