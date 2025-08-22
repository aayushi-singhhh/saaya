// Enhanced Screen Sharing + Real-time Annotation System
// Approach A: Full WebRTC + Overlay Implementation for Elderly Users

import { EventEmitter } from 'events';

// Type declarations for Speech APIs
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
  }
}

// WebRTC Screen Sharing with Annotation Support
export interface ScreenCoordinate {
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  timestamp: number;
}

export interface AnnotationOverlay {
  id: string;
  type: 'arrow' | 'highlight' | 'circle' | 'tooltip' | 'pulse';
  coordinates: ScreenCoordinate;
  text?: string;
  color: string;
  size: number;
  duration: number; // milliseconds
  zIndex: number;
  animation?: 'bounce' | 'pulse' | 'fade' | 'slide';
}

export interface VoiceInstruction {
  id: string;
  text: string;
  language: 'hi' | 'en';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  emotion?: 'encouraging' | 'patient' | 'celebratory' | 'cautious';
}

export interface ScreenSharingSession {
  sessionId: string;
  isActive: boolean;
  stream: MediaStream | null;
  annotations: AnnotationOverlay[];
  currentInstruction?: VoiceInstruction;
  elderlyMode: boolean;
  language: 'hi' | 'en';
  assistanceLevel: 'minimal' | 'standard' | 'maximum';
}

export class EnhancedScreenSharingManager extends EventEmitter {
  private session: ScreenSharingSession;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private overlayContainer: HTMLDivElement | null = null;
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition: SpeechRecognition | null = null;
  private annotationQueue: AnnotationOverlay[] = [];
  private isDrawing = false;

  constructor() {
    super();
    this.session = {
      sessionId: this.generateSessionId(),
      isActive: false,
      stream: null,
      annotations: [],
      elderlyMode: true,
      language: 'en',
      assistanceLevel: 'standard'
    };
    
    this.speechSynthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  /**
   * Start Enhanced Screen Sharing with Annotation Support
   */
  async startScreenSharing(
    options: {
      language?: 'hi' | 'en';
      elderlyMode?: boolean;
      assistanceLevel?: 'minimal' | 'standard' | 'maximum';
    } = {}
  ): Promise<MediaStream> {
    try {
      // Enhanced screen capture with higher quality for better annotation visibility
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false // We'll handle audio separately for voice instructions
      });

      this.session = {
        ...this.session,
        isActive: true,
        stream,
        language: options.language || 'en',
        elderlyMode: options.elderlyMode !== false,
        assistanceLevel: options.assistanceLevel || 'standard'
      };

      // Initialize annotation canvas overlay
      await this.initializeAnnotationOverlay();
      
      // Start voice instruction capability
      this.initializeVoiceInstructions();
      
      // Begin screen analysis for auto-detection
      this.startScreenAnalysis();

      this.emit('screenSharingStarted', this.session);
      
      // Welcome message for elderly users
      if (this.session.elderlyMode) {
        await this.speakInstruction({
          id: 'welcome',
          text: this.session.language === 'hi' 
            ? 'नमस्ते! मैं आपकी मदद करने के लिए तैयार हूँ। आप जो भी काम करना चाहते हैं, बस बताइए।'
            : 'Hello! I\'m ready to help you. Just tell me what you\'d like to do.',
          language: this.session.language,
          priority: 'medium',
          emotion: 'encouraging'
        });
      }

      return stream;

    } catch (error) {
      console.error('Enhanced screen sharing failed:', error);
      this.emit('error', { type: 'SCREEN_SHARING_FAILED', error });
      throw error;
    }
  }

  /**
   * Initialize floating annotation overlay that appears on top of all applications
   */
  private async initializeAnnotationOverlay(): Promise<void> {
    // Create full-screen overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'saaya-annotation-overlay';
    this.overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
      background: transparent;
    `;

    // Create annotation canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.screen.width;
    this.canvas.height = window.screen.height;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not initialize annotation canvas');
    }

    this.overlayContainer.appendChild(this.canvas);
    document.body.appendChild(this.overlayContainer);

    // Enable smooth animations for elderly users
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Add real-time annotation overlay (arrows, highlights, etc.)
   */
  async addAnnotation(annotation: Omit<AnnotationOverlay, 'id'>): Promise<string> {
    const fullAnnotation: AnnotationOverlay = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.session.annotations.push(fullAnnotation);
    this.annotationQueue.push(fullAnnotation);

    // Draw annotation immediately
    await this.drawAnnotation(fullAnnotation);

    // Auto-remove after duration (elderly users need more time)
    const adjustedDuration = this.session.elderlyMode 
      ? Math.max(annotation.duration, 5000) // Minimum 5 seconds for elderly
      : annotation.duration;

    setTimeout(() => {
      this.removeAnnotation(fullAnnotation.id);
    }, adjustedDuration);

    this.emit('annotationAdded', fullAnnotation);
    return fullAnnotation.id;
  }

  /**
   * Draw annotation on overlay canvas
   */
  private async drawAnnotation(annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx || !this.canvas) return;

    const { coordinates, type, color, size, text } = annotation;
    const { x, y } = this.normalizeCoordinates(coordinates);

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = this.session.elderlyMode ? Math.max(size, 4) : size; // Thicker lines for elderly
    this.ctx.font = this.session.elderlyMode ? 'bold 18px Arial' : 'bold 16px Arial';

    switch (type) {
      case 'arrow':
        await this.drawAnimatedArrow(x, y, annotation);
        break;
      
      case 'highlight':
        await this.drawHighlight(x, y, size, annotation);
        break;
      
      case 'circle':
        await this.drawPulsingCircle(x, y, size, annotation);
        break;
      
      case 'tooltip':
        await this.drawTooltip(x, y, text || '', annotation);
        break;
      
      case 'pulse':
        await this.drawPulseEffect(x, y, size, annotation);
        break;
    }

    this.ctx.restore();
  }

  /**
   * Draw animated arrow pointing to specific coordinates
   */
  private async drawAnimatedArrow(x: number, y: number, annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx) return;

    const arrowSize = annotation.size;
    const animationOffset = this.session.elderlyMode ? 20 : 15; // Larger movement for visibility

    // Animate arrow with bouncing effect
    const animate = (timestamp: number) => {
      if (!this.ctx) return;
      
      const bounce = Math.sin(timestamp * 0.005) * animationOffset;
      const arrowX = x - arrowSize - bounce;
      const arrowY = y - arrowSize - bounce;

      // Clear previous arrow
      this.ctx.clearRect(arrowX - 50, arrowY - 50, 100, 100);

      // Draw arrow shaft
      this.ctx.beginPath();
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.lineTo(x - 10, y - 10);
      this.ctx.stroke();

      // Draw arrow head
      this.ctx.beginPath();
      this.ctx.moveTo(x - 10, y - 10);
      this.ctx.lineTo(x - 20, y - 5);
      this.ctx.lineTo(x - 20, y - 15);
      this.ctx.closePath();
      this.ctx.fill();

      // Add glow effect for elderly users
      if (this.session.elderlyMode) {
        this.ctx.shadowColor = annotation.color;
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      if (this.isDrawing && this.session.annotations.find(a => a.id === annotation.id)) {
        requestAnimationFrame(animate);
      }
    };

    this.isDrawing = true;
    requestAnimationFrame(animate);
  }

  /**
   * Draw highlight around target area
   */
  private async drawHighlight(x: number, y: number, size: number, _annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx) return;

    const padding = this.session.elderlyMode ? 15 : 10;
    
    this.ctx.setLineDash([10, 5]); // Dashed border for visibility
    this.ctx.strokeRect(x - padding, y - padding, size + (padding * 2), size + (padding * 2));
    
    // Add semi-transparent fill
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillRect(x - padding, y - padding, size + (padding * 2), size + (padding * 2));
    this.ctx.globalAlpha = 1.0;
    this.ctx.setLineDash([]);
  }

  /**
   * Draw pulsing circle for attention
   */
  private async drawPulsingCircle(x: number, y: number, size: number, annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx) return;

    let radius = size;
    const maxRadius = this.session.elderlyMode ? size * 2 : size * 1.5;
    const pulseSpeed = this.session.elderlyMode ? 0.03 : 0.05; // Slower pulse for elderly

    const animate = (timestamp: number) => {
      if (!this.ctx) return;

      // Clear previous circle
      this.ctx.clearRect(x - maxRadius - 10, y - maxRadius - 10, (maxRadius + 10) * 2, (maxRadius + 10) * 2);

      // Calculate pulsing radius
      radius = size + Math.sin(timestamp * pulseSpeed) * (maxRadius - size);

      // Draw pulsing circle
      this.ctx.globalAlpha = 0.7;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;

      if (this.isDrawing && this.session.annotations.find(a => a.id === annotation.id)) {
        requestAnimationFrame(animate);
      }
    };

    this.isDrawing = true;
    requestAnimationFrame(animate);
  }

  /**
   * Draw tooltip with text
   */
  private async drawTooltip(x: number, y: number, text: string, annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx) return;

    const padding = this.session.elderlyMode ? 20 : 15;
    const fontSize = this.session.elderlyMode ? 18 : 16;
    
    this.ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = this.ctx.measureText(text);
    const tooltipWidth = textMetrics.width + (padding * 2);
    const tooltipHeight = fontSize + (padding * 2);

    // Position tooltip above the target
    const tooltipX = x - tooltipWidth / 2;
    const tooltipY = y - tooltipHeight - 20;

    // Draw tooltip background
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = '#1f2937'; // Dark background
    this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Draw tooltip border
    this.ctx.strokeStyle = annotation.color;
    this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Draw tooltip text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(text, tooltipX + padding, tooltipY + fontSize + padding/2);
    
    // Draw pointer
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 10);
    this.ctx.lineTo(x - 10, tooltipY + tooltipHeight);
    this.ctx.lineTo(x + 10, tooltipY + tooltipHeight);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Draw pulse effect for emphasis
   */
  private async drawPulseEffect(x: number, y: number, size: number, annotation: AnnotationOverlay): Promise<void> {
    if (!this.ctx) return;

    let opacity = 1.0;
    const fadeSpeed = this.session.elderlyMode ? 0.02 : 0.03;

    const animate = (timestamp: number) => {
      if (!this.ctx) return;

      // Clear previous pulse
      this.ctx.clearRect(x - size - 10, y - size - 10, (size + 10) * 2, (size + 10) * 2);

      // Calculate fading opacity
      opacity = Math.abs(Math.sin(timestamp * fadeSpeed));

      // Draw pulse
      this.ctx.globalAlpha = opacity;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      if (this.isDrawing && this.session.annotations.find(a => a.id === annotation.id)) {
        requestAnimationFrame(animate);
      }
    };

    this.isDrawing = true;
    requestAnimationFrame(animate);
  }

  /**
   * Remove annotation by ID
   */
  removeAnnotation(annotationId: string): void {
    this.session.annotations = this.session.annotations.filter(a => a.id !== annotationId);
    this.annotationQueue = this.annotationQueue.filter(a => a.id !== annotationId);
    
    // Clear and redraw canvas
    this.clearCanvas();
    this.session.annotations.forEach(annotation => {
      this.drawAnnotation(annotation);
    });

    this.emit('annotationRemoved', annotationId);
  }

  /**
   * Clear all annotations
   */
  clearAllAnnotations(): void {
    this.session.annotations = [];
    this.annotationQueue = [];
    this.isDrawing = false;
    this.clearCanvas();
    this.emit('annotationsCleared');
  }

  /**
   * Initialize voice instructions with Hindi/English support
   */
  private initializeVoiceInstructions(): void {
    // Configure speech synthesis for elderly users
    this.speechSynthesis.cancel(); // Clear any existing speech
  }

  /**
   * Speak instruction with elderly-friendly settings
   */
  async speakInstruction(instruction: VoiceInstruction): Promise<void> {
    return new Promise((resolve) => {
      this.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(instruction.text);
      
      // Configure for elderly users
      utterance.lang = instruction.language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = this.session.elderlyMode ? 0.7 : 0.9; // Slower for elderly
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      // Add emotion-based adjustments
      switch (instruction.emotion) {
        case 'encouraging':
          utterance.pitch = 1.1;
          break;
        case 'patient':
          utterance.rate = 0.6;
          break;
        case 'celebratory':
          utterance.pitch = 1.2;
          utterance.rate = 1.0;
          break;
        case 'cautious':
          utterance.rate = 0.5;
          utterance.pitch = 0.9;
          break;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      this.session.currentInstruction = instruction;
      this.speechSynthesis.speak(utterance);
      this.emit('instructionSpoken', instruction);
    });
  }

  /**
   * Initialize speech recognition for voice commands
   */
  private initializeSpeechRecognition(): void {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = this.session.language === 'hi' ? 'hi-IN' : 'en-US';
      
      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        this.emit('voiceCommand', { transcript, language: this.session.language });
      };

      this.speechRecognition.onerror = (event) => {
        this.emit('speechError', event.error);
      };
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.lang = this.session.language === 'hi' ? 'hi-IN' : 'en-US';
      this.speechRecognition.start();
      this.emit('listeningStarted');
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.emit('listeningStopped');
    }
  }

  /**
   * Analyze screen content for auto-detection of UI elements
   */
  private startScreenAnalysis(): void {
    if (!this.session.stream) return;

    // This would integrate with computer vision APIs
    // For now, we'll emit events for manual detection
    this.emit('screenAnalysisStarted');
    
    // Future: Integrate with TensorFlow.js or similar for UI element detection
  }

  /**
   * Process natural language instruction and create annotations
   */
  async processNaturalLanguageInstruction(
    instruction: string, 
    targetCoordinates?: ScreenCoordinate
  ): Promise<void> {
    const language = this.session.language;
    
    // Intent mapping for common elder-friendly instructions
    const intentMapping = {
      hi: {
        'click': ['क्लिक', 'दबाएं', 'टैप'],
        'scroll': ['स्क्रॉल', 'ऊपर', 'नीचे'],
        'type': ['लिखें', 'टाइप'],
        'open': ['खोलें', 'देखें'],
        'close': ['बंद', 'छुपाएं']
      },
      en: {
        'click': ['click', 'press', 'tap', 'select'],
        'scroll': ['scroll', 'up', 'down'],
        'type': ['type', 'write', 'enter'],
        'open': ['open', 'show', 'display'],
        'close': ['close', 'hide', 'minimize']
      }
    };

    const words = instruction.toLowerCase().split(' ');
    let action = 'click'; // default
    let elementDescription = '';

    // Detect action
    for (const [actionType, keywords] of Object.entries(intentMapping[language])) {
      if (keywords.some(keyword => words.includes(keyword.toLowerCase()))) {
        action = actionType;
        break;
      }
    }

    // Create appropriate annotation
    if (targetCoordinates) {
      const annotationType = this.getAnnotationTypeForAction(action);
      const color = this.getColorForAction(action);
      
      await this.addAnnotation({
        type: annotationType,
        coordinates: targetCoordinates,
        text: this.getInstructionText(action, language),
        color,
        size: this.session.elderlyMode ? 40 : 30,
        duration: this.session.elderlyMode ? 8000 : 5000,
        zIndex: 1000,
        animation: 'bounce'
      });

      // Speak the instruction
      await this.speakInstruction({
        id: `instruction-${Date.now()}`,
        text: this.getVoiceInstruction(action, elementDescription, language),
        language,
        priority: 'medium',
        emotion: 'encouraging'
      });
    }
  }

  /**
   * Helper methods
   */
  private normalizeCoordinates(coord: ScreenCoordinate): { x: number; y: number } {
    const scaleX = this.canvas!.width / coord.screenWidth;
    const scaleY = this.canvas!.height / coord.screenHeight;
    
    return {
      x: coord.x * scaleX,
      y: coord.y * scaleY
    };
  }

  private clearCanvas(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAnnotationTypeForAction(action: string): AnnotationOverlay['type'] {
    const mapping: Record<string, AnnotationOverlay['type']> = {
      'click': 'arrow',
      'scroll': 'highlight',
      'type': 'tooltip',
      'open': 'circle',
      'close': 'pulse'
    };
    return mapping[action] || 'arrow';
  }

  private getColorForAction(action: string): string {
    const mapping: Record<string, string> = {
      'click': '#ef4444', // Red for clicks
      'scroll': '#3b82f6', // Blue for scrolling
      'type': '#10b981', // Green for typing
      'open': '#f59e0b', // Orange for opening
      'close': '#8b5cf6'  // Purple for closing
    };
    return mapping[action] || '#ef4444';
  }

  private getInstructionText(action: string, language: 'hi' | 'en'): string {
    const instructions = {
      hi: {
        'click': 'यहाँ क्लिक करें',
        'scroll': 'यहाँ स्क्रॉल करें',
        'type': 'यहाँ टाइप करें',
        'open': 'यहाँ खोलें',
        'close': 'यहाँ बंद करें'
      } as Record<string, string>,
      en: {
        'click': 'Click here',
        'scroll': 'Scroll here',
        'type': 'Type here',
        'open': 'Open this',
        'close': 'Close this'
      } as Record<string, string>
    };
    return instructions[language][action] || instructions[language]['click'];
  }

  private getVoiceInstruction(action: string, element: string, language: 'hi' | 'en'): string {
    const instructions = {
      hi: {
        'click': `बहुत अच्छे! अब ${element} पर क्लिक करें।`,
        'scroll': `अब आपको ${element} को स्क्रॉल करना है।`,
        'type': `यहाँ ${element} में लिखें।`,
        'open': `${element} को खोलें।`,
        'close': `${element} को बंद करें।`
      } as Record<string, string>,
      en: {
        'click': `Great! Now click on the ${element}.`,
        'scroll': `Now you need to scroll ${element}.`,
        'type': `Type in the ${element}.`,
        'open': `Open the ${element}.`,
        'close': `Close the ${element}.`
      } as Record<string, string>
    };
    return instructions[language][action] || instructions[language]['click'];
  }

  /**
   * Stop screen sharing and cleanup
   */
  async stopScreenSharing(): Promise<void> {
    if (this.session.stream) {
      this.session.stream.getTracks().forEach(track => track.stop());
    }
    
    this.clearAllAnnotations();
    this.stopListening();
    this.speechSynthesis.cancel();
    
    if (this.overlayContainer) {
      document.body.removeChild(this.overlayContainer);
    }

    this.session = {
      ...this.session,
      isActive: false,
      stream: null,
      annotations: [],
      currentInstruction: undefined
    };

    this.emit('screenSharingStopped');
  }

  /**
   * Get current session information
   */
  getSession(): ScreenSharingSession {
    return { ...this.session };
  }

  /**
   * Update session settings
   */
  updateSession(updates: Partial<ScreenSharingSession>): void {
    this.session = { ...this.session, ...updates };
    this.emit('sessionUpdated', this.session);
  }
}

export default EnhancedScreenSharingManager;
