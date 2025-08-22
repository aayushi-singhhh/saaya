// Universal Screen Capture + Real-time Annotation Service
// Works with any application via WebRTC Screen Capture API

import { EventEmitter } from 'events';
import type { OverlayAnnotation } from '../components/RealTimeOverlay';

export interface ScreenCaptureOptions {
  preferredDisplaySurface?: 'monitor' | 'window' | 'browser';
  audio?: boolean;
  video?: {
    width?: number;
    height?: number;
    frameRate?: number;
  };
  elderlyMode?: boolean;
  language?: 'hi' | 'en';
}

export interface ApplicationDetection {
  appName: string;
  appType: 'browser' | 'mobile-app' | 'desktop-app' | 'system';
  confidence: number;
  supportedActions: string[];
  isElderlyFriendly: boolean;
}

export interface ScreenAnalysis {
  timestamp: number;
  elements: DetectedElement[];
  text: string[];
  applications: ApplicationDetection[];
  suggestedActions: SuggestedAction[];
}

export interface DetectedElement {
  id: string;
  type: 'button' | 'input' | 'link' | 'menu' | 'icon' | 'text' | 'image';
  bounds: { x: number; y: number; width: number; height: number };
  text?: string;
  confidence: number;
  isClickable: boolean;
  elderlyFriendlyScore: number; // 0-100, higher = more accessible
}

export interface SuggestedAction {
  id: string;
  action: string;
  description: string;
  targetElement?: DetectedElement;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // seconds
  requiresConfirmation: boolean;
}

class UniversalScreenCapture extends EventEmitter {
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private analysisInterval: number | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayContext: CanvasRenderingContext2D | null = null;
  private options: ScreenCaptureOptions = {};

  constructor() {
    super();
  }

  /**
   * Start universal screen capture with real-time annotation support
   */
  async startCapture(options: ScreenCaptureOptions = {}): Promise<MediaStream> {
    try {
      this.options = {
        preferredDisplaySurface: 'monitor',
        audio: false,
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30
        },
        elderlyMode: true,
        language: 'en',
        ...options
      };

      // Request screen capture with enhanced options
      const constraints: MediaStreamConstraints = {
        video: {
          // @ts-ignore - displaySurface is supported but not in types
          displaySurface: this.options.preferredDisplaySurface,
          cursor: 'always',
          width: { ideal: this.options.video?.width || 1920 },
          height: { ideal: this.options.video?.height || 1080 },
          frameRate: { ideal: this.options.video?.frameRate || 30 }
        } as MediaTrackConstraints,
        audio: this.options.audio || false
      };

      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // Set up canvas for analysis and annotation
      this.setupCanvas();
      
      // Set up overlay canvas for real-time annotations
      this.setupOverlayCanvas();
      
      // Start real-time screen analysis
      this.startScreenAnalysis();
      
      this.emit('captureStarted', { stream: this.stream, options: this.options });

      // Handle stream end
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopCapture();
      });

      return this.stream;

    } catch (error) {
      console.error('Screen capture failed:', error);
      this.emit('error', { type: 'CAPTURE_FAILED', error });
      throw error;
    }
  }

  /**
   * Stop screen capture and cleanup
   */
  stopCapture(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    this.cleanup();
    this.emit('captureStopped');
  }

  /**
   * Add real-time annotation to the screen
   */
  addAnnotation(annotation: OverlayAnnotation): string {
    if (!this.overlayContext || !this.overlayCanvas) {
      throw new Error('Overlay canvas not initialized');
    }

    this.drawAnnotation(annotation);
    this.emit('annotationAdded', annotation);
    return annotation.id;
  }

  /**
   * Remove annotation from screen
   */
  removeAnnotation(annotationId: string): void {
    // Clear and redraw all annotations except the removed one
    this.clearOverlay();
    this.emit('annotationRemoved', annotationId);
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(): void {
    this.clearOverlay();
    this.emit('annotationsCleared');
  }

  /**
   * Analyze current screen content and suggest actions
   */
  async analyzeScreen(): Promise<ScreenAnalysis> {
    if (!this.canvas || !this.context || !this.stream) {
      throw new Error('Screen capture not active');
    }

    try {
      // Capture current frame
      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.play();

      await new Promise(resolve => {
        video.addEventListener('loadedmetadata', resolve);
      });

      // Draw to canvas for analysis
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
      this.context.drawImage(video, 0, 0);

      // Get image data for analysis
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Perform AI-powered screen analysis
      const analysis = await this.performScreenAnalysis(imageData);
      
      this.emit('screenAnalyzed', analysis);
      return analysis;

    } catch (error) {
      console.error('Screen analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get suggested next actions based on current screen
   */
  async getSuggestedActions(): Promise<SuggestedAction[]> {
    const analysis = await this.analyzeScreen();
    return analysis.suggestedActions;
  }

  /**
   * Point to a specific element with animation
   */
  pointToElement(element: DetectedElement, message?: string): void {
    const centerX = (element.bounds.x + element.bounds.width / 2) / this.canvas!.width * 100;
    const centerY = (element.bounds.y + element.bounds.height / 2) / this.canvas!.height * 100;

    const annotation: OverlayAnnotation = {
      id: `pointer-${Date.now()}`,
      type: 'arrow',
      x: centerX,
      y: centerY - 10, // Point slightly above
      color: '#EF4444',
      size: 'large',
      animation: 'bounce',
      duration: 5000,
      isElderlyFriendly: true
    };

    this.addAnnotation(annotation);

    if (message) {
      const tooltipAnnotation: OverlayAnnotation = {
        id: `tooltip-${Date.now()}`,
        type: 'tooltip',
        x: centerX + 15,
        y: centerY - 15,
        text: message,
        color: '#3B82F6',
        duration: 8000,
        isElderlyFriendly: true
      };

      this.addAnnotation(tooltipAnnotation);
    }
  }

  /**
   * Highlight an area of the screen
   */
  highlightArea(bounds: { x: number; y: number; width: number; height: number }, message?: string): void {
    const x = (bounds.x + bounds.width / 2) / this.canvas!.width * 100;
    const y = (bounds.y + bounds.height / 2) / this.canvas!.height * 100;
    const width = bounds.width / this.canvas!.width * 100;
    const height = bounds.height / this.canvas!.height * 100;

    const annotation: OverlayAnnotation = {
      id: `highlight-${Date.now()}`,
      type: 'highlight',
      x, y, width, height,
      color: '#10B981',
      animation: 'pulse',
      duration: 6000,
      text: message,
      isElderlyFriendly: true
    };

    this.addAnnotation(annotation);
  }

  /**
   * Show celebration animation at position
   */
  showCelebration(x: number, y: number, message: string): void {
    const percentX = x / this.canvas!.width * 100;
    const percentY = y / this.canvas!.height * 100;

    const annotation: OverlayAnnotation = {
      id: `celebration-${Date.now()}`,
      type: 'text',
      x: percentX,
      y: percentY,
      text: message,
      color: '#F59E0B',
      size: 'large',
      animation: 'bounce',
      duration: 3000,
      isElderlyFriendly: true
    };

    this.addAnnotation(annotation);
  }

  // Private methods

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  private setupOverlayCanvas(): void {
    this.overlayCanvas = document.createElement('canvas');
    this.overlayContext = this.overlayCanvas.getContext('2d');
    
    // Make overlay canvas full screen
    this.overlayCanvas.style.position = 'fixed';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.width = '100vw';
    this.overlayCanvas.style.height = '100vh';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '9999';
    this.overlayCanvas.width = window.screen.width;
    this.overlayCanvas.height = window.screen.height;
  }

  private startScreenAnalysis(): void {
    // Analyze screen every 2 seconds for elderly-friendly pacing
    const intervalTime = this.options.elderlyMode ? 3000 : 2000;
    
    this.analysisInterval = window.setInterval(async () => {
      try {
        await this.analyzeScreen();
      } catch (error) {
        console.error('Periodic screen analysis failed:', error);
      }
    }, intervalTime);
  }

  private async performScreenAnalysis(_imageData: ImageData): Promise<ScreenAnalysis> {
    // This is a simplified analysis - in a real implementation, 
    // you would use computer vision libraries like OpenCV.js or TensorFlow.js
    
    // Simulate AI analysis
    const mockElements: DetectedElement[] = [
      {
        id: 'element-1',
        type: 'button',
        bounds: { x: 100, y: 200, width: 80, height: 40 },
        text: 'Submit',
        confidence: 0.9,
        isClickable: true,
        elderlyFriendlyScore: 85
      }
    ];

    const mockApplications: ApplicationDetection[] = [
      {
        appName: 'Web Browser',
        appType: 'browser',
        confidence: 0.8,
        supportedActions: ['click', 'type', 'scroll'],
        isElderlyFriendly: true
      }
    ];

    const mockActions: SuggestedAction[] = [
      {
        id: 'action-1',
        action: 'click-submit',
        description: this.options.language === 'hi' 
          ? 'सबमिट बटन पर क्लिक करें'
          : 'Click the Submit button',
        difficulty: 'easy',
        estimatedTime: 5,
        requiresConfirmation: false
      }
    ];

    return {
      timestamp: Date.now(),
      elements: mockElements,
      text: ['Submit', 'Cancel', 'Help'],
      applications: mockApplications,
      suggestedActions: mockActions
    };
  }

  private drawAnnotation(annotation: OverlayAnnotation): void {
    if (!this.overlayContext || !this.overlayCanvas) return;

    const ctx = this.overlayContext;
    const canvas = this.overlayCanvas;
    
    // Convert percentage to pixels
    const x = (annotation.x / 100) * canvas.width;
    const y = (annotation.y / 100) * canvas.height;

    ctx.save();
    
    // Set common styles
    ctx.strokeStyle = annotation.color || '#3B82F6';
    ctx.fillStyle = annotation.color || '#3B82F6';
    ctx.lineWidth = 3;

    switch (annotation.type) {
      case 'arrow':
        this.drawArrow(ctx, x, y);
        break;
      case 'highlight':
        this.drawHighlight(ctx, annotation, canvas);
        break;
      case 'circle':
        this.drawCircle(ctx, x, y, 30);
        break;
      case 'tooltip':
        this.drawTooltip(ctx, x, y, annotation.text || '');
        break;
    }

    ctx.restore();
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const size = 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size/2, y - size);
    ctx.lineTo(x + size/2, y - size);
    ctx.closePath();
    ctx.fill();
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, annotation: OverlayAnnotation, canvas: HTMLCanvasElement): void {
    const x = (annotation.x / 100) * canvas.width;
    const y = (annotation.y / 100) * canvas.height;
    const width = ((annotation.width || 10) / 100) * canvas.width;
    const height = ((annotation.height || 5) / 100) * canvas.height;

    ctx.globalAlpha = 0.3;
    ctx.fillRect(x - width/2, y - height/2, width, height);
    ctx.globalAlpha = 1;
    ctx.strokeRect(x - width/2, y - height/2, width, height);
  }

  private drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  private drawTooltip(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.font = '16px Arial';
    const metrics = ctx.measureText(text);
    const padding = 10;
    const width = metrics.width + padding * 2;
    const height = 30;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y - height, width, height);

    // Text
    ctx.fillStyle = 'white';
    ctx.fillText(text, x + padding, y - height/2 + 5);
  }

  private clearOverlay(): void {
    if (this.overlayContext && this.overlayCanvas) {
      this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  private cleanup(): void {
    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
    }
    this.canvas = null;
    this.context = null;
    this.overlayCanvas = null;
    this.overlayContext = null;
  }
}

export default UniversalScreenCapture;

// Helper function to create and manage screen capture instances
export const createScreenCapture = (_options?: ScreenCaptureOptions) => {
  return new UniversalScreenCapture();
};

// Elderly-friendly preset configurations
export const elderlyPresets = {
  beginner: {
    elderlyMode: true,
    language: 'en' as const,
    video: {
      frameRate: 15, // Lower for slower devices
      width: 1366,
      height: 768
    }
  },
  hindiSpeaker: {
    elderlyMode: true,
    language: 'hi' as const,
    video: {
      frameRate: 20,
      width: 1920,
      height: 1080
    }
  },
  standard: {
    elderlyMode: true,
    language: 'en' as const,
    video: {
      frameRate: 30,
      width: 1920,
      height: 1080
    }
  }
};
