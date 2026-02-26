import * as vscode from 'vscode';

/**
 * T055: CopilotClient implementation
 * Integrates with GitHub Copilot for AI completions.
 * This is a stub for MVP, to be expanded as Copilot API matures.
 */
export class CopilotClient {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Send a prompt to GitHub Copilot and return the AI response.
   * For MVP, this is a stub that returns a placeholder.
   * @param prompt - The prompt to send to Copilot
   * @returns Promise<string> - The AI-generated response
   */
  async sendPrompt(prompt: string): Promise<string> {
    // TODO: Integrate with Copilot API when available
    // For now, return a placeholder response
    return Promise.resolve('[CopilotClient] (stub) AI response for prompt: ' + prompt);
  }
}

