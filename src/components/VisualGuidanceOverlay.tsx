import React, { useState, useEffect } from 'react';
import { ArrowDown, Target, MessageCircle } from 'lucide-react';
import type { VisualGuide } from '../services/elderlyAssistant';

interface VisualGuidanceOverlayProps {
  guides: VisualGuide[];
  isActive: boolean;
  onGuideComplete?: (guideId: string) => void;
}

export const VisualGuidanceOverlay: React.FC<VisualGuidanceOverlayProps> = ({
  guides,
  isActive,
  onGuideComplete
}) => {
  const [activeGuides, setActiveGuides] = useState<VisualGuide[]>([]);

  useEffect(() => {
    if (isActive && guides.length > 0) {
      setActiveGuides(guides);
      
      // Auto-remove guides after their duration
      guides.forEach((guide, index) => {
        if (guide.duration) {
          setTimeout(() => {
            setActiveGuides(prev => prev.filter((_, i) => i !== index));
            if (onGuideComplete) {
              onGuideComplete(`guide-${index}`);
            }
          }, guide.duration);
        }
      });
    } else {
      setActiveGuides([]);
    }
  }, [guides, isActive, onGuideComplete]);

  if (!isActive || activeGuides.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {activeGuides.map((guide, index) => (
        <VisualGuideElement
          key={`guide-${index}`}
          guide={guide}
          index={index}
        />
      ))}
    </div>
  );
};

interface VisualGuideElementProps {
  guide: VisualGuide;
  index: number;
}

const VisualGuideElement: React.FC<VisualGuideElementProps> = ({ guide, index }) => {
  const getGuideElement = () => {
    const baseClasses = "absolute transition-all duration-500";
    const style = {
      left: `${guide.position.x}px`,
      top: `${guide.position.y}px`,
      color: guide.color || '#3B82F6'
    };

    switch (guide.type) {
      case 'highlight':
        return (
          <div
            className={`${baseClasses} border-4 rounded-lg pointer-events-none animate-pulse`}
            style={{
              ...style,
              borderColor: guide.color || '#3B82F6',
              width: '120px',
              height: '60px',
              transform: 'translate(-50%, -50%)'
            }}
          />
        );

      case 'arrow':
        return (
          <div
            className={`${baseClasses} pointer-events-none animate-bounce`}
            style={style}
          >
            <ArrowDown 
              className="w-8 h-8 drop-shadow-lg" 
              style={{ color: guide.color || '#EF4444' }}
            />
          </div>
        );

      case 'circle':
        return (
          <div
            className={`${baseClasses} pointer-events-none`}
            style={style}
          >
            <Target 
              className="w-12 h-12 animate-ping drop-shadow-lg" 
              style={{ color: guide.color || '#10B981' }}
            />
          </div>
        );

      case 'tooltip':
        return (
          <div
            className={`${baseClasses} pointer-events-none max-w-xs`}
            style={style}
          >
            <div className="bg-gray-900/95 text-white px-4 py-3 rounded-lg shadow-xl border border-gray-700">
              <div className="flex items-start space-x-2">
                <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                <p className="text-sm font-medium leading-relaxed">
                  {guide.text}
                </p>
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

      default:
        return null;
    }
  };

  return getGuideElement();
};

// Enhanced Tutorial Overlay with Visual Guidance Integration
interface EnhancedTutorialProps {
  isActive: boolean;
  currentInstruction?: {
    title: string;
    description: string;
    visualGuides: VisualGuide[];
    voiceInstruction: string;
    estimatedTime: number;
  };
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  currentStep: number;
  totalSteps: number;
  language: string;
}

export const EnhancedTutorialOverlay: React.FC<EnhancedTutorialProps> = ({
  isActive,
  currentInstruction,
  onNext,
  onPrevious,
  onClose,
  currentStep,
  totalSteps,
  language
}) => {
  const [showVisualGuides, setShowVisualGuides] = useState(true);

  if (!isActive || !currentInstruction) {
    return null;
  }

  const speakInstruction = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentInstruction.voiceInstruction);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.8; // Slower for elderly users
      utterance.pitch = 1;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Visual Guides */}
      <VisualGuidanceOverlay
        guides={currentInstruction.visualGuides}
        isActive={showVisualGuides}
        onGuideComplete={() => {}}
      />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

      {/* Enhanced Tutorial Card */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full mx-4">
        <div className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentStep}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{currentInstruction.title}</h3>
                <p className="text-blue-200 text-sm">
                  Step {currentStep} of {totalSteps} • ~{Math.ceil(currentInstruction.estimatedTime / 60)} min
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors duration-200 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instruction */}
          <div className="mb-6">
            <p className="text-white/90 text-base leading-relaxed">
              {currentInstruction.description}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>

            <div className="flex space-x-3">
              {/* Speak Button */}
              <button
                onClick={speakInstruction}
                className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-all duration-200"
                title="Read instruction aloud"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12h.01" />
                </svg>
              </button>

              {/* Toggle Visual Guides */}
              <button
                onClick={() => setShowVisualGuides(!showVisualGuides)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showVisualGuides 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-gray-600/20 text-gray-400'
                }`}
                title="Toggle visual guides"
              >
                <Target className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onNext}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
            >
              <span>
                {currentStep === totalSteps ? 'Complete' : 'Next'}
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
