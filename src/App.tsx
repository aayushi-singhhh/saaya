import { useState, useEffect } from 'react';
import { ScreenShare } from './components/ScreenShare';
import { VoiceCommand } from './components/VoiceCommand';
import { ControlPanel } from './components/ControlPanel';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatusBar } from './components/StatusBar';
import { Monitor, Brain, Circle } from 'lucide-react';

export interface TutorialStep {
  id: string;
  command: string;
  description: string;
  coordinates: { x: number; y: number };
  action: string;
  completed: boolean;
}

export interface AppState {
  isScreenSharing: boolean;
  isListening: boolean;
  isProcessing: boolean;
  currentCommand: string;
  tutorialSteps: TutorialStep[];
  currentStep: number;
  screenStream: MediaStream | null;
  selectedWindow?: string | null;
  isMonitoringContent?: boolean;
  contentMonitoringInterval?: number;
  currentWebsite?: string;
  detectedApplication?: string;
  currentLanguage?: string;
  detectedLanguageCode?: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    isScreenSharing: false,
    isListening: false,
    isProcessing: false,
    currentCommand: '',
    tutorialSteps: [],
    currentStep: 0,
    screenStream: null,
    currentLanguage: localStorage.getItem('preferred-language') || 'en',
    detectedLanguageCode: 'en'
  });

  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini-api-key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
      setShowApiKeyInput(false);
    }
  }, [apiKey]);

  // Persist language preference
  useEffect(() => {
    if (appState.currentLanguage) {
      localStorage.setItem('preferred-language', appState.currentLanguage);
    }
  }, [appState.currentLanguage]);

  const updateAppState = (updates: Partial<AppState>) => {
    console.log('App: Updating state with:', updates);
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      console.log('App: New state:', newState);
      return newState;
    });
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">AI Screen Tutorial</h1>
            <p className="text-white/70">Enter your Gemini API key to get started</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API key..."
              />
            </div>
            
            <button
              onClick={() => apiKey && setShowApiKeyInput(false)}
              disabled={!apiKey}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              Continue
            </button>
            
            <p className="text-white/60 text-sm text-center">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Screen Tutorial</h1>
                <p className="text-white/60 text-sm">Powered by Gemini 2.0 Flash</p>
              </div>
            </div>
            
            <StatusBar appState={appState} updateAppState={updateAppState} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Control Panel */}
        <ControlPanel 
          appState={appState} 
          updateAppState={updateAppState}
          apiKey={apiKey}
        />

        {/* Screen Share and Voice Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Screen Share Section */}
          <div className="lg:col-span-2">
            <ScreenShare 
              onStreamUpdate={(stream) => {
                console.log('Screen share stream update:', stream);
                updateAppState({ screenStream: stream, isScreenSharing: !!stream });
              }}
              onDetectedApp={(appName) => updateAppState({ detectedApplication: appName })}
              currentStep={
                appState.tutorialSteps.length > 0 && appState.currentStep < appState.tutorialSteps.length
                  ? appState.tutorialSteps[appState.currentStep]?.description
                  : undefined
              }
              tutorialActive={appState.tutorialSteps.length > 0}
              currentCommand={appState.currentCommand}
              currentLanguage={appState.currentLanguage}
              onPhantomComplete={() => {
                console.log('Phantom AI tutorial completed');
              }}
            />
          </div>

          {/* Voice Command Section */}
          <div className="space-y-6">
            <VoiceCommand 
              appState={appState} 
              updateAppState={updateAppState}
              apiKey={apiKey}
            />
            
            {/* Tutorial Steps */}
            {appState.tutorialSteps.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Tutorial Steps</h3>
                <div className="space-y-3">
                  {appState.tutorialSteps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                        index === appState.currentStep 
                          ? 'bg-blue-500/20 border border-blue-400/30' 
                          : 'bg-white/5'
                      } ${step.completed ? 'opacity-60' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : index === appState.currentStep
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/60'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{step.action}</p>
                        <p className="text-white/60 text-xs">{step.description}</p>
                      </div>
                      {index === appState.currentStep && (
                        <Circle className="w-4 h-4 text-blue-400 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tutorial Overlay */}
        {appState.isScreenSharing && appState.tutorialSteps.length > 0 && (
          <TutorialOverlay
            appState={appState}
            updateAppState={updateAppState}
          />
        )}
      </main>
    </div>
  );
}

export default App;