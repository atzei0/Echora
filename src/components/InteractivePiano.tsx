import React, { useState, useRef, useEffect } from 'react';
import { NoteNotation } from '../types';
import { getNoteInfo, playPianoNote } from '../utils/audioSynth';
import { ChevronLeft, ChevronRight, Volume2, ZoomIn, ZoomOut, MoveHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InteractivePianoProps {
  startOctave?: number;
  numOctaves?: number;
  highlightMidi?: number | null;
  activeScaleMidis?: number[];
  rangeStartMidi?: number | null;
  rangeEndMidi?: number | null;
  notation: NoteNotation;
  onNotePlay?: (midi: number) => void;
}

export const InteractivePiano: React.FC<InteractivePianoProps> = ({
  startOctave: initialStartOctave = 1,
  numOctaves = 6,
  highlightMidi = null,
  activeScaleMidis = [],
  rangeStartMidi = null,
  rangeEndMidi = null,
  notation,
  onNotePlay,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [octaveShift, setOctaveShift] = useState<number>(initialStartOctave);
  const [octaveCount, setOctaveCount] = useState<number>(Math.max(3, Math.min(6, numOctaves)));
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const totalMovedRef = useRef(0);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const startMidi = (octaveShift + 1) * 12; // e.g. Octave 1 -> MIDI 24 (C1), Octave 2 -> MIDI 36 (C2)
  const totalKeys = octaveCount * 12;

  // Base key widths at 100%
  const baseWhiteWidth = 44;
  const baseBlackWidth = 26;

  // Dynamically computed key widths based on zoomPercent
  const whiteKeyWidth = Math.max(18, Math.round(baseWhiteWidth * (zoomPercent / 100)));
  const blackKeyWidth = Math.max(11, Math.round(baseBlackWidth * (zoomPercent / 100)));

  // Auto fit all active octaves to container width
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const availableWidth = containerRef.current.clientWidth - 16;
    const totalWhite = octaveCount * 7;
    if (totalWhite <= 0) return;
    const optimalWhiteWidth = Math.floor(availableWidth / totalWhite);
    const calculatedPercent = Math.round((optimalWhiteWidth / baseWhiteWidth) * 100);
    setZoomPercent(Math.max(40, Math.min(160, calculatedPercent)));
  };

  // Auto-scroll to highlightMidi when note changes
  useEffect(() => {
    if (highlightMidi !== null && containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-midi="${highlightMidi}"]`) as HTMLElement;
      if (activeEl) {
        const container = containerRef.current;
        const elLeft = activeEl.offsetLeft;
        const elWidth = activeEl.offsetWidth;
        const containerWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;

        // If outside or close to edges, smoothly scroll into view
        if (elLeft < currentScroll + 40 || elLeft + elWidth > currentScroll + containerWidth - 40) {
          container.scrollTo({
            left: Math.max(0, elLeft - containerWidth / 2 + elWidth / 2),
            behavior: 'smooth',
          });
        }
      }
    }
  }, [highlightMidi]);

  // Handle Drag to Scroll
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.button !== 0) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    totalMovedRef.current = 0;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    totalMovedRef.current = 0;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const x = e.pageX;
      const walk = x - startXRef.current;
      totalMovedRef.current = Math.abs(walk);

      if (totalMovedRef.current > 4 && !isDraggingUI) {
        setIsDraggingUI(true);
      }
      containerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setTimeout(() => {
        setIsDraggingUI(false);
      }, 50);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !containerRef.current || e.touches.length === 0) return;
      const x = e.touches[0].pageX;
      const walk = x - startXRef.current;
      totalMovedRef.current = Math.abs(walk);

      if (totalMovedRef.current > 4 && !isDraggingUI) {
        setIsDraggingUI(true);
      }
      containerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleGlobalTouchEnd = () => {
      isDraggingRef.current = false;
      setTimeout(() => {
        setIsDraggingUI(false);
      }, 50);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDraggingUI]);

  // Convert vertical mouse wheel into horizontal scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleKeyClick = (midi: number) => {
    if (totalMovedRef.current > 6) {
      totalMovedRef.current = 0;
      return;
    }
    playPianoNote(midi, 0.9, 0.9);
    if (onNotePlay) {
      onNotePlay(midi);
    }
  };

  const handleScrollBy = (amount: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  // Generate array of keys to render
  const keys = Array.from({ length: totalKeys }, (_, i) => {
    const midi = startMidi + i;
    const noteInfo = getNoteInfo(midi);
    return {
      midi,
      ...noteInfo,
    };
  });

  const whiteKeys = keys.filter((k) => !k.isAccidental);

  // Key widths ensuring horizontal scrolling is always available & comfortable
  const whiteKeyWidthDesktop = 44;
  const blackKeyWidthDesktop = 26;

  return (
    <div className="bg-slate-900 border border-[#fa83b5]/80 rounded-2xl p-2.5 sm:p-4 shadow-xl select-none space-y-2">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-300 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fa83b5]" />
          <span className="font-bold text-slate-200 tracking-wider text-[10px] sm:text-xs">
            {isEn ? 'PIANO' : 'PIANOFORTE'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-700/80 ml-1">
            <MoveHorizontal className="w-3 h-3 text-sky-400 animate-pulse" />
            {isEn ? 'Drag to scroll' : 'Trascina per scorrere'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* Zoom Controls & Fit to screen */}
          <div className="flex items-center space-x-1 bg-slate-800/90 px-1.5 py-0.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[10px] sm:text-xs font-semibold">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoomPercent((prev) => Math.max(40, prev - 15))}
              className="p-1 hover:bg-slate-700 rounded text-pink-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={zoomPercent <= 40}
              title={isEn ? 'Zoom Out (Show more keys)' : 'Riduci Zoom (Mostra più tasti contemporaneamente)'}
            >
              <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="font-bold text-pink-300 px-0.5 text-[10px] sm:text-xs font-mono">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={() => setZoomPercent((prev) => Math.min(160, prev + 15))}
              className="p-1 hover:bg-slate-700 rounded text-pink-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={zoomPercent >= 160}
              title={isEn ? 'Zoom In' : 'Ingrandisci Zoom'}
            >
              <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="px-1.5 py-0.5 ml-1 bg-pink-950/70 hover:bg-pink-900 border border-pink-500/40 rounded text-pink-200 text-[9px] font-bold active:scale-95 cursor-pointer transition-colors"
              title={isEn ? 'Fit all octaves to screen width' : 'Adatta tutte le ottave allo schermo'}
            >
              {isEn ? 'Fit' : 'Adatta'}
            </button>
          </div>

          {/* Octave Count (Diminuisci / Aumenta Ottave) */}
          <div className="flex items-center space-x-1 bg-slate-800/90 px-1.5 py-0.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[10px] sm:text-xs">{isEn ? 'Octaves:' : 'Ottave:'}</span>
            <button
              type="button"
              onClick={() => setOctaveCount((prev) => Math.max(2, prev - 1))}
              className="p-1 hover:bg-slate-700 rounded text-sky-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={octaveCount <= 2}
              title={isEn ? 'Fewer Octaves' : 'Meno Ottave (-)'}
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="font-bold text-sky-300 px-1 text-[10px] sm:text-xs font-mono">
              {octaveCount}
            </span>
            <button
              type="button"
              onClick={() => setOctaveCount((prev) => Math.min(7, prev + 1))}
              className="p-1 hover:bg-slate-700 rounded text-sky-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={octaveCount >= 7}
              title={isEn ? 'More Octaves' : 'Più Ottave (+)'}
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Octave Shift Controls */}
          <div className="flex items-center space-x-1 bg-slate-800/90 px-1.5 py-0.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[10px] sm:text-xs">{isEn ? 'Range:' : 'Tonalità:'}</span>
            <button
              type="button"
              onClick={() => setOctaveShift((prev) => Math.max(0, prev - 1))}
              className="p-1 hover:bg-slate-700 rounded text-indigo-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={octaveShift <= 0}
              title={isEn ? 'Lower Octave' : 'Ottava più bassa'}
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="font-bold text-white px-0.5 sm:px-1 text-[10px] sm:text-xs font-mono">
              {getNoteInfo((octaveShift + 1) * 12).nameScientific}-{getNoteInfo((octaveShift + 1 + octaveCount) * 12 - 1).nameScientific}
            </span>
            <button
              type="button"
              onClick={() => setOctaveShift((prev) => Math.min(5, prev + 1))}
              className="p-1 hover:bg-slate-700 rounded text-indigo-300 disabled:opacity-40 active:scale-95 cursor-pointer"
              disabled={octaveShift >= 5}
              title={isEn ? 'Higher Octave' : 'Ottava più alta'}
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Fast Scroll Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => handleScrollBy(-160)}
              className="p-1 hover:bg-slate-800 rounded text-sky-300 active:scale-95 transition-all cursor-pointer"
              title={isEn ? 'Scroll Left' : 'Scorri a sinistra'}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollBy(160)}
              className="p-1 hover:bg-slate-800 rounded text-sky-300 active:scale-95 transition-all cursor-pointer"
              title={isEn ? 'Scroll Right' : 'Scorri a destra'}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Container with Mouse & Touch Drag Scroll */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        className={`relative flex justify-start h-32 sm:h-44 w-full bg-slate-950 rounded-xl p-1.5 sm:p-2 border border-slate-800 overflow-x-auto overflow-y-hidden shadow-inner select-none touch-pan-x transition-colors ${
          isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#ec4899 #0f172a',
        }}
      >
        <div className="relative flex h-full min-w-max">
          {whiteKeys.map((key) => {
            const isHighlighted = highlightMidi === key.midi;
            const isInScale = activeScaleMidis.includes(key.midi);
            const isInRange = rangeStartMidi !== null && rangeEndMidi !== null && key.midi >= rangeStartMidi && key.midi <= rangeEndMidi;
            const isRangeEdge = key.midi === rangeStartMidi || key.midi === rangeEndMidi;
            const noteName = notation === 'latin' ? key.nameLatin : key.nameScientific;

            return (
              <div
                key={key.midi}
                data-midi={key.midi}
                onClick={() => handleKeyClick(key.midi)}
                style={{
                  width: `${whiteKeyWidth}px`,
                  minWidth: `${whiteKeyWidth}px`,
                }}
                className={`relative flex flex-col justify-end items-center pb-1.5 sm:pb-2 border-r border-slate-300/40 rounded-b-md cursor-pointer transition-colors duration-75 shadow-sm active:scale-[0.98] shrink-0 h-full ${
                  isHighlighted
                    ? 'bg-gradient-to-b from-[#fbcfe8] via-[#fa83b5] to-[#f472b6] shadow-lg shadow-[#fa83b5]/60 scale-y-[0.98]'
                    : isRangeEdge
                    ? 'bg-gradient-to-b from-purple-300 via-indigo-400 to-indigo-600 text-white shadow-md font-black ring-2 ring-indigo-400'
                    : isInRange
                    ? 'bg-gradient-to-b from-purple-100 via-indigo-200 to-indigo-300 text-slate-900 font-bold border-indigo-400'
                    : isInScale
                    ? 'bg-gradient-to-b from-indigo-100 via-indigo-200 to-indigo-300'
                    : 'bg-gradient-to-b from-slate-100 via-white to-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* Visual Indicator for Scale / Range Note */}
                {isInScale && !isHighlighted && !isInRange && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 mb-2 animate-pulse"></span>
                )}
                {isInRange && (
                  <span className={`w-2 h-2 rounded-full mb-2 ${isRangeEdge ? 'bg-amber-300 animate-ping' : 'bg-purple-600'}`}></span>
                )}
                {isHighlighted && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-950 mb-2 animate-ping"></span>
                )}

                {/* Note Label */}
                <span className={`${whiteKeyWidth < 28 ? 'text-[8px]' : 'text-[10px] sm:text-xs'} font-bold ${isHighlighted || isRangeEdge ? 'text-slate-950 font-black' : isInRange ? 'text-indigo-950 font-bold' : 'text-slate-700'} leading-none`}>
                  {noteName}
                </span>
              </div>
            );
          })}

          {/* Render Overlay Black Keys */}
          {keys.map((key) => {
            if (!key.isAccidental) return null;

            // Calculate offset position relative to white keys
            const noteInOctave = ((key.midi % 12) + 12) % 12;
            const octaveOffset = Math.floor((key.midi - startMidi) / 12);
            
            let whiteIndexBefore = 0;
            if (noteInOctave === 1) whiteIndexBefore = 0; // C#
            else if (noteInOctave === 3) whiteIndexBefore = 1; // D#
            else if (noteInOctave === 6) whiteIndexBefore = 3; // F#
            else if (noteInOctave === 8) whiteIndexBefore = 4; // G#
            else if (noteInOctave === 10) whiteIndexBefore = 5; // A#

            const totalWhiteBefore = octaveOffset * 7 + whiteIndexBefore;
            
            const isHighlighted = highlightMidi === key.midi;
            const isInScale = activeScaleMidis.includes(key.midi);
            const isInRange = rangeStartMidi !== null && rangeEndMidi !== null && key.midi >= rangeStartMidi && key.midi <= rangeEndMidi;
            const isRangeEdge = key.midi === rangeStartMidi || key.midi === rangeEndMidi;
            const noteName = notation === 'latin' ? key.nameLatin : key.nameScientific;

            return (
              <div
                key={key.midi}
                data-midi={key.midi}
                onClick={(e) => {
                  e.stopPropagation();
                  handleKeyClick(key.midi);
                }}
                style={{
                  left: `calc((${totalWhiteBefore + 1} * ${whiteKeyWidth}px) - (${blackKeyWidth}px / 2))`,
                  width: `${blackKeyWidth}px`,
                }}
                className={`absolute top-0 z-10 rounded-b-md cursor-pointer transition-colors duration-75 flex flex-col justify-end items-center pb-1 text-[9px] font-bold h-[60%] border-x border-b border-slate-950 shadow-md ${
                  isHighlighted
                    ? 'bg-gradient-to-b from-[#fa83b5] to-[#db2777] text-white shadow-lg shadow-[#fa83b5]/60 scale-y-[0.97]'
                    : isRangeEdge
                    ? 'bg-gradient-to-b from-purple-500 to-indigo-800 text-amber-300 shadow-md font-black border border-purple-400'
                    : isInRange
                    ? 'bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-950 text-indigo-200 border border-purple-700/60'
                    : isInScale
                    ? 'bg-gradient-to-b from-indigo-700 to-indigo-900 text-indigo-100'
                    : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isInRange && (
                  <span className={`w-1.5 h-1.5 rounded-full mb-1 ${isRangeEdge ? 'bg-amber-300 animate-ping' : 'bg-purple-400'}`}></span>
                )}
                {isInScale && !isInRange && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mb-1"></span>
                )}
                {blackKeyWidth >= 18 && (
                  <span className="hidden sm:inline text-[8px] opacity-80 leading-none">{noteName}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
