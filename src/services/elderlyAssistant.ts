// Enhanced AI-Powered Guidance System for Elderly Users
import { processVoiceCommand, generateStepGuidance } from './geminiService';
import { detectLanguage, translateText } from './languageService';

export interface ScreenContext {
  detectedApp?: string;
  currentUrl?: string;
  visibleElements?: ElementInfo[];
  userIntent?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ElementInfo {
  type: 'button' | 'input' | 'link' | 'text' | 'image';
  text?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isClickable: boolean;
  id?: string;
  className?: string;
}

export interface VisualGuide {
  type: 'arrow' | 'highlight' | 'circle' | 'tooltip';
  position: { x: number; y: number };
  text?: string;
  duration?: number;
  color?: string;
}

export interface GuidanceInstruction {
  id: string;
  step: number;
  title: string;
  description: string;
  visualGuides: VisualGuide[];
  voiceInstruction: string;
  canAutomate: boolean;
  automationRisk: 'low' | 'medium' | 'high';
  estimatedTime: number; // in seconds
}

export interface AutomationOption {
  available: boolean;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
  steps: string[];
}

export class ElderlyAssistant {
  private apiKey: string;
  private currentLanguage: string;
  private isVerboseMode: boolean;

  constructor(apiKey: string, language: string = 'en', verboseMode: boolean = true) {
    this.apiKey = apiKey;
    this.currentLanguage = language;
    this.isVerboseMode = verboseMode;
  }

  /**
   * Main method to help user with a request
   * Phase 1: AI-Powered Guidance with Visual Assistance
   */
  async helpUser(
    request: string, 
    screenshot?: string, 
    context?: ScreenContext
  ): Promise<{
    instructions: GuidanceInstruction[];
    automationOptions?: AutomationOption;
    estimatedCompletionTime: number;
  }> {
    try {
      // 1. Detect user's language preference
      const detectedLang = detectLanguage(request);
      this.currentLanguage = detectedLang;

      // 2. Analyze screen context with AI
      const analyzedContext = await this.analyzeScreenWithAI(screenshot, context);

      // 3. Generate personalized instructions
      const instructions = await this.generateInstructions(request, analyzedContext);

      // 4. Create visual guidance
      const guidanceWithVisuals = this.enhanceWithVisualGuides(instructions, analyzedContext);

      // 5. Check automation possibilities (Phase 2)
      const automationOptions = this.evaluateAutomationOptions(guidanceWithVisuals, analyzedContext);

      return {
        instructions: guidanceWithVisuals,
        automationOptions,
        estimatedCompletionTime: this.calculateEstimatedTime(guidanceWithVisuals)
      };

    } catch (error) {
      console.error('ElderlyAssistant error:', error);
      throw new Error(translateText('Sorry, I encountered an error processing your command. Please try again.', this.currentLanguage));
    }
  }

  /**
   * AI Analysis of screen context and user intent
   */
  private async analyzeScreenWithAI(screenshot?: string, context?: ScreenContext): Promise<ScreenContext> {
    // Enhanced context analysis
    const enhancedContext: ScreenContext = {
      ...context,
      difficulty: 'easy', // Default to easy for elderly users
      userIntent: this.inferUserIntent(context)
    };

    // If we have a screenshot, we could analyze it with Gemini Vision
    // For now, we'll work with the provided context
    return enhancedContext;
  }

  /**
   * Generate step-by-step instructions using Gemini AI
   */
  private async generateInstructions(request: string, context: ScreenContext): Promise<GuidanceInstruction[]> {
    // Create a detailed prompt for elderly-friendly instructions
    const prompt = this.createElderlyFriendlyPrompt(request, context);
    
    try {
      // Use existing Gemini service but with enhanced prompts
      const response = await processVoiceCommand(request, this.apiKey, this.currentLanguage);
      
      if (!response) {
        return this.getFallbackInstructions(request);
      }
      
      // Convert to our enhanced instruction format
      return response.steps.map((step: any, index: number) => ({
        id: step.id,
        step: index + 1,
        title: step.action,
        description: step.description,
        visualGuides: this.generateVisualGuides(step),
        voiceInstruction: this.createVoiceInstruction(step),
        canAutomate: this.canStepBeAutomated(step),
        automationRisk: this.assessAutomationRisk(step),
        estimatedTime: this.estimateStepTime(step)
      }));

    } catch (error) {
      console.error('Error generating instructions:', error);
      return this.getFallbackInstructions(request);
    }
  }

  /**
   * Create elderly-friendly prompt for AI
   */
  private createElderlyFriendlyPrompt(request: string, context: ScreenContext): string {
    const languageInstruction = this.currentLanguage === 'hi' 
      ? 'Please respond in Hindi (हिंदी)' 
      : 'Please respond in English';

    return `
${languageInstruction}

You are helping an elderly person learn to use technology. Please provide:
1. Very clear, step-by-step instructions
2. Use simple, non-technical language
3. Be patient and encouraging
4. Include warnings about common mistakes
5. Suggest taking breaks if needed
6. Use large, easy-to-see visual indicators

User request: "${request}"
Current context: ${JSON.stringify(context)}

Please break this down into small, manageable steps that won't overwhelm the user.
Each step should be something they can complete in 30 seconds or less.
Be encouraging and remind them it's okay to go slowly.
    `.trim();
  }

  /**
   * Enhance instructions with visual guides
   */
  private enhanceWithVisualGuides(
    instructions: GuidanceInstruction[], 
    _context: ScreenContext
  ): GuidanceInstruction[] {
    // For now, return instructions as-is since visual guides are already generated
    // This method can be enhanced to add context-specific visual guides
    return instructions;
  }

  /**
   * Generate visual guides for each step
   */
  private generateVisualGuides(step: any): VisualGuide[] {
    const guides: VisualGuide[] = [];

    // Add highlight around the target area
    if (step.coordinates) {
      guides.push({
        type: 'highlight',
        position: step.coordinates,
        color: '#3B82F6',
        duration: 5000
      });

      // Add arrow pointing to the element
      guides.push({
        type: 'arrow',
        position: {
          x: step.coordinates.x - 50,
          y: step.coordinates.y - 50
        },
        color: '#EF4444',
        duration: 3000
      });

      // Add tooltip with instruction
      guides.push({
        type: 'tooltip',
        position: {
          x: step.coordinates.x + 20,
          y: step.coordinates.y - 80
        },
        text: step.action,
        duration: 8000
      });
    }

    return guides;
  }

  /**
   * Create voice instruction with appropriate tone for elderly users
   */
  private createVoiceInstruction(step: any): string {
    const baseInstruction = step.description;
    
    // Add encouraging prefix for elderly users
    const encouragingPrefixes = this.currentLanguage === 'hi' ? [
      'बहुत अच्छे, अब',
      'शानदार! अगला कदम',
      'आप बहुत अच्छा कर रहे हैं। अब',
      'बिल्कुल सही! अब'
    ] : [
      'Great job! Now',
      'You\'re doing wonderful. Next',
      'Perfect! Now let\'s',
      'Excellent work. Now'
    ];

    const prefix = encouragingPrefixes[Math.floor(Math.random() * encouragingPrefixes.length)];
    
    return `${prefix} ${baseInstruction}`;
  }

  /**
   * Check if a step can be automated safely
   */
  private canStepBeAutomated(step: any): boolean {
    // Conservative approach - only allow automation for very safe actions
    const safeActions = [
      'scroll', 'navigate', 'open', 'click simple button'
    ];

    return safeActions.some(action => 
      step.action.toLowerCase().includes(action.toLowerCase())
    );
  }

  /**
   * Assess automation risk level
   */
  private assessAutomationRisk(step: any): 'low' | 'medium' | 'high' {
    const highRiskKeywords = ['delete', 'remove', 'send', 'submit', 'pay', 'purchase', 'confirm'];
    const mediumRiskKeywords = ['edit', 'change', 'modify', 'update'];

    const stepText = `${step.action} ${step.description}`.toLowerCase();

    if (highRiskKeywords.some(keyword => stepText.includes(keyword))) {
      return 'high';
    }
    if (mediumRiskKeywords.some(keyword => stepText.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Estimate time needed for each step (considering elderly users need more time)
   */
  private estimateStepTime(step: any): number {
    const baseTime = 30; // 30 seconds base time
    const complexityMultiplier = step.description.split(' ').length > 10 ? 1.5 : 1;
    
    return Math.ceil(baseTime * complexityMultiplier);
  }

  /**
   * Evaluate automation options for the entire flow
   */
  private evaluateAutomationOptions(
    instructions: GuidanceInstruction[], 
    _context: ScreenContext
  ): AutomationOption | undefined {
    
    const automatableSteps = instructions.filter(inst => inst.canAutomate);
    
    if (automatableSteps.length === 0) {
      return undefined;
    }

    const highestRisk = instructions.reduce((max, inst) => {
      const riskLevels = { low: 1, medium: 2, high: 3 };
      return riskLevels[inst.automationRisk] > riskLevels[max] ? inst.automationRisk : max;
    }, 'low' as 'low' | 'medium' | 'high');

    return {
      available: true,
      description: translateText(
        automatableSteps.length === instructions.length 
          ? 'I can do all these steps for you automatically'
          : `I can help automate ${automatableSteps.length} out of ${instructions.length} steps`,
        this.currentLanguage
      ),
      riskLevel: highestRisk,
      requiresConfirmation: highestRisk !== 'low',
      steps: automatableSteps.map(step => step.title)
    };
  }

  /**
   * Calculate total estimated completion time
   */
  private calculateEstimatedTime(instructions: GuidanceInstruction[]): number {
    return instructions.reduce((total, inst) => total + inst.estimatedTime, 0);
  }

  /**
   * Infer user intent from context
   */
  private inferUserIntent(context?: ScreenContext): string {
    if (!context) return 'general_help';
    
    if (context.detectedApp) {
      return `use_${context.detectedApp.toLowerCase()}`;
    }
    
    return 'navigation_help';
  }

  /**
   * Provide fallback instructions when AI fails
   */
  private getFallbackInstructions(_request: string): GuidanceInstruction[] {
    return [{
      id: 'fallback-1',
      step: 1,
      title: translateText('Let me help you with that', this.currentLanguage),
      description: translateText(
        'I\'m having trouble understanding your request right now. Let\'s break it down step by step.',
        this.currentLanguage
      ),
      visualGuides: [],
      voiceInstruction: translateText(
        'Don\'t worry, we\'ll figure this out together. Can you tell me more about what you\'d like to do?',
        this.currentLanguage
      ),
      canAutomate: false,
      automationRisk: 'low',
      estimatedTime: 60
    }];
  }

  /**
   * Update language preference
   */
  setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  /**
   * Enable/disable verbose mode for detailed explanations
   */
  setVerboseMode(verbose: boolean): void {
    this.isVerboseMode = verbose;
  }
}

// Export utility functions for component use
export const createElderlyAssistant = (apiKey: string, language?: string) => {
  return new ElderlyAssistant(apiKey, language);
};

// Helper function to format time estimates for display
export const formatEstimatedTime = (seconds: number, language: string = 'en'): string => {
  const minutes = Math.ceil(seconds / 60);
  
  if (language === 'hi') {
    return minutes === 1 ? '1 मिनट' : `${minutes} मिनट`;
  }
  
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
};
