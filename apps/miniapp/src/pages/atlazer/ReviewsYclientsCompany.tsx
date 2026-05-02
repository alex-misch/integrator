import {useEffect, useRef, useState} from 'react';
import {StarIcon} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {useMiniappsPublicControllerYclientsComments} from '@integrator/api-client/public';

type ReviewsYclientsCompanyProps = {
  slug: string;
  companyId: string;
};

export function ReviewsYclientsCompany({
  slug,
  companyId,
}: ReviewsYclientsCompanyProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const {data: comments = [], isLoading} =
    useMiniappsPublicControllerYclientsComments(slug, companyId, {
      query: {enabled: isVisible && !!(slug && companyId)},
    });

  useEffect(() => {
    const target = containerRef.current;
    if (!target) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {rootMargin: '160px 0px'},
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {isVisible && isLoading ? (
        <div className="flex flex-col gap-6">
          {Array.from({length: 2}).map((_, index) => (
            <div
              key={`yclients-review-skeleton-${index}`}
              className="flex gap-3"
            >
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length ? (
        comments.map(comment => (
          <div key={comment.id} className="mb-8">
            <div className="flex gap-3">
              {comment.author_avatar ? (
                <img
                  src={comment.author_avatar}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 bg-black rounded-full" />
              )}
              <div className="flex flex-col">
                <p>{comment.author || 'Клиент'}</p>
                <p className="flex opacity-40 items-center gap-1 text-sm font-bold">
                  <StarIcon className="w-3 h-3 fill-black" /> {comment.rating}
                </p>
              </div>
            </div>
            <p className="mt-2">{comment.text}</p>
          </div>
        ))
      ) : null}
    </div>
  );
}
