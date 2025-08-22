import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown, Target, MessageCircle, Hand, Eye, Volume2 } from 'lucide-react';

export interface OverlayAnnotation {
  id: string;
  type: 'arrow' | 'highlight' | 'circle' | 'tooltip' | 'pulse' | 'text' | 'hand';
  x: number; // Percentage of screen width (0-100)
  y: number; // Percentage of screen height (0-100)
  width?: number; // Percentage (for highlights)
  height?: number; // Percentage (for highlights)
  text?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  animation?: 'bounce' | 'pulse' | 'fade' | 'slide' | 'blink';
  duration?: number; // milliseconds, 0 = permanent until removed
  zIndex?: number;
  isElderlyFriendly?: boolean;
}

export interface VoiceOverlay {
  id: string;
  text: string;
  language: 'hi' | 'en';
  isActive: boolean;
  autoSpeak: boolean;
  voice?: 'encouraging' | 'patient' | 'celebratory' | 'instructional';
}

interface RealTimeOverlayProps {
  annotations: OverlayAnnotation[];
  voiceOverlay?: VoiceOverlay;
  isFullScreen?: boolean;
  onAnnotationClick?: (annotation: OverlayAnnotation) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  elderlyMode?: boolean;
  language?: 'hi' | 'en';
}

export const RealTimeOverlay: React.FC<RealTimeOverlayProps> = ({
  annotations,
  voiceOverlay,
  isFullScreen = false,
  onAnnotationClick,
  onVoiceStart,
  onVoiceEnd,
  elderlyMode = true,
  language = 'en'
}) => {
  const [activeAnnotations, setActiveAnnotations] = useState<OverlayAnnotation[]>([]);
  const [speechInstance, setSpeechInstance] = useState<SpeechSynthesisUtterance | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update active annotations
  useEffect(() => {
    setActiveAnnotations(annotations);

    // Handle annotation durations
    annotations.forEach((annotation) => {
      if (annotation.duration && annotation.duration > 0) {
        setTimeout(() => {
          setActiveAnnotations(prev => 
            prev.filter(a => a.id !== annotation.id)
          );
        }, annotation.duration);
      }
    });
  }, [annotations]);

  // Handle voice overlay
  useEffect(() => {
    if (voiceOverlay && voiceOverlay.isActive && voiceOverlay.autoSpeak) {
      speakText(voiceOverlay.text, voiceOverlay.language, voiceOverlay.voice);
    }

    return () => {
      if (speechInstance) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceOverlay]);

  const speakText = useCallback((
    text: string, 
    lang: 'hi' | 'en' = 'en', 
    voiceType: 'encouraging' | 'patient' | 'celebratory' | 'instructional' = 'instructional'
  ) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    
    // Elderly-friendly speech settings
    if (elderlyMode) {
      utterance.rate = 0.7; // Slower rate
      utterance.pitch = 1.1; // Slightly higher pitch for clarity
      utterance.volume = 0.9;
    } else {
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
    }

    // Adjust tone based on voice type
    switch (voiceType) {
      case 'encouraging':
        utterance.pitch = 1.2;
        utterance.rate = 0.8;
        break;
      case 'patient':
        utterance.rate = 0.6;
        utterance.pitch = 0.9;
        break;
      case 'celebratory':
        utterance.pitch = 1.3;
        utterance.rate = 0.9;
        break;
    }

    utterance.onstart = () => {
      setSpeechInstance(utterance);
      onVoiceStart?.();
    };

    utterance.onend = () => {
      setSpeechInstance(null);
      onVoiceEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [elderlyMode, onVoiceStart, onVoiceEnd]);

  const getAnnotationElement = (annotation: OverlayAnnotation) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${annotation.x}%`,
      top: `${annotation.y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: annotation.zIndex || 1000,
      pointerEvents: 'none'
    };

    const color = annotation.color || '#3B82F6';
    const sizeMap = {
      small: { width: 24, height: 24 },
      medium: { width: 32, height: 32 },
      large: { width: 48, height: 48 }
    };
    const size = sizeMap[annotation.size || 'medium'];

    const animationClass = {
      bounce: 'animate-bounce',
      pulse: 'animate-pulse',
      fade: 'animate-fade-in',
      slide: 'animate-slide-in',
      blink: 'animate-ping'
    }[annotation.animation || 'pulse'];

    switch (annotation.type) {
      case 'arrow':
        return (
          <div
            key={annotation.id}
            style={baseStyle}
            className={`${animationClass} drop-shadow-lg`}
            onClick={() => onAnnotationClick?.(annotation)}
          >
            <ArrowDown 
              style={{ 
                width: size.width, 
                height: size.height, 
                color,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
          </div>
        );

      case 'highlight':
        return (
          <div
            key={annotation.id}
            style={{
              ...baseStyle,
              width: `${annotation.width || 10}%`,
              height: `${annotation.height || 5}%`,
              border: `3px solid ${color}`,
              backgroundColor: `${color}20`,
              borderRadius: '8px'
            }}
            className={`${animationClass}`}
            onClick={() => onAnnotationClick?.(annotation)}
          />
        );

      case 'circle':
        return (
          <div
            key={annotation.id}
            style={baseStyle}
            className={`${animationClass}`}
            onClick={() => onAnnotationClick?.(annotation)}
          >
            <Target 
              style={{ 
                width: size.width, 
                height: size.height, 
                color,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
          </div>
        );

      case 'hand':
        return (
          <div
            key={annotation.id}
            style={baseStyle}
            className={`${animationClass}`}
            onClick={() => onAnnotationClick?.(annotation)}
          >
            <Hand 
              style={{ 
                width: size.width, 
                height: size.height, 
                color,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
          </div>
        );

      case 'tooltip':
        return (
          <div
            key={annotation.id}
            style={{
              ...baseStyle,
              pointerEvents: 'auto',
              maxWidth: elderlyMode ? '320px' : '280px'
            }}
            className={`${animationClass}`}
          >
            <div className="bg-gray-900/95 text-white px-4 py-3 rounded-lg shadow-xl border border-gray-700 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                <div className="flex-1">
                  <p className={`${elderlyMode ? 'text-base' : 'text-sm'} font-medium leading-relaxed`}>
                    {annotation.text}
                  </p>
                  {voiceOverlay && (
                    <button
                      onClick={() => speakText(annotation.text || '', language)}
                      className="mt-2 flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-xs">
                        {language === 'hi' ? 'सुनें' : 'Listen'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              {/* Tooltip arrow */}
              <div 
                className="absolute w-3 h-3 bg-gray-900 border-l border-b border-gray-700 transform rotate-45"
                style={{
                  bottom: '-6px',
                  left: '20px'
                }}
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div
            key={annotation.id}
            style={baseStyle}
            className={`${animationClass} text-center`}
          >
            <div 
              className="bg-yellow-400/90 text-gray-900 px-3 py-2 rounded-lg font-bold shadow-lg"
              style={{
                fontSize: elderlyMode ? '18px' : '14px'
              }}
            >
              {annotation.text}
            </div>
          </div>
        );

      case 'pulse':
        return (
          <div
            key={annotation.id}
            style={baseStyle}
            className="animate-ping"
            onClick={() => onAnnotationClick?.(annotation)}
          >
            <div 
              style={{
                width: size.width,
                height: size.height,
                backgroundColor: color,
                borderRadius: '50%',
                opacity: 0.75
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`${isFullScreen ? 'fixed inset-0' : 'absolute inset-0'} pointer-events-none z-50`}
      style={{ 
        backgroundColor: 'transparent',
        width: isFullScreen ? '100vw' : '100%',
        height: isFullScreen ? '100vh' : '100%'
      }}
    >
      {/* Voice Overlay Status */}
      {voiceOverlay && voiceOverlay.isActive && (
        <div className="fixed top-4 right-4 z-[60] pointer-events-auto">
          <div className="bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className={`${elderlyMode ? 'text-sm' : 'text-xs'} font-medium`}>
                {language === 'hi' ? 'AI गाइड सक्रिय' : 'AI Guide Active'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Render all active annotations */}
      {activeAnnotations.map(annotation => getAnnotationElement(annotation))}

      {/* Elderly Mode Indicator */}
      {elderlyMode && activeAnnotations.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[60] pointer-events-none">
          <div className="bg-green-600/80 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === 'hi' ? 'बुजुर्ग मोड' : 'Elderly Mode'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Screen Annotation Manager Hook
export const useScreenAnnotations = () => {
  const [annotations, setAnnotations] = useState<OverlayAnnotation[]>([]);
  const [voiceOverlay, setVoiceOverlay] = useState<VoiceOverlay | null>(null);

  const addAnnotation = useCallback((annotation: Omit<OverlayAnnotation, 'id'>) => {
    const newAnnotation: OverlayAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    return newAnnotation.id;
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAllAnnotations = useCallback(() => {
    setAnnotations([]);
  }, []);

  const showVoiceOverlay = useCallback((overlay: Omit<VoiceOverlay, 'id'>) => {
    setVoiceOverlay({
      ...overlay,
      id: `voice-${Date.now()}`
    });
  }, []);

  const hideVoiceOverlay = useCallback(() => {
    setVoiceOverlay(null);
  }, []);

  // Quick annotation helpers for common patterns
  const pointTo = useCallback((x: number, y: number, text?: string) => {
    const arrowId = addAnnotation({
      type: 'arrow',
      x, y,
      color: '#EF4444',
      size: 'large',
      animation: 'bounce',
      duration: 5000,
      isElderlyFriendly: true
    });

    if (text) {
      addAnnotation({
        type: 'tooltip',
        x: x + 10,
        y: y - 10,
        text,
        color: '#3B82F6',
        duration: 8000,
        isElderlyFriendly: true
      });
    }

    return arrowId;
  }, [addAnnotation]);

  const highlightArea = useCallback((x: number, y: number, width: number, height: number, text?: string) => {
    return addAnnotation({
      type: 'highlight',
      x, y, width, height,
      color: '#10B981',
      animation: 'pulse',
      duration: 6000,
      text,
      isElderlyFriendly: true
    });
  }, [addAnnotation]);

  const celebrateSuccess = useCallback((x: number, y: number, message: string) => {
    addAnnotation({
      type: 'text',
      x, y,
      text: message,
      color: '#F59E0B',
      size: 'large',
      animation: 'bounce',
      duration: 3000,
      isElderlyFriendly: true
    });
  }, [addAnnotation]);

  return {
    annotations,
    voiceOverlay,
    addAnnotation,
    removeAnnotation,
    clearAllAnnotations,
    showVoiceOverlay,
    hideVoiceOverlay,
    // Quick helpers
    pointTo,
    highlightArea,
    celebrateSuccess
  };
};
