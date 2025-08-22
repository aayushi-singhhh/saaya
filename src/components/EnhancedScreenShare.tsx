import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Square, AlertCircle, Play, StopCircle, Target, Mic, MicOff } from 'lucide-react';
import { RealTimeOverlay, useScreenAnnotations } from './RealTimeOverlay';
import { translateText } from '../services/languageService';
import UniversalScreenCapture, { elderlyPresets } from '../services/universalScreenCapture';
import type { ScreenCaptureOptions, ScreenAnalysis } from '../services/universalScreenCapture';

interface EnhancedScreenShareProps {
  onStreamUpdate?: (stream: MediaStream | null) => void;
  onDetectedApp?: (appName: string) => void;
  currentLanguage?: string;
  elderlyMode?: boolean;
  assistanceLevel?: 'minimal' | 'standard' | 'maximum';
}

export const EnhancedScreenShare: React.FC<EnhancedScreenShareProps> = ({
  onStreamUpdate,
  currentLanguage = 'en',
  elderlyMode = true
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenCapture, setScreenCapture] = useState<UniversalScreenCapture | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<ScreenAnalysis | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real-time overlay management
  const {
    annotations: overlayAnnotations,
    voiceOverlay,
    addAnnotation,
    clearAllAnnotations,
    showVoiceOverlay,
    pointTo,
    celebrateSuccess
  } = useScreenAnnotations();

  // Initialize screen capture service
  useEffect(() => {
    const initializeScreenCapture = () => {
      const capture = new UniversalScreenCapture();
      
      // Listen for screen analysis events
      capture.on('screenAnalyzed', (analysis: ScreenAnalysis) => {
        setLastAnalysis(analysis);
        console.log('Screen analyzed:', analysis);
      });

      // Listen for capture events
      capture.on('captureStarted', ({ stream }) => {
        console.log('Universal capture started with stream:', stream);
      });

      capture.on('error', ({ error }) => {
        console.error('Universal capture error:', error);
        setError(error.message || 'Screen capture failed');
      });

      setScreenCapture(capture);
    };

    initializeScreenCapture();

    return () => {
      if (screenCapture) {
        screenCapture.stopCapture();
      }
    };
  }, []);

  // Start screen sharing with UniversalScreenCapture
  const startScreenSharing = async () => {
    try {
      setError(null);
      console.log('Starting enhanced screen share...');
      
      if (!screenCapture) {
        throw new Error('Screen capture service not initialized');
      }

      // Configure options for elderly users
      const options: ScreenCaptureOptions = {
        ...elderlyPresets[currentLanguage === 'hi' ? 'hindiSpeaker' : 'standard'],
        elderlyMode,
        language: currentLanguage as 'hi' | 'en'
      };

      // Start universal screen capture
      const mediaStream = await screenCapture.startCapture(options);
      console.log('Got enhanced media stream:', mediaStream);
      
      // Set the stream
      setStream(mediaStream);
      setIsSharing(true);

      // Set video element immediately
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play failed:', e));
        console.log('Set video source');
      }

      // Call parent callback
      if (onStreamUpdate) {
        onStreamUpdate(mediaStream);
      }

      // Handle stream end
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Stream ended');
        stopScreenSharing();
      });

      console.log('Enhanced screen sharing started successfully');

    } catch (err) {
      console.error('Enhanced screen sharing failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to start enhanced screen sharing');
    }
  };

  // Stop screen sharing
  const stopScreenSharing = () => {
    console.log('Stopping enhanced screen share...');
    
    if (screenCapture) {
      screenCapture.stopCapture();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsSharing(false);
    clearAllAnnotations();
    setLastAnalysis(null);
    
    if (onStreamUpdate) {
      onStreamUpdate(null);
    }
    
    console.log('Enhanced screen sharing stopped');
  };

  // Voice controls
  const startListening = () => {
    setIsListening(true);
    console.log('Started listening for voice commands');
    // Demo: auto-trigger a command after 2 seconds
    setTimeout(() => {
      handleVoiceCommand('demo');
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
    console.log('Stopped listening');
  };

  // Add test annotation
  const addTestAnnotation = () => {
    console.log('Adding test annotation');
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 60 + 20;
    
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

  // Voice command simulation with enhanced analysis
  const handleVoiceCommand = async (command: string) => {
    console.log('Voice command:', command);
    setIsProcessing(true);
    
    try {
      // Show voice feedback
      showVoiceOverlay({
        text: currentLanguage === 'hi' 
          ? 'मैं आपकी स्क्रीन का विश्लेषण कर रहा हूँ...' 
          : 'I am analyzing your screen...',
        language: currentLanguage as 'hi' | 'en',
        isActive: true,
        autoSpeak: true,
        voice: 'instructional'
      });

      // If we have enhanced screen capture, perform analysis
      if (screenCapture && isSharing) {
        try {
          const analysis = await screenCapture.analyzeScreen();
          console.log('Screen analysis result:', analysis);
          
          if (analysis.elements.length > 0) {
            // Point to the first detected element
            const element = analysis.elements[0];
            const centerX = (element.bounds.x + element.bounds.width / 2) / (videoRef.current?.videoWidth || 1920) * 100;
            const centerY = (element.bounds.y + element.bounds.height / 2) / (videoRef.current?.videoHeight || 1080) * 100;
            
            screenCapture.pointToElement(element, currentLanguage === 'hi' 
              ? `यहाँ ${element.text || element.type} है` 
              : `Here is the ${element.text || element.type}`);
              
            // Also add overlay annotation at the calculated position
            pointTo(centerX, centerY, currentLanguage === 'hi' 
              ? `${element.text || element.type} यहाँ है` 
              : `${element.text || element.type} is here`);
          } else {
            // Generic pointing
            pointTo(50, 50, currentLanguage === 'hi' 
              ? 'यहाँ ध्यान दें' 
              : 'Focus here');
          }
        } catch (analysisError) {
          console.warn('Screen analysis failed, using fallback:', analysisError);
          // Fallback to simple pointing
          pointTo(50, 50, currentLanguage === 'hi' 
            ? 'यहाँ क्लिक करें' 
            : 'Click here');
        }
      } else {
        // Simple demo pointing
        pointTo(50, 50, currentLanguage === 'hi' 
          ? 'यहाँ क्लिक करें' 
          : 'Click here');
      }

      setTimeout(() => {
        setIsProcessing(false);
        celebrateSuccess(50, 30, currentLanguage === 'hi' 
          ? 'बहुत बढ़िया!' 
          : 'Great job!');
      }, 3000);
      
    } catch (error) {
      console.error('Voice command processing failed:', error);
      setIsProcessing(false);
      setError('Voice command processing failed');
    }
  };

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
      <div className="relative aspect-video bg-gray-900/50 min-h-[400px]">
        {/* Video Preview */}
        {isSharing && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain bg-black rounded-lg"
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              if (videoRef.current) {
                console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              }
            }}
            onPlay={() => console.log('Video started playing')}
            onError={(e) => console.error('Video error:', e)}
            onCanPlay={() => console.log('Video can play')}
          />
        )}

        {/* Enhanced debug info */}
        {isSharing && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-3 rounded-lg max-w-sm">
            <div className="space-y-1">
              <div>Sharing: <span className="text-green-400">{isSharing ? 'Active' : 'Inactive'}</span></div>
              <div>Stream: <span className="text-blue-400">{stream ? 'Available' : 'None'}</span></div>
              <div>Video: <span className="text-purple-400">{videoRef.current?.srcObject ? 'Set' : 'Not Set'}</span></div>
              {videoRef.current?.videoWidth && (
                <div>Resolution: <span className="text-yellow-400">{videoRef.current.videoWidth}×{videoRef.current.videoHeight}</span></div>
              )}
              {lastAnalysis && (
                <div>Analysis: <span className="text-cyan-400">{lastAnalysis.elements.length} elements</span></div>
              )}
            </div>
          </div>
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
