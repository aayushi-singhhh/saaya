import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Square, AlertCircle, Play, StopCircle, Target, Volume2, Mic, MicOff } from 'lucide-react';
import EnhancedScreenSharingManager from '../services/enhancedScreenSharing';
import { RealTimeOverlay, useScreenAnnotations } from './RealTimeOverlay';
import type { ScreenSharingSession, AnnotationOverlay, VoiceInstruction } from '../services/enhancedScreenSharing';
import { translateText } from '../services/languageService';

interface EnhancedScreenShareProps {
  onStreamUpdate?: (stream: MediaStream | null) => void;
  onDetectedApp?: (appName: string) => void;
  currentLanguage?: string;
  elderlyMode?: boolean;
  assistanceLevel?: 'minimal' | 'standard' | 'maximum';
}

export const EnhancedScreenShare: React.FC<EnhancedScreenShareProps> = ({
  onStreamUpdate,
  onDetectedApp,
  currentLanguage = 'en',
  elderlyMode = true,
  assistanceLevel = 'standard'
}) => {
  const [session, setSession] = useState<ScreenSharingSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<VoiceInstruction | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationOverlay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const managerRef = useRef<EnhancedScreenSharingManager | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real-time overlay management
  const {
    annotations: overlayAnnotations,
    voiceOverlay,
    addAnnotation,
    clearAllAnnotations,
    showVoiceOverlay,
    hideVoiceOverlay,
    pointTo,
    highlightArea,
    celebrateSuccess
  } = useScreenAnnotations();

  // Initialize Enhanced Screen Sharing Manager
  useEffect(() => {
    managerRef.current = new EnhancedScreenSharingManager();
    
    // Set up event listeners
    const manager = managerRef.current;
    
    manager.on('screenSharingStarted', (newSession: ScreenSharingSession) => {
      setSession(newSession);
      if (onStreamUpdate && newSession.stream) {
        onStreamUpdate(newSession.stream);
        
        // Display stream in video element
        if (videoRef.current && newSession.stream) {
          videoRef.current.srcObject = newSession.stream;
        }
      }
    });

    manager.on('annotationAdded', (annotation: AnnotationOverlay) => {
      setAnnotations(prev => [...prev, annotation]);
    });

    manager.on('annotationRemoved', (annotationId: string) => {
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    });

    manager.on('annotationsCleared', () => {
      setAnnotations([]);
    });

    manager.on('instructionSpoken', (instruction: VoiceInstruction) => {
      setCurrentInstruction(instruction);
    });

    manager.on('voiceCommand', ({ transcript, language }) => {
      handleVoiceCommand(transcript, language);
    });

    manager.on('listeningStarted', () => {
      setIsListening(true);
    });

    manager.on('listeningStopped', () => {
      setIsListening(false);
    });

    manager.on('error', ({ error: err }) => {
      setError(err.message);
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.stopScreenSharing();
      }
    };
  }, []);

  // Start enhanced screen sharing
  const startScreenSharing = async () => {
    try {
      setError(null);
      if (managerRef.current) {
        await managerRef.current.startScreenSharing({
          language: currentLanguage as 'hi' | 'en',
          elderlyMode,
          assistanceLevel
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start screen sharing');
    }
  };

  // Stop enhanced screen sharing
  const stopScreenSharing = async () => {
    try {
      if (managerRef.current) {
        await managerRef.current.stopScreenSharing();
        setSession(null);
        setAnnotations([]);
        setCurrentInstruction(null);
        clearAllAnnotations();
        if (onStreamUpdate) {
          onStreamUpdate(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop screen sharing');
    }
  };

  // Start voice listening
  const startListening = () => {
    if (managerRef.current) {
      managerRef.current.startListening();
    }
  };

  // Stop voice listening
  const stopListening = () => {
    if (managerRef.current) {
      managerRef.current.stopListening();
    }
  };

  // Handle voice commands for elderly users
  const handleVoiceCommand = async (transcript: string, language: string) => {
    setIsProcessing(true);
    
    try {
      // Map common elderly voice commands to actions
      const elderlyCommandMappings = {
        hi: [
          { patterns: ['ईमेल', 'मेल', 'जीमेल'], action: 'open_gmail', coords: { x: 20, y: 20 } },
          { patterns: ['फोटो', 'तस्वीर', 'गैलरी'], action: 'open_photos', coords: { x: 40, y: 30 } },
          { patterns: ['व्हाट्सएप', 'मैसेज'], action: 'open_whatsapp', coords: { x: 60, y: 40 } },
          { patterns: ['यूट्यूब', 'वीडियो'], action: 'open_youtube', coords: { x: 80, y: 50 } },
          { patterns: ['रील', 'शॉर्ट'], action: 'create_reel', coords: { x: 50, y: 60 } }
        ],
        en: [
          { patterns: ['email', 'mail', 'gmail'], action: 'open_gmail', coords: { x: 20, y: 20 } },
          { patterns: ['photo', 'picture', 'gallery'], action: 'open_photos', coords: { x: 40, y: 30 } },
          { patterns: ['whatsapp', 'message'], action: 'open_whatsapp', coords: { x: 60, y: 40 } },
          { patterns: ['youtube', 'video'], action: 'open_youtube', coords: { x: 80, y: 50 } },
          { patterns: ['reel', 'short'], action: 'create_reel', coords: { x: 50, y: 60 } }
        ]
      };

      const commands = elderlyCommandMappings[language as 'hi' | 'en'] || elderlyCommandMappings.en;
      const lowerTranscript = transcript.toLowerCase();
      
      for (const command of commands) {
        if (command.patterns.some(pattern => lowerTranscript.includes(pattern))) {
          await executeElderlyCommand(command.action, command.coords, language as 'hi' | 'en');
          break;
        }
      }
    } catch (err) {
      console.error('Error processing voice command:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute elderly-friendly commands with visual guidance
  const executeElderlyCommand = async (
    action: string, 
    coords: { x: number; y: number }, 
    language: 'hi' | 'en'
  ) => {
    // Clear previous annotations
    clearAllAnnotations();

    // Show voice guidance
    const instructionTexts = {
      open_gmail: {
        hi: 'मैं आपको जीमेल खोलने में मदद करूँगा। कृपया इस तीर का पालन करें।',
        en: 'I will help you open Gmail. Please follow this arrow.'
      },
      open_photos: {
        hi: 'आइए फोटो गैलरी खोलते हैं। मैं आपको दिखाता हूँ कि कहाँ क्लिक करना है।',
        en: 'Let\'s open the photo gallery. I\'ll show you where to click.'
      },
      open_whatsapp: {
        hi: 'व्हाट्सएप खोलने के लिए यहाँ क्लिक करें।',
        en: 'Click here to open WhatsApp.'
      },
      open_youtube: {
        hi: 'यूट्यूब देखने के लिए इस बटन पर क्लिक करें।',
        en: 'Click this button to watch YouTube.'
      },
      create_reel: {
        hi: 'रील बनाने के लिए पहले यहाँ क्लिक करें।',
        en: 'First click here to create a reel.'
      }
    };

    const instruction = instructionTexts[action as keyof typeof instructionTexts];
    if (instruction) {
      // Show voice overlay
      showVoiceOverlay({
        text: instruction[language],
        language,
        isActive: true,
        autoSpeak: true,
        voice: 'instructional'
      });

      // Point to the location with an arrow
      pointTo(coords.x, coords.y, instruction[language]);

      // Highlight the area around the target
      highlightArea(coords.x - 5, coords.y - 5, 10, 10);

      // After 5 seconds, show success message
      setTimeout(() => {
        celebrateSuccess(
          coords.x,
          coords.y - 20,
          language === 'hi' ? 'बहुत बढ़िया!' : 'Great job!'
        );
        
        // Hide voice overlay after success
        setTimeout(() => {
          hideVoiceOverlay();
        }, 2000);
      }, 5000);

      // Detect if app was opened (simplified detection)
      if (onDetectedApp) {
        const appNames = {
          open_gmail: 'Gmail',
          open_photos: 'Photos', 
          open_whatsapp: 'WhatsApp',
          open_youtube: 'YouTube',
          create_reel: 'Instagram'
        };
        onDetectedApp(appNames[action as keyof typeof appNames] || 'Unknown App');
      }
    }
  };

  // Add manual annotation (for testing/demo)
  const addTestAnnotation = () => {
    const x = Math.random() * 80 + 10; // 10-90% of screen
    const y = Math.random() * 60 + 20; // 20-80% of screen
    
    addAnnotation({
      type: 'circle',
      x, y,
      color: '#10B981',
      size: 'large',
      animation: 'pulse',
      duration: 8000,
      text: translateText('Click here for help', currentLanguage),
      isElderlyFriendly: true
    });
  };

  const isSharing = session?.isActive || false;

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {translateText('Enhanced Screen Share with AI Guidance', currentLanguage)}
              </h3>
              <p className="text-white/60 text-sm">
                {translateText('Real-time visual guidance and voice instructions', currentLanguage)}
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {isSharing && (
              <>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                  title={translateText(isListening ? 'Stop listening' : 'Start voice commands', currentLanguage)}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={addTestAnnotation}
                  className="p-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-all duration-200"
                  title={translateText('Add test annotation', currentLanguage)}
                >
                  <Target className="w-5 h-5" />
                </button>

                <button
                  onClick={clearAllAnnotations}
                  className="p-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl transition-all duration-200"
                  title={translateText('Clear all guidance', currentLanguage)}
                >
                  <Square className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screen Share Area */}
      <div className="relative aspect-video bg-gray-900/50">
        {/* Video Preview */}
        {isSharing && (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-full object-contain"
          />
        )}

        {/* Placeholder when not sharing */}
        {!isSharing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Monitor className="w-20 h-20 mb-6 opacity-50" />
            <h3 className="text-2xl font-medium mb-3">
              {translateText('Enhanced Screen Share', currentLanguage)}
            </h3>
            <p className="text-lg mb-8 text-center max-w-lg leading-relaxed">
              {translateText('Share your screen to receive real-time visual guidance and voice instructions in Hindi or English', currentLanguage)}
            </p>
            <button
              onClick={startScreenSharing}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 text-lg font-semibold"
            >
              <Play className="w-6 h-6" />
              {translateText('Start Enhanced Screen Sharing', currentLanguage)}
            </button>
            
            {elderlyMode && (
              <div className="mt-6 text-center">
                <p className="text-sm text-white/60 mb-2">
                  {translateText('Designed for elderly users with:', currentLanguage)}
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs text-white/80">
                  <span className="bg-green-500/20 px-3 py-1 rounded-full">
                    {translateText('Large Visual Guides', currentLanguage)}
                  </span>
                  <span className="bg-blue-500/20 px-3 py-1 rounded-full">
                    {translateText('Slow Speech', currentLanguage)}
                  </span>
                  <span className="bg-purple-500/20 px-3 py-1 rounded-full">
                    {translateText('Patient Instructions', currentLanguage)}
                  </span>
                  <span className="bg-orange-500/20 px-3 py-1 rounded-full">
                    {translateText('Hindi Support', currentLanguage)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <span className="text-red-200">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Status overlay */}
        {isSharing && (
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-900/90 border border-green-500 rounded-lg px-4 py-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-200 font-medium">
                {translateText('Screen Sharing Active', currentLanguage)}
              </span>
              <button
                onClick={stopScreenSharing}
                className="ml-2 p-1 hover:bg-green-800 rounded"
                title={translateText('Stop sharing', currentLanguage)}
              >
                <StopCircle className="w-5 h-5 text-green-300" />
              </button>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 bg-blue-900/90 border border-blue-500 rounded-lg px-4 py-2">
                <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-blue-200 text-sm">
                  {translateText('Listening for voice commands...', currentLanguage)}
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 bg-purple-900/90 border border-purple-500 rounded-lg px-4 py-2">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-purple-200 text-sm">
                  {translateText('Processing command...', currentLanguage)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Current instruction overlay */}
        {currentInstruction && isSharing && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-900/95 border border-gray-600 rounded-xl p-4 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <Volume2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-medium mb-2">
                    {translateText('AI Voice Guidance', currentLanguage)}
                  </h4>
                  <p className="text-white/90 leading-relaxed">
                    {currentInstruction.text}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
                    <span className={`px-2 py-1 rounded-full ${
                      currentInstruction.priority === 'high' 
                        ? 'bg-red-500/20 text-red-400'
                        : currentInstruction.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'  
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {currentInstruction.priority} priority
                    </span>
                    {currentInstruction.emotion && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                        {currentInstruction.emotion}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annotation count indicator */}
        {annotations.length > 0 && isSharing && (
          <div className="absolute top-4 right-4 bg-blue-900/90 border border-blue-500 rounded-lg px-3 py-2">
            <span className="text-blue-200 text-sm">
              {annotations.length} {translateText('active guidance markers', currentLanguage)}
            </span>
          </div>
        )}

        {/* Real-time Annotation Overlay - KEY FEATURE for Approach A */}
        {isSharing && (
          <RealTimeOverlay
            annotations={overlayAnnotations}
            voiceOverlay={voiceOverlay || undefined}
            isFullScreen={true}
            elderlyMode={elderlyMode}
            language={currentLanguage as 'hi' | 'en'}
            onAnnotationClick={(annotation) => {
              console.log('Annotation clicked:', annotation);
              // Handle annotation interaction - could trigger next step
            }}
            onVoiceStart={() => console.log('Voice guidance started')}
            onVoiceEnd={() => console.log('Voice guidance ended')}
          />
        )}
      </div>
    </div>
  );
};
