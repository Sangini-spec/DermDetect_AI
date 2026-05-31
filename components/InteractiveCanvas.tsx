import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { 
  Square, 
  MapPin, 
  RefreshCw, 
  Check, 
  Trash2, 
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

export interface BoxCoordinate {
  x1: number; // Percentages (0 to 100)
  y1: number;
  x2: number;
  y2: number;
}

export interface PinCoordinate {
  id: string;
  x: number; // Percentage (0 to 100)
  y: number;
  label: string;
}

export interface AnnotationData {
  boundingBox: BoxCoordinate | null;
  pins: PinCoordinate[];
  practitionerNotes: string;
}

interface InteractiveCanvasProps {
  imageSrc: string;
  onConfirm: (data: AnnotationData) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ 
  imageSrc, 
  onConfirm, 
  onCancel,
  isProcessing = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolMode, setToolMode] = useState<'box' | 'pin'>('box');
  const [boundingBox, setBoundingBox] = useState<BoxCoordinate | null>(null);
  const [pins, setPins] = useState<PinCoordinate[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);
  const [pinText, setPinText] = useState('');
  const [activePinCoords, setActivePinCoords] = useState<{ x: number, y: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [showHelp, setShowHelp] = useState(true);

  // Clear annotations helper
  const handleReset = () => {
    setBoundingBox(null);
    setPins([]);
    setNotes('');
    setActivePinCoords(null);
    setPinText('');
  };

  // Convert client coordinates relative to container to parent percentage coordinates
  const getPercentageCoords = (clientX: number, clientY: number): { x: number, y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    // Bound between 0 and 100
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  // Mouse Handlers for Container
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if (e.button !== 0) return; // Only left click

    // If there's an active pin input, enforce finishing or canceling it first
    if (activePinCoords) return;

    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return;

    if (toolMode === 'box') {
      setIsDrawing(true);
      setDragStart(coords);
      setDragCurrent(coords);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !dragStart || isProcessing) return;
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return;
    setDragCurrent(coords);
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if (toolMode === 'box' && isDrawing && dragStart && dragCurrent) {
      setIsDrawing(false);
      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const x2 = Math.max(dragStart.x, dragCurrent.x);
      const y2 = Math.max(dragStart.y, dragCurrent.y);

      // Require a minimum size
      if (Math.abs(x2 - x1) > 2 && Math.abs(y2 - y1) > 2) {
        setBoundingBox({ x1, y1, x2, y2 });
      }
      setDragStart(null);
      setDragCurrent(null);
    } else if (toolMode === 'pin' && !isDrawing) {
      // Create Pin at pointer coords
      const coords = getPercentageCoords(e.clientX, e.clientY);
      if (coords) {
        setActivePinCoords(coords);
      }
    }
  };

  const handleAddPinConfirm = () => {
    if (activePinCoords && pinText.trim()) {
      const newPin: PinCoordinate = {
        id: `pin_${Date.now()}`,
        x: activePinCoords.x,
        y: activePinCoords.y,
        label: pinText.trim()
      };
      setPins(prev => [...prev, newPin]);
      setActivePinCoords(null);
      setPinText('');
    }
  };

  const handleRemovePin = (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
  };

  const handleConfirmAnnotations = () => {
    onConfirm({
      boundingBox,
      pins,
      practitionerNotes: notes
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* Visual Header */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Interactive Lesion Tagging Workspace
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define boundaries and drop clinical points to focus neural vision checks.
          </p>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)} 
          className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors p-2"
          title="Toggle instructions help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 border-b border-indigo-100 dark:border-indigo-950/40 flex items-start gap-3 text-sm text-indigo-805 dark:text-indigo-300">
          <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Instructions:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li><strong>Target Tissue Box</strong>: Select the rectangle tool. Click & drag anywhere over the image to highlight the area of interest containing the lesion.</li>
              <li><strong>Anatomical Points (Pins)</strong>: Select the pinpoint marker. Click on distinct features (e.g. darker spots, suspicious margins) and attach clinical labels describing your concerns.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Workspace Canvas (Left Col - Span 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-mono uppercase tracking-wider">Lesion Capture View</p>
          
          <div className="relative select-none w-full max-w-lg aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            
            {/* Interactive Image Wrappers */}
            <div 
              ref={containerRef}
              className="relative w-full h-full align-middle cursor-crosshair flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img 
                src={imageSrc} 
                alt="Lesion to tag" 
                className="max-w-full max-h-full object-contain select-none pointer-events-none" 
              />

              {/* DRAWN BOUNDING BOX OVERLAY */}
              {boundingBox && (
                <div 
                  className="absolute border-2 border-indigo-500 bg-indigo-500/10 shadow-lg z-10 transition-colors duration-150 rounded-md"
                  style={{
                    left: `${boundingBox.x1}%`,
                    top: `${boundingBox.y1}%`,
                    width: `${boundingBox.x2 - boundingBox.x1}%`,
                    height: `${boundingBox.y2 - boundingBox.y1}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <Square className="h-2.5 w-2.5" /> ROI Target Area
                  </span>
                </div>
              )}

              {/* CURRENT DRAGGING BOX IN PROGRESS */}
              {isDrawing && dragStart && dragCurrent && (
                <div 
                  className="absolute border-2 border-dashed border-indigo-400 bg-indigo-500/5 z-10"
                  style={{
                    left: `${Math.min(dragStart.x, dragCurrent.x)}%`,
                    top: `${Math.min(dragStart.y, dragCurrent.y)}%`,
                    width: `${Math.abs(dragCurrent.x - dragStart.x)}%`,
                    height: `${Math.abs(dragCurrent.y - dragStart.y)}%`,
                  }}
                />
              )}

              {/* PLACED PINS OVERLAYS */}
              {pins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  <div className="bg-rose-500 text-white p-1 rounded-full border border-white flex items-center justify-center h-6 w-6 text-xs font-bold hover:scale-110 shadow-md cursor-pointer animate-pulse">
                    {index + 1}
                  </div>
                  {/* Tooltip on Hover */}
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-xs whitespace-nowrap shadow-xl z-30 font-medium">
                    {pin.label}
                  </div>
                </div>
              ))}

              {/* CURRENT PIN PLACING DIALOG TARGET */}
              {activePinCoords && (
                <div 
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 bg-slate-900/95 dark:bg-slate-900 border border-indigo-500 text-white p-3 rounded-lg shadow-2xl max-w-[200px]"
                  style={{ left: `${activePinCoords.x}%`, top: `${activePinCoords.y}%` }}
                >
                  <MapPin className="h-5 w-5 text-rose-500 animate-bounce" />
                  <p className="text-[10px] text-slate-350 text-center uppercase tracking-wide font-bold">New Point Marker</p>
                  <input 
                    type="text" 
                    placeholder="Describe condition details..." 
                    className="w-full text-xs bg-slate-800 focus:bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white rounded px-2 py-1 focus:outline-none"
                    value={pinText}
                    onChange={(e) => setPinText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddPinConfirm();
                      if (e.key === 'Escape') setActivePinCoords(null);
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1.5 w-full mt-1">
                    <button 
                      onClick={() => setActivePinCoords(null)} 
                      className="w-1/2 text-[9px] hover:bg-slate-800 text-slate-400 uppercase py-1 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddPinConfirm} 
                      disabled={!pinText.trim()}
                      className="w-1/2 text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white uppercase py-1 rounded disabled:opacity-50"
                    >
                      Save Point
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Tools Console Panel (Right Col - Span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest font-mono">Workspace Tools</h4>
            
            {/* Tool Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setToolMode('box'); 
                  setActivePinCoords(null);
                }}
                className={`py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 border text-sm transition-all duration-200
                  ${toolMode === 'box' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400 ring-2 ring-indigo-500/20' 
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Square className="h-4.5 w-4.5" />
                Target ROI Tool
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setToolMode('pin');
                  setIsDrawing(false);
                }}
                className={`py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 border text-sm transition-all duration-200
                  ${toolMode === 'pin' 
                    ? 'bg-rose-50 border-rose-300 text-rose-705 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 ring-2 ring-rose-500/20' 
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <MapPin className="h-4.5 w-4.5" />
                Diagnostic Tag Pin
              </button>
            </div>

            {/* Quick Status Info */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Target Area Set:</span>
                <span className={`font-bold uppercase ${boundingBox ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {boundingBox ? 'Annotated ✓' : 'Not Framed'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Active Focal Pins:</span>
                <span className={`font-bold ${pins.length > 0 ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {pins.length} Tagged Point{pins.length !== 1 && 's'}
                </span>
              </div>

              {/* Pins list layout */}
              {pins.length > 0 && (
                <div className="mt-2 text-xs space-y-1.5 max-h-32 overflow-y-auto pt-2 border-t border-slate-200 dark:border-slate-800">
                  {pins.map((pin, i) => (
                    <div key={pin.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 shadow-sm">
                      <span className="font-semibold text-slate-705 dark:text-slate-305 flex items-center gap-1.5 truncate">
                        <span className="bg-rose-500 text-white rounded-full flex items-center justify-center h-4.5 w-4.5 text-[9px] bold">{i + 1}</span>
                        <span className="truncate">{pin.label}</span>
                      </span>
                      <button 
                        onClick={() => handleRemovePin(pin.id)} 
                        className="text-slate-400 hover:text-rose-505 p-1 transition-colors"
                        title="Remove marker point"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General annotation notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest font-mono">Clinical Observations</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Attach custom comments (e.g., 'patient notes itchiness for about 3 weeks, margins are slightly dry and flaking')"
                rows={3}
                className="w-full text-sm bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Confirm & Cancel buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleConfirmAnnotations}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all"
            >
              Confirm Coordinates & Analyze Lesion
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="w-1/2 inline-flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Clear Tagging
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-1/2 inline-flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                Cancel / Change Image
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
