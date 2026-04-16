import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerSkeleton } from './Skeleton';

export default function BannerSlider({ banners = [], loading = false }) {
  const [idx, setIdx] = useState(0);

  const next = useCallback(() => setIdx(i => (i + 1) % banners.length), [banners.length]);
  const prev = () => setIdx(i => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, banners.length]);

  if (loading) return <BannerSkeleton />;
  if (!banners.length) return null;

  const b = banners[idx];

  return (
    /* Taller banner: 16/5 on mobile → 16/4 on sm → 16/3.5 on md+ */
    <div className="relative w-full rounded-2xl overflow-hidden select-none
      h-48 sm:h-52 md:h-52 lg:h-60">
      <img
        key={idx}
        src={b.imageUrl || `https://picsum.photos/seed/banner${idx}/1200/400`}
        alt={b.title || 'Banner'}
        className="w-full h-full object-cover animate-fade-in"
        onError={e => { e.target.src = `https://picsum.photos/seed/banner${idx}/1200/400`; }}
      />

      {/* Gradient overlay */}
      {(b.title || b.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent flex flex-col justify-center px-4 sm:px-8 md:px-10">
          {b.tag && (
            <span className="inline-block bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 w-fit">
              {b.tag}
            </span>
          )}
          {b.title && (
            <h2 className="text-white font-black text-sm sm:text-xl md:text-2xl lg:text-3xl leading-tight drop-shadow-md max-w-xs sm:max-w-sm">
              {b.title}
            </h2>
          )}
          {b.subtitle && (
            <p className="text-white/85 text-[10px] sm:text-sm mt-1 drop-shadow max-w-xs">
              {b.subtitle}
            </p>
          )}
          {b.badges?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {(Array.isArray(b.badges) ? b.badges : []).map((badge, i) => (
                <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all">
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all">
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
