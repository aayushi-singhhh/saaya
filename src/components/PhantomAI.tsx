import React, { useState, useEffect } from 'react';
import { MousePointer2, Target, CheckCircle, Circle, ArrowDown, ArrowRight, ArrowUp, ArrowLeft } from 'lucide-react';
import { translateText } from '../services/languageService';

interface PhantomStep {
  id: string;
  title: string;
  description: string;
  target: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    selector?: string;
  };
  action: 'click' | 'type' | 'scroll' | 'hover' | 'wait';
  value?: string;
  completed: boolean;
  pointer?: {
    direction: 'top' | 'bottom' | 'left' | 'right';
    offset?: { x: number; y: number };
  };
  highlight?: {
    color: string;
    pulse: boolean;
    size: 'small' | 'medium' | 'large';
  };
}

interface PhantomAIProps {
  isActive: boolean;
  currentApp: string;
  command: string;
  currentLanguage?: string;
  onStepComplete: (stepId: string) => void;
  onComplete: () => void;
}

export const PhantomAI: React.FC<PhantomAIProps> = ({
  isActive,
  currentApp,
  command,
  currentLanguage = 'en',
  onStepComplete,
  onComplete
}) => {
  const [steps, setSteps] = useState<PhantomStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate steps based on app and command
  useEffect(() => {
    if (isActive && command) {
      const generatedSteps = generatePhantomSteps(currentApp, command);
      setSteps(generatedSteps);
      setCurrentStep(0);
      setIsPlaying(true);
    }
  }, [isActive, currentApp, command]);

  const generatePhantomSteps = (app: string, cmd: string): PhantomStep[] => {
    const command = cmd.toLowerCase();
    
    if (app === 'Gmail' && command.includes('compose')) {
      return [
        {
          id: 'step1',
          title: translateText('Click Compose Button', currentLanguage),
          description: translateText('Look on the LEFT side of your Gmail screen. You\'ll see a button that says "Compose" with a pencil icon or "+" sign. It\'s usually red or blue.', currentLanguage),
          target: { x: 32, y: 140, width: 120, height: 56 },
          action: 'click',
          completed: false,
          pointer: { direction: 'left', offset: { x: -80, y: 0 } },
          highlight: { color: 'blue', pulse: true, size: 'large' }
        },
        {
          id: 'step2',
          title: translateText('Enter Recipient Email', currentLanguage),
          description: translateText('Click in the "To" field and type the recipient\'s email address', currentLanguage),
          target: { x: 120, y: 180, width: 400, height: 40 },
          action: 'type',
          value: 'recipient@example.com',
          completed: false,
          pointer: { direction: 'top', offset: { x: 0, y: -50 } },
          highlight: { color: 'green', pulse: true, size: 'medium' }
        },
        {
          id: 'step3',
          title: translateText('Add Email Subject', currentLanguage),
          description: translateText('Click in the subject field and enter what your email is about', currentLanguage),
          target: { x: 120, y: 230, width: 400, height: 40 },
          action: 'type',
          value: 'Important: Please Review',
          completed: false,
          pointer: { direction: 'top', offset: { x: 0, y: -50 } },
          highlight: { color: 'yellow', pulse: true, size: 'medium' }
        },
        {
          id: 'step4',
          title: translateText('Write Your Message', currentLanguage),
          description: translateText('Click in the large text area and type your email message', currentLanguage),
          target: { x: 120, y: 300, width: 600, height: 200 },
          action: 'type',
          value: 'Dear recipient,\n\nThis is your message content...\n\nBest regards',
          completed: false,
          pointer: { direction: 'left', offset: { x: -80, y: -50 } },
          highlight: { color: 'purple', pulse: true, size: 'large' }
        },
        {
          id: 'step5',
          title: translateText('Send the Email', currentLanguage),
          description: translateText('Look for the "Send" button (usually blue) and click it', currentLanguage),
          target: { x: 120, y: 520, width: 80, height: 40 },
          action: 'click',
          completed: false,
          pointer: { direction: 'bottom', offset: { x: 0, y: 60 } },
          highlight: { color: 'green', pulse: true, size: 'large' }
        }
      ];
    }
    
    if (app === 'Google Docs' && command.includes('document')) {
      return [
        {
          id: 'step1',
          title: 'Create New Document',
          description: 'Click on the "+" button or "Blank" template to start',
          target: { x: 200, y: 180, width: 160, height: 200 },
          action: 'click',
          completed: false,
          pointer: { direction: 'top', offset: { x: 0, y: -60 } },
          highlight: { color: 'blue', pulse: true, size: 'large' }
        },
        {
          id: 'step2',
          title: 'Add Document Title',
          description: 'Click at the top where it says "Untitled document" and give it a name',
          target: { x: 200, y: 120, width: 300, height: 50 },
          action: 'type',
          value: 'My New Document',
          completed: false,
          pointer: { direction: 'top', offset: { x: 0, y: -60 } },
          highlight: { color: 'yellow', pulse: true, size: 'medium' }
        },
        {
          id: 'step3',
          title: 'Start Writing',
          description: 'Click in the white writing area and start typing your content',
          target: { x: 150, y: 280, width: 500, height: 300 },
          action: 'type',
          value: 'Start typing your document content here...',
          completed: false,
          pointer: { direction: 'left', offset: { x: -80, y: 0 } },
          highlight: { color: 'green', pulse: true, size: 'large' }
        }
      ];
    }

    // Generic steps for unknown commands
    return [
      {
        id: 'step1',
        title: 'Look at the Screen',
        description: 'The AI is analyzing what you can do on this screen',
        target: { x: 400, y: 300, width: 200, height: 100 },
        action: 'wait',
        completed: false,
        pointer: { direction: 'top', offset: { x: 0, y: -60 } },
        highlight: { color: 'blue', pulse: true, size: 'medium' }
      }
    ];
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);
      onStepComplete(updatedSteps[currentStep].id);

      if (currentStep + 1 < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsPlaying(false);
        onComplete();
      }
    }
  };

  const skipStep = () => {
    if (currentStep + 1 < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsPlaying(false);
      onComplete();
    }
  };

  if (!isActive || !isPlaying || steps.length === 0) {
    return null;
  }

  const current = steps[currentStep];
  const getArrowIcon = (direction: string) => {
    switch (direction) {
      case 'top': return ArrowUp;
      case 'bottom': return ArrowDown;
      case 'left': return ArrowLeft;
      case 'right': return ArrowRight;
      default: return ArrowDown;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" />
      
      {/* Extra large pulsing circle for elderly users */}
      <div
        className="absolute border-8 border-red-400 rounded-full pointer-events-none animate-ping"
        style={{
          left: current.target.x + (current.target.width || 200) / 2 - 40,
          top: current.target.y + (current.target.height || 40) / 2 - 40,
          width: 80,
          height: 80,
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)'
        }}
      />

      {/* Large highlight box around target */}
      <div
        className={`absolute border-4 rounded-xl pointer-events-none shadow-2xl ${
          current.highlight?.color === 'blue' ? 'border-blue-400 shadow-blue-400/50' :
          current.highlight?.color === 'green' ? 'border-green-400 shadow-green-400/50' :
          current.highlight?.color === 'yellow' ? 'border-yellow-400 shadow-yellow-400/50' :
          current.highlight?.color === 'purple' ? 'border-purple-400 shadow-purple-400/50' :
          'border-blue-400 shadow-blue-400/50'
        } ${current.highlight?.pulse ? 'animate-pulse' : ''}`}
        style={{
          left: current.target.x - 8,
          top: current.target.y - 8,
          width: (current.target.width || 200) + 16,
          height: (current.target.height || 40) + 16,
          boxShadow: `0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.2)`
        }}
      />

      {/* Large directional arrow pointing to the target */}
      {current.pointer && (
        <div
          className="absolute pointer-events-none z-60"
          style={{
            left: current.target.x + (current.target.width || 200) / 2 + (current.pointer.offset?.x || 0) - 24,
            top: current.target.y + (current.target.height || 40) / 2 + (current.pointer.offset?.y || 0) - 24
          }}
        >
          {React.createElement(getArrowIcon(current.pointer.direction), {
            className: `w-12 h-12 text-red-500 drop-shadow-2xl animate-bounce ${
              current.highlight?.color === 'blue' ? 'text-blue-400' :
              current.highlight?.color === 'green' ? 'text-green-400' :
              current.highlight?.color === 'yellow' ? 'text-yellow-400' :
              current.highlight?.color === 'purple' ? 'text-purple-400' :
              'text-blue-400'
            }`,
            style: { filter: 'drop-shadow(0 0 10px currentColor)' }
          })}
        </div>
      )}

      {/* Animated cursor pointer */}
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: current.target.x + (current.target.width || 200) / 2 - 16,
          top: current.target.y + (current.target.height || 40) / 2 - 16
        }}
      >
        <MousePointer2 className="w-8 h-8 text-white drop-shadow-2xl animate-pulse" 
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }} />
      </div>

      {/* Large instruction panel for elderly users */}
      <div
        className="absolute bg-gray-900/95 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/50 pointer-events-auto shadow-2xl"
        style={{
          left: Math.min(current.target.x + (current.target.width || 200) + 40, window.innerWidth - 450),
          top: Math.max(current.target.y - 20, 20),
          minWidth: 400,
          maxWidth: 450
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-bold text-lg">{currentStep + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl mb-2">{current.title}</h3>
            <p className="text-gray-200 text-base leading-relaxed">{current.description}</p>
          </div>
        </div>

        {/* Large action indicator */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-500/20 rounded-lg">
          <Target className="w-6 h-6 text-blue-400" />
          <span className="text-blue-300 font-semibold text-lg">
            {current.action === 'click' && translateText('👆 Click on the highlighted area', currentLanguage)}
            {current.action === 'type' && translateText('⌨️ Type in the highlighted field', currentLanguage)}
            {current.action === 'scroll' && '🖱️ Scroll in the highlighted area'}
            {current.action === 'hover' && '🖱️ Move mouse over the highlighted area'}
            {current.action === 'wait' && '⏳ Please wait a moment...'}
          </span>
        </div>

        {/* Large text preview for typing actions */}
        {current.action === 'type' && current.value && (
          <div className="bg-gray-800/80 rounded-lg p-4 mb-4 border border-gray-600">
            <p className="text-gray-300 text-sm mb-2 font-medium">💡 Suggested text to type:</p>
            <div className="bg-green-900/30 border border-green-500/30 rounded p-3">
              <p className="text-green-300 text-base font-mono leading-relaxed">"{current.value}"</p>
            </div>
            <p className="text-gray-400 text-sm mt-2">💡 You can type this or use your own text</p>
          </div>
        )}

        {/* Large control buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleStepComplete}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-base font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            {translateText('✅ I Did This Step', currentLanguage)}
          </button>
          <button
            onClick={skipStep}
            className="bg-gray-600 hover:bg-gray-700 text-white text-base font-semibold py-4 px-6 rounded-xl transition-all duration-200"
          >
            {translateText('Skip', currentLanguage)}
          </button>
        </div>

        {/* Large progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-4 h-4 rounded-full border-2 ${
                  step.completed
                    ? 'bg-green-500 border-green-400'
                    : index === currentStep
                    ? 'bg-blue-500 border-blue-400 animate-pulse'
                    : 'bg-gray-600 border-gray-500'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-300 text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Large progress indicator at top */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg rounded-xl p-4 pointer-events-auto shadow-2xl border border-blue-500/30">
        <div className="flex items-center gap-4 text-white">
          <Circle className="w-6 h-6 text-blue-400 animate-spin" />
          <div className="text-center">
            <div className="text-lg font-bold">Step {currentStep + 1} of {steps.length}</div>
            <div className="text-sm text-gray-300">{currentApp} Tutorial Active</div>
          </div>
          <div className="w-24 bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
