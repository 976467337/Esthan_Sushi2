import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { src: string; alt: string };

// Visualizador full-screen genérico — usado tanto pela galeria de fotos do cardápio
// quanto pelo OrderModal (foto grande do prato ao pedir). Sempre mostra a imagem
// inteira (object-contain), nunca corta nada.
export function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, images.length, onClose, onNavigate]);

  const current = images[index];
  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white transition-colors z-10">
          <X size={28} />
        </button>

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}
            className="absolute left-2 sm:left-6 text-white/80 hover:text-white transition-colors z-10 p-2">
            <ChevronLeft size={32} />
          </button>
        )}

        <motion.img
          key={current.src}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          src={current.src}
          alt={current.alt}
          className="max-w-full max-h-full object-contain"
        />

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}
            className="absolute right-2 sm:right-6 text-white/80 hover:text-white transition-colors z-10 p-2">
            <ChevronRight size={32} />
          </button>
        )}

        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-widest uppercase text-center px-4">
          {current.alt}
          {images.length > 1 && <span className="block mt-1 text-white/50">{index + 1} / {images.length}</span>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
