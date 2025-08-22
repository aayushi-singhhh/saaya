interface TutorialStep {
  id: string;
  command: string;
  description: string;
  coordinates: { x: number; y: number };
  action: string;
  completed: boolean;
}

interface GeminiResponse {
  steps: TutorialStep[];
}

function getLanguageInstructions(language: string): string {
  const languageMap: Record<string, string> = {
    'hi': 'Please respond in Hindi (हिंदी). Use clear, simple Hindi words and provide step-by-step instructions in Hindi.',
    'en': 'Please respond in English. Use clear, simple English words and provide step-by-step instructions.'
  };
  
  return languageMap[language] || languageMap['en'];
}

export async function generateStepGuidance(action: string, description: string, apiKey: string, language: string = 'en'): Promise<string> {
  try {
    const languageInstructions = getLanguageInstructions(language);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${languageInstructions}

You are a helpful voice assistant guiding users through computer tasks. Generate a clear, friendly voice instruction for the following step:
            
Action: ${action}
Description: ${description}
            
Provide a single sentence that guides the user on what to do next. Make it conversational, encouraging, and easy to understand for elderly users.

Examples:
- English: "Now, look for the blue Compose button on the left side of your Gmail screen and click on it."
- Hindi: "अब Gmail स्क्रीन के बाईं ओर नीले रंग का Compose बटन देखें और उस पर क्लिक करें।"
            
Keep the instruction under 25 words and make it very actionable and specific.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return content?.trim() || `Please ${action.toLowerCase()}: ${description}`;
  } catch (error) {
    console.error('Error generating step guidance:', error);
    return `Please ${action.toLowerCase()}: ${description}`;
  }
}

export async function processVoiceCommand(command: string, apiKey: string, language: string = 'en'): Promise<GeminiResponse | null> {
  try {
    const languageInstructions = getLanguageInstructions(language);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${languageInstructions}

You are an intelligent voice assistant that helps users with computer tasks. Analyze this user command and create a comprehensive step-by-step tutorial: "${command}"

Based on the command, generate realistic, actionable steps that would help someone complete this task. Consider:
1. What application or website is needed
2. Where UI elements are typically located 
3. The logical sequence of actions
4. Clear, specific instructions for elderly users

Please respond with a JSON object containing tutorial steps in this exact format:
{
  "steps": [
    {
      "id": "step-1",
      "command": "${command}",
      "description": "Detailed description of what to do (in ${language === 'hi' ? 'Hindi' : 'English'})",
      "coordinates": {"x": 400, "y": 300},
      "action": "Clear action title (in ${language === 'hi' ? 'Hindi' : 'English'})",
      "completed": false
    }
  ]
}

Important guidelines:
- Create 3-6 logical steps based on the complexity of the task
- Generate realistic screen coordinates (assume 1920x1080 screen)
- Make descriptions very clear and specific for elderly users
- Focus on common UI patterns (toolbars, menus, buttons are usually in predictable locations)
- For Gmail: Compose button is at top-left (32, 140), To field around (120, 180), Subject around (120, 230)
- For general tasks: Consider typical locations of common UI elements
- Use ${language === 'hi' ? 'Hindi' : 'English'} language for all text content

Only respond with valid JSON, no additional text.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    // Extract JSON from the response
    let jsonStr = content.trim();
    
    // Remove any markdown code blocks
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsedResponse = JSON.parse(jsonStr) as GeminiResponse;
      
      // Validate the response structure
      if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps)) {
        throw new Error('Invalid response format');
      }

      // Add unique IDs if missing and ensure proper structure
      const validatedSteps = parsedResponse.steps.map((step, index) => ({
        id: step.id || `step-${index + 1}`,
        command: step.command || command,
        description: step.description || 'No description provided',
        coordinates: step.coordinates || { x: 400 + (index * 100), y: 300 + (index * 50) },
        action: step.action || `Step ${index + 1}`,
        completed: false
      }));

      return { steps: validatedSteps };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // Fallback: create default steps based on common patterns
      return createFallbackSteps(command);
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return fallback steps
    return createFallbackSteps(command);
  }
}

function createFallbackSteps(command: string): GeminiResponse {
  const lowerCommand = command.toLowerCase();
  
  let steps: TutorialStep[] = [];
  
  if (lowerCommand.includes('gmail') || lowerCommand.includes('compose') || lowerCommand.includes('send email')) {
    steps = [
      {
        id: 'step-1',
        command,
        description: 'Open Gmail by going to gmail.com in your browser',
        coordinates: { x: 400, y: 60 },
        action: 'Navigate to Gmail',
        completed: false
      },
      {
        id: 'step-2',
        command,
        description: 'Click on the "Compose" button on the left side',
        coordinates: { x: 120, y: 200 },
        action: 'Click Compose Button',
        completed: false
      },
      {
        id: 'step-3',
        command,
        description: 'Enter the recipient email address in the "To" field',
        coordinates: { x: 600, y: 250 },
        action: 'Enter Recipient Email',
        completed: false
      },
      {
        id: 'step-4',
        command,
        description: 'Click on the subject field and enter your email subject',
        coordinates: { x: 600, y: 300 },
        action: 'Enter Subject',
        completed: false
      },
      {
        id: 'step-5',
        command,
        description: 'Click in the message body area and type your email content',
        coordinates: { x: 600, y: 400 },
        action: 'Write Email Content',
        completed: false
      },
      {
        id: 'step-6',
        command,
        description: 'Click the "Send" button to send your email',
        coordinates: { x: 150, y: 550 },
        action: 'Send Email',
        completed: false
      }
    ];
  } else if (lowerCommand.includes('delete') && lowerCommand.includes('photo')) {
    steps = [
      {
        id: 'step-1',
        command,
        description: 'Open your photo gallery or photos app',
        coordinates: { x: 200, y: 400 },
        action: 'Open Gallery App',
        completed: false
      },
      {
        id: 'step-2',
        command,
        description: 'Find and select the photo you want to delete by clicking on it',
        coordinates: { x: 400, y: 300 },
        action: 'Select Photo',
        completed: false
      },
      {
        id: 'step-3',
        command,
        description: 'Look for the delete button (usually a trash icon) and click it',
        coordinates: { x: 600, y: 100 },
        action: 'Click Delete Button',
        completed: false
      },
      {
        id: 'step-4',
        command,
        description: 'Confirm the deletion when prompted by clicking "Delete" or "OK"',
        coordinates: { x: 500, y: 400 },
        action: 'Confirm Delete',
        completed: false
      }
    ];
  } else if (lowerCommand.includes('google docs') || lowerCommand.includes('document')) {
    steps = [
      {
        id: 'step-1',
        command,
        description: 'Open Google Docs by going to docs.google.com',
        coordinates: { x: 400, y: 60 },
        action: 'Navigate to Google Docs',
        completed: false
      },
      {
        id: 'step-2',
        command,
        description: 'Click on the "+" button or "Blank document" to create a new document',
        coordinates: { x: 200, y: 200 },
        action: 'Create New Document',
        completed: false
      },
      {
        id: 'step-3',
        command,
        description: 'Click in the document area and start typing your content',
        coordinates: { x: 500, y: 300 },
        action: 'Start Writing',
        completed: false
      },
      {
        id: 'step-4',
        command,
        description: 'Your document is automatically saved. You can rename it by clicking "Untitled document"',
        coordinates: { x: 300, y: 100 },
        action: 'Rename Document',
        completed: false
      }
    ];
  } else {
    // Generic fallback steps
    steps = [
      {
        id: 'step-1',
        command,
        description: 'Identify the relevant application or area on your screen for this task',
        coordinates: { x: 300, y: 250 },
        action: 'Locate Target Area',
        completed: false
      },
      {
        id: 'step-2',
        command,
        description: 'Navigate to the appropriate menu or section needed for your task',
        coordinates: { x: 450, y: 200 },
        action: 'Navigate to Section',
        completed: false
      },
      {
        id: 'step-3',
        command,
        description: 'Perform the main action required for your task',
        coordinates: { x: 500, y: 350 },
        action: 'Execute Action',
        completed: false
      },
      {
        id: 'step-4',
        command,
        description: 'Verify that the action was completed successfully',
        coordinates: { x: 400, y: 450 },
        action: 'Verify Completion',
        completed: false
      }
    ];
  }
  
  return { steps };
}