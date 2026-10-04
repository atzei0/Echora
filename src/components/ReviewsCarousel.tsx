import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, ThumbsUp, Plus } from 'lucide-react';
import { ReviewItem } from '../data/reviews';
import { useLanguage } from '../context/LanguageContext';

interface ReviewsCarouselProps {
  reviews: ReviewItem[];
  onLike?: (id: string) => void;
  onOpenReviewModal?: () => void;
  showAddButton?: boolean;
}

export const ReviewsCarousel: React.FC<ReviewsCarouselProps> = ({
  reviews,
  onLike,
  onOpenReviewModal,
  showAddButton = false,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const currentRev = reviews[currentIndex] || reviews[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with Title and Optional Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{isEn ? 'Student Reviews' : 'Recensioni Allievə'}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {isEn ? 'What people say about Francesca & Echora' : 'Dicono di Francesca ed Echora'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {isEn
              ? 'Discover experiences from singers who study with Francesca and practice with Echora'
              : 'Scopri le esperienze degli allievi e cantanti che hanno studiato con Francesca e che si allenano con Echora'}
          </p>
        </div>

        {showAddButton && onOpenReviewModal && (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Leave a Review' : 'Lascia una Recensione'}</span>
          </button>
        )}
      </div>

      {/* Main Centered Carousel Card */}
      <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-sky-400/30 hover:border-sky-400/60 rounded-3xl p-6 sm:p-10 shadow-2xl transition-all">
        {/* Decorative Quote Icon Background */}
        <Quote className="absolute top-6 right-6 w-16 h-16 sm:w-20 sm:h-20 text-sky-500/10 pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Card Top Row: Author, Rating, Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-blue-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-base">
                  {currentRev.author.charAt(0)}
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base sm:text-lg">{currentRev.author}</h4>
                <div className="flex items-center space-x-1 text-amber-400 mt-0.5">
                  {[...Array(currentRev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-medium">
                    {isEn && currentRev.dateEn ? currentRev.dateEn : currentRev.date}
                  </span>
                </div>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-xs font-bold text-sky-300">
              {isEn && currentRev.tagEn ? currentRev.tagEn : currentRev.tag}
            </span>
          </div>

          {/* Comment Body */}
          <div className="min-h-[140px] flex items-center">
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic relative pl-4 border-l-2 border-sky-400/60 whitespace-pre-line">
              "{isEn && currentRev.commentEn ? currentRev.commentEn : currentRev.comment}"
            </p>
          </div>

          {/* Card Footer: Navigation Controls & Likes */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 flex-wrap gap-3">
            {/* Arrows & Counter */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title={isEn ? 'Previous review' : 'Recensione precedente'}
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-xs font-bold text-slate-400">
                {currentIndex + 1} / {reviews.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                title={isEn ? 'Next review' : 'Recensione successiva'}
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Like Counter */}
            {onLike && (
              <button
                type="button"
                onClick={() => onLike(currentRev.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer text-xs font-medium"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-sky-400" />
                <span>{isEn ? 'Helpful' : 'Utile'} ({currentRev.likes})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center space-x-2 pt-1">
        {reviews.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === currentIndex ? 'w-8 bg-sky-400 shadow-md shadow-sky-400/50' : 'w-2 bg-slate-700 hover:bg-slate-500'
            }`}
            aria-label={`Go to review ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
