import React from 'react';
import { Wifi, Brain, Mic, Monitor, Globe } from 'lucide-react';
import type { AppState } from '../App';
import { supportedLanguages } from '../services/languageService';

interface StatusBarProps {
  appState: AppState;
  updateAppState?: (updates: Partial<AppState>) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ appState, updateAppState }) => {
  const getStatusColor = (isActive: boolean, isProcessing = false) => {
    if (isProcessing) return 'text-yellow-400';
    return isActive ? 'text-green-400' : 'text-gray-400';
  };

  const handleLanguageChange = (languageCode: string) => {
    if (updateAppState) {
      updateAppState({ currentLanguage: languageCode });
    }
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Language Selector */}
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-blue-400" />
        <select
          value={appState.currentLanguage || 'en'}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-white/10 border border-white/20 rounded text-white text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(supportedLanguages).map(([code, lang]) => (
            <option key={code} value={code} className="bg-gray-800 text-white">
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>

      {/* Screen Share Status */}
      <div className="flex items-center space-x-2">
        <Monitor className={`w-4 h-4 ${getStatusColor(appState.isScreenSharing)}`} />
        <span className={`text-sm ${getStatusColor(appState.isScreenSharing)}`}>
          {appState.isScreenSharing ? 'Screen Active' : 'Screen Inactive'}
        </span>
      </div>

      {/* Voice Status */}
      <div className="flex items-center space-x-2">
        <Mic className={`w-4 h-4 ${getStatusColor(appState.isListening, appState.isProcessing)}`} />
        <span className={`text-sm ${getStatusColor(appState.isListening, appState.isProcessing)}`}>
          {appState.isProcessing ? 'Processing' : appState.isListening ? 'Listening' : 'Voice Ready'}
        </span>
      </div>

      {/* AI Status */}
      <div className="flex items-center space-x-2">
        <Brain className={`w-4 h-4 ${getStatusColor(true)}`} />
        <span className="text-sm text-green-400">AI Ready</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <Wifi className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">Connected</span>
      </div>
    </div>
  );
};