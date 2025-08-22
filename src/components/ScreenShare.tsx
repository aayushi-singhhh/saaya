import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Square, AlertCircle, Play, StopCircle } from 'lucide-react';
import { PhantomAI } from './PhantomAI';
import { translateText } from '../services/languageService';

interface ScreenShareProps {
  onStreamUpdate?: (stream: MediaStream | null) => void;
  onDetectedApp?: (appName: string) => void;
  currentStep?: string;
  tutorialActive?: boolean;
  currentCommand?: string;
  currentLanguage?: string;
  onPhantomComplete?: () => void;
}

export const ScreenShare: React.FC<ScreenShareProps> = ({
  onStreamUpdate,
  onDetectedApp,
  currentStep,
  tutorialActive,
  currentCommand,
  currentLanguage,
  onPhantomComplete
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedApp, setDetectedApp] = useState<string>('');
  const [showPhantom, setShowPhantom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // App detection patterns
  const appPatterns = {
    'Gmail': ['gmail.com', 'mail.google.com', 'inbox'],
    'Google Docs': ['docs.google.com', 'document'],
    'Google Sheets': ['sheets.google.com', 'spreadsheet'],
    'Slack': ['slack.com', 'app.slack.com'],
    'Zoom': ['zoom.us', 'zoom'],
    'Microsoft Teams': ['teams.microsoft.com', 'teams'],
    'Figma': ['figma.com', 'design'],
    'VS Code': ['Visual Studio Code', 'vscode']
  };

  const startScreenShare = async () => {
    try {
      setError(null);
      
      // Request screen share with specific constraints
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Set to true if you want audio
      });

      setStream(mediaStream);
      setIsSharing(true);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Notify parent component IMMEDIATELY
      console.log('ScreenShare: Calling onStreamUpdate with stream:', mediaStream);
      onStreamUpdate?.(mediaStream);

      // Start app detection
      startAppDetection();

      // Handle stream end
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (err) {
      console.error('Error starting screen share:', err);
      setError('Failed to start screen sharing. Please check permissions.');
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsSharing(false);
    setDetectedApp('');
    setError(null);
    onStreamUpdate?.(null);
  };

  const startAppDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      detectApplication();
    }, 2000); // Check every 2 seconds
  };

  const detectApplication = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simple text detection (in a real app, you'd use OCR or other methods)
    // For now, we'll simulate detection based on common patterns
    const currentUrl = window.location.href;
    let detected = '';

    // Check document title and URL patterns
    const title = document.title.toLowerCase();
    const url = currentUrl.toLowerCase();

    for (const [appName, patterns] of Object.entries(appPatterns)) {
      if (patterns.some(pattern => title.includes(pattern) || url.includes(pattern))) {
        detected = appName;
        break;
      }
    }

    // If no URL-based detection, try to detect from screen content
    // This is a simplified version - in production you'd use proper OCR
    if (!detected) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Simple color/pattern analysis could go here
        // For demo purposes, we'll analyze basic patterns
        const data = imageData.data;
        const hasBlueColors = data.some((_, i) => i % 4 === 2 && data[i] > 100); // Check for blue channel
        
        if (hasBlueColors && Math.random() > 0.7) {
          detected = 'Gmail';
        }
      } catch (e) {
        // Cross-origin restrictions might prevent this
        console.log('Cannot analyze screen content due to security restrictions');
      }
    }

    if (detected && detected !== detectedApp) {
      setDetectedApp(detected);
      onDetectedApp?.(detected);
      console.log(`Detected application: ${detected}`);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Trigger phantom AI when command is received
  useEffect(() => {
    if (currentCommand && detectedApp && isSharing) {
      setShowPhantom(true);
    }
  }, [currentCommand, detectedApp, isSharing]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video display */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${isSharing ? 'block' : 'hidden'}`}
        autoPlay
        muted
        playsInline
      />
      
      {/* Hidden canvas for app detection */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Placeholder when not sharing */}
      {!isSharing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <Monitor className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">
            {translateText('Screen Share Area', currentLanguage || 'en')}
          </h3>
          <p className="text-sm mb-6 text-center max-w-md">
            {translateText('Share your screen to start receiving interactive tutorials and guidance', currentLanguage || 'en')}
          </p>
          <button
            onClick={startScreenShare}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            {translateText('Start Screen Sharing', currentLanguage || 'en')}
          </button>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-500 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {/* Status overlay */}
      {isSharing && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-900/90 border border-green-500 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-200 text-sm font-medium">
            {translateText('Screen Sharing Active', currentLanguage || 'en')}
          </span>
          <button
            onClick={stopScreenShare}
            className="ml-2 p-1 hover:bg-green-800 rounded"
            title={translateText('Stop sharing', currentLanguage || 'en')}
          >
            <StopCircle className="w-4 h-4 text-green-300" />
          </button>
        </div>
      )}

      {/* Detected app overlay */}
      {isSharing && detectedApp && (
        <div className="absolute top-4 right-4 bg-blue-900/90 border border-blue-500 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Square className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-sm">
              {translateText('Detected', currentLanguage || 'en')}: <span className="font-medium">{detectedApp}</span>
            </span>
          </div>
        </div>
      )}

      {/* Tutorial step overlay */}
      {isSharing && tutorialActive && currentStep && (
        <div className="absolute bottom-4 left-4 right-4 bg-purple-900/90 border border-purple-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              ?
            </div>
            <div>
              <h4 className="text-purple-200 font-medium mb-1">
                {translateText('Tutorial Step', currentLanguage || 'en')}
              </h4>
              <p className="text-purple-100 text-sm">{currentStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Phantom AI Overlay */}
      <PhantomAI
        isActive={showPhantom && isSharing}
        currentApp={detectedApp}
        command={currentCommand || ''}
        currentLanguage={currentLanguage}
        onStepComplete={(stepId) => {
          console.log('Phantom step completed:', stepId);
        }}
        onComplete={() => {
          setShowPhantom(false);
          onPhantomComplete?.();
        }}
      />
    </div>
  );
};
