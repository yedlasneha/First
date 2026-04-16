export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-2 shadow-sm">
      <Skeleton className="w-full rounded-lg mb-2" style={{ aspectRatio: '1/0.85' }} />
      <Skeleton className="h-3 w-3/4 mb-1.5" />
      <Skeleton className="h-2.5 w-1/2 mb-2" />
      <Skeleton className="h-6 w-full rounded-lg" />
    </div>
  );
}

export function BannerSkeleton() {
  return <Skeleton className="w-full rounded-2xl h-36 sm:h-44 md:h-52 lg:h-60" />;
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <Skeleton className="h-5 w-1/3 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
