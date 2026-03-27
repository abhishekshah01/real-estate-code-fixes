import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const Gallery = ({ images, title }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const prev = () => setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  const next = () => setCurrentIndex((currentIndex + 1) % images.length);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="gallery">
        {images.map((image, index) => (
          <div
            key={index}
            className="gallery-thumbnail"
            onClick={() => openLightbox(index)}
            data-testid={`gallery-thumb-${index}`}
          >
            <img src={image} alt={`${title} - ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setLightboxOpen(false)}
            data-testid="lightbox"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              className="absolute top-6 right-6 p-3 text-white/60 hover:text-white transition-colors z-10"
              data-testid="lightbox-close"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-6 p-3 text-white/60 hover:text-white transition-colors z-10"
              data-testid="lightbox-prev"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[85vh] mx-4">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                src={images[currentIndex]}
                alt={`${title} - ${currentIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
                data-testid="lightbox-image"
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-6 p-3 text-white/60 hover:text-white transition-colors z-10"
              data-testid="lightbox-next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-6 text-white/40 text-xs font-bold uppercase tracking-wider">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
