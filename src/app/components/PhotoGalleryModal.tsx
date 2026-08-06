import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UtensilsCrossed } from "lucide-react";
import { MENU_CATEGORIES } from "@/app/menu-data";
import { ImageLightbox } from "@/app/components/ImageLightbox";

// Só entram na galeria os pratos que já têm foto de verdade.
const GALLERY_CATEGORIES = MENU_CATEGORIES.map((c) => ({
  title: c.title,
  items: c.items.filter((item) => item.img),
})).filter((c) => c.items.length > 0);

const GALLERY_IMAGES = GALLERY_CATEGORIES.flatMap((c) => c.items).map((item) => ({
  src: item.img!,
  alt: item.name,
}));

export function PhotoGalleryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!open) return null;

  return (
    <>
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
            className="w-full sm:max-w-4xl bg-card border border-border sm:border-primary/20 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between p-6 md:p-8 pb-4 border-b border-border flex-shrink-0">
              <div>
                <p className="text-primary text-[10px] tracking-[0.4em] uppercase mb-1">Cardápio</p>
                <h3 className="text-foreground text-xl font-black" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  FOTOS DOS PRATOS
                </h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 pt-6 flex flex-col gap-10">
              {GALLERY_CATEGORIES.length === 0 && (
                <div className="flex flex-col items-center text-center gap-3 py-10 text-muted-foreground">
                  <UtensilsCrossed size={32} className="text-muted-foreground/40" />
                  <p className="text-sm">Ainda não temos fotos cadastradas.</p>
                </div>
              )}

              {GALLERY_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <p className="text-muted-foreground text-xs tracking-widest uppercase mb-4">{cat.title}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {cat.items.map((item) => {
                      const globalIndex = GALLERY_IMAGES.findIndex((g) => g.src === item.img);
                      return (
                        <button
                          key={item.name}
                          onClick={() => setLightboxIndex(globalIndex)}
                          className="photo-frame-bg aspect-square overflow-hidden rounded border border-border hover:border-primary/40 transition-colors"
                        >
                          <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={GALLERY_IMAGES}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
