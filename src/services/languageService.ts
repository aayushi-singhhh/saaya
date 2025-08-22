// Simplified Language Service - English and Hindi only
export interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  rtl: boolean;
}

export const supportedLanguages: Record<string, LanguageSupport> = {
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechCode: 'en-US',
    rtl: false
  },
  'hi': {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    speechCode: 'hi-IN',
    rtl: false
  }
};

// Language detection patterns - English and Hindi only
const languagePatterns = {
  hi: [
    // Hindi patterns - Common words and tech terms
    'कैसे', 'कैसा', 'कहाँ', 'क्या', 'कौन', 'कब', 'क्यों', 'कितना',
    'मुझे', 'मैं', 'आप', 'हम', 'वे', 'यह', 'वह', 'है', 'हैं', 'था', 'थी',
    'ईमेल', 'संदेश', 'दस्तावेज़', 'फ़ाइल', 'फोटो', 'वीडियो',
    'भेजना', 'भेजें', 'बनाना', 'बनाएं', 'खोलना', 'खोलें', 'सहायता', 'मदद',
    'जीमेल', 'गूगल', 'फेसबुक', 'व्हाट्सएप', 'ट्विटर', 'इंस्टाग्राम',
    'कंप्यूटर', 'लैपटॉप', 'मोबाइल', 'फोन', 'स्क्रीन', 'कीबोर्ड', 'माउस',
    'लिखना', 'पढ़ना', 'देखना', 'सुनना', 'बोलना', 'समझना'
  ],
  en: [
    // English patterns for comparison
    'how', 'what', 'where', 'when', 'why', 'who', 'which',
    'me', 'you', 'he', 'she', 'we', 'they', 'this', 'that',
    'email', 'message', 'document', 'file', 'photo', 'video',
    'send', 'create', 'open', 'help', 'write', 'read',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'computer', 'laptop', 'mobile', 'phone', 'screen', 'keyboard', 'mouse'
  ]
};

// Simple language detection function
export function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};
  
  // Initialize scores
  for (const langCode of Object.keys(languagePatterns)) {
    scores[langCode] = 0;
  }
  
  // Count pattern matches
  for (const [langCode, patterns] of Object.entries(languagePatterns)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        scores[langCode] += 1;
      }
    }
  }
  
  // Find the language with the highest score
  let detectedLang = 'en'; // Default to English
  let maxScore = 0;
  
  for (const [langCode, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = langCode;
    }
  }
  
  // If no patterns matched, check for Hindi script (Devanagari)
  if (maxScore === 0 && /[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  
  return detectedLang;
}

// Comprehensive translations for UI elements - English to Hindi
export const translations: Record<string, string> = {
  // Voice Commands
  'Please start screen sharing first to use voice commands.': 'वॉयस कमांड का उपयोग करने के लिए पहले स्क्रीन शेयरिंग शुरू करें।',
  'Voice Commands': 'वॉयस कमांड',
  'Listening...': 'सुन रहा हूँ...',
  'Click to start listening': 'सुनना शुरू करने के लिए क्लिक करें',
  'Processing with AI...': 'AI के साथ प्रोसेसिंग...',
  
  // App Interface
  'Start Screen Share': 'स्क्रीन शेयर शुरू करें',
  'Stop Screen Share': 'स्क्रीन शेयर बंद करें',
  
  // Status Messages
  'Screen Active': 'स्क्रीन सक्रिय',
  'Screen Inactive': 'स्क्रीन निष्क्रिय',
  'Voice Ready': 'वॉयस तैयार',
  'Processing': 'प्रोसेसिंग',
  'Listening': 'सुन रहा हूँ',
  'AI Ready': 'AI तैयार',
  'Connected': 'जुड़ा हुआ',
  
  // Tutorial Actions
  'Click Compose Button': 'कंपोज़ बटन पर क्लिक करें',
  'Enter Recipient Email': 'प्राप्तकर्ता का ईमेल दर्ज करें',
  'Add Email Subject': 'ईमेल विषय जोड़ें',
  'Write Your Message': 'अपना संदेश लिखें',
  'Send the Email': 'ईमेल भेजें',
  
  // Navigation
  'Previous': 'पिछला',
  'Next': 'अगला',
  'Complete': 'पूरा करें',
  'Next Step': 'अगला चरण',
  
  // Error Messages
  'Sorry, I encountered an error processing your command. Please try again.': 'क्षमा करें, आपकी कमांड को प्रोसेस करने में त्रुटि हुई। कृपया फिर से कोशिश करें।',
  'Congratulations! You have completed all the steps.': 'बधाई हो! आपने सभी चरण पूरे कर लिए हैं।',
  
  // Example Commands
  'How to compose an email in Gmail': 'Gmail में ईमेल कैसे लिखें',
  'Show me how to create a Google document': 'Google दस्तावेज़ कैसे बनाएं',
  'How to delete a photo in gallery': 'गैलरी में फोटो कैसे डिलीट करें',
  'Help me send a message on Facebook': 'Facebook पर संदेश कैसे भेजें',
  'How to create a new folder': 'नया फोल्डर कैसे बनाएं',
  
  // Control Panel
  'Control Panel': 'कंट्रोल पैनल',
  'Screen': 'स्क्रीन',
  'Voice': 'वॉयस',
  'Steps': 'चरण',
  'Idle': 'निष्क्रिय',
  'Clear Tutorial': 'ट्यूटोरियल साफ़ करें',
  'Reset': 'रीसेट',
  'Tutorial Progress': 'ट्यूटोरियल प्रगति',
  
  // App Header
  'AI Screen Tutorial': 'AI स्क्रीन ट्यूटोरियल',
  'Powered by Gemini 2.0 Flash': 'Gemini 2.0 Flash द्वारा संचालित',
  'Tutorial Steps': 'ट्यूटोरियल चरण',
  
  // API Key Setup
  'Enter your Gemini API key to get started': 'शुरू करने के लिए अपनी Gemini API key दर्ज करें',
  'Gemini API Key': 'Gemini API Key',
  'Enter your API key...': 'अपनी API key दर्ज करें...',
  'Continue': 'जारी रखें',
  'Get your API key from': 'अपनी API key यहाँ से प्राप्त करें',
  
  // Screen Share
  'Screen Share Area': 'स्क्रीन शेयर क्षेत्र',
  'Share your screen to start receiving interactive tutorials and guidance': 'इंटरैक्टिव ट्यूटोरियल और मार्गदर्शन प्राप्त करने के लिए अपनी स्क्रीन साझा करें',
  'Start Screen Sharing': 'स्क्रीन शेयरिंग शुरू करें',
  'Screen Sharing Active': 'स्क्रीन शेयरिंग सक्रिय',
  'Stop sharing': 'शेयरिंग बंद करें',
  'Detected': 'पता चला',
  'Tutorial Step': 'ट्यूटोरियल चरण',
  
  // Automation Features (Phase 2)
  'Smart Assistance Available': 'स्मार्ट सहायता उपलब्ध',
  'I can help automate some steps to make this easier for you.': 'मैं आपके लिए कुछ चरणों को स्वचालित करने में मदद कर सकता हूँ।',
  'Help Me': 'मेरी मदद करें',
  'Teach Me': 'मुझे सिखाएं',
  'Maybe Later': 'शायद बाद में',
  'Automation feature coming soon! For now, I\'ll guide you step by step.': 'ऑटोमेशन सुविधा जल्द आ रही है! अभी के लिए, मैं आपको चरण दर चरण मार्गदर्शन दूंगा।',
  'Perfect! I\'ll guide you through each step carefully.': 'बहुत बढ़िया! मैं आपको हर चरण के लिए सावधानीपूर्वक मार्गदर्शन दूंगा।'
};

// Simple translation function
export function translateText(text: string, targetLanguage: string): string {
  if (targetLanguage === 'en' || targetLanguage !== 'hi') {
    return text;
  }
  
  // Handle dynamic step patterns
  const stepPattern = /^Step (\d+) of (\d+)$/;
  const stepMatch = text.match(stepPattern);
  if (stepMatch) {
    return `चरण ${stepMatch[1]} में से ${stepMatch[2]}`;
  }
  
  const stepInstructionPattern = /^Step (\d+): (.+)$/;
  const stepInstructionMatch = text.match(stepInstructionPattern);
  if (stepInstructionMatch) {
    const translatedInstruction = translations[stepInstructionMatch[2]] || stepInstructionMatch[2];
    return `चरण ${stepInstructionMatch[1]}: ${translatedInstruction}`;
  }
  
  // Return Hindi translation if available
  return translations[text] || text;
}

// Get language information from text
export function getLanguageFromText(text: string): LanguageSupport {
  const detectedCode = detectLanguage(text);
  return supportedLanguages[detectedCode] || supportedLanguages['en'];
}
