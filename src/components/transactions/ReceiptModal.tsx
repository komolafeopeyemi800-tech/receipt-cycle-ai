import { useRef, useState, useCallback, useEffect } from "react";

interface ReceiptModalProps {
  src: string;
  fileName: string | null;
  onClose: () => void;
}

const ReceiptModal = ({ src, fileName, onClose }: ReceiptModalProps) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translateStart, setTranslateStart] = useState({ x: 0, y: 0 });

  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTranslateStart(translate);
    }
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      e.preventDefault();
      const newDist = getDistance(e.touches);
      const newScale = Math.min(Math.max(initialScale * (newDist / initialDistance), 1), 5);
      setScale(newScale);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setTranslate({ x: translateStart.x + dx, y: translateStart.y + dy });
    }
  }, [initialDistance, initialScale, isDragging, dragStart, translateStart, scale]);

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    setIsDragging(false);
  }, []);

  // Double-tap to zoom
  const lastTap = useRef(0);
  const handleTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  }, [scale]);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const newScale = Math.min(Math.max(scale - e.deltaY * 0.002, 1), 5);
    setScale(newScale);
    if (newScale === 1) setTranslate({ x: 0, y: 0 });
  }, [scale]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
      >
        <i className="fas fa-times text-lg"></i>
      </button>

      {/* Zoom controls */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 5)); }}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <i className="fas fa-search-plus text-sm"></i>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); const s = Math.max(scale - 0.5, 1); setScale(s); if (s === 1) setTranslate({ x: 0, y: 0 }); }}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <i className="fas fa-search-minus text-sm"></i>
        </button>
        {scale > 1 && (
          <span className="text-white/70 text-xs font-medium ml-1">{Math.round(scale * 100)}%</span>
        )}
      </div>

      <div
        ref={imgRef}
        className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt="Receipt full view"
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          draggable={false}
          onClick={handleTap}
        />
      </div>

      {fileName && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full">
          {fileName}
        </div>
      )}
    </div>
  );
};

export default ReceiptModal;
