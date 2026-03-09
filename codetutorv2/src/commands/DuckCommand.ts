import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';
import {buildChatMessages, sendChatRequest} from "../core/chat-utils";

/**
 * Duck Command - starts a socratic chat mode where dhe AI asks questions instead of the student
 * It forces the student to awnser the questions rather than ask them
 * Only stops when the Student has given the correct awnser themselves.
 *
 * @author Kevin Hamelink
 */
export class DuckCommand implements ICommand {
    readonly name = 'duck';
    readonly description = 'rubber ducken';
    readonly aliases = ['duck', 'rubber duck', 'eendje'];

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const userQuery = context.request.prompt.toLowerCase().trim();

        // Checks if user is asking to rubber duck
        const isDucking = userQuery.length > 3 && (userQuery.includes('rubber') || userQuery.includes('rubber') ||
            userQuery.includes('eendje') || userQuery.includes('duck') || userQuery.includes('rubberduck')
            || userQuery.includes('rubbereendje'));

        if (isDucking) {
            await this.rubberDucken(context, stream, token);
        } else {
            // await this.rubberduck();
        }
    }

    private async rubberDucken(
        Context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const timeStamp = new Date().toISOString();
        stream.markdown('## 🦆 Rubber ducky mode geactiveerd... \n\n');
        try {
            // Get the current difficulty level from context
            const difficulty = this.getLevel(Context);
            stream.markdown(`**Moeilijkheidsgraad:** ${this.getDifficultyName(difficulty)}\n\n`);

            // TODO: Implement rubber duck socratic dialog
            stream.markdown('Vertel me over je code. Ik zal je vragen stellen...\n');
        } catch (e) {
            console.error('Error in rubber ducken:', e);
            stream.markdown('❌ Kon rubber ducky mode niet starten.\n');
        }
    }

    /**
     * Get the current level from ChatContext
     */
    private getLevel(context: ChatContext): number {
        return context.yearLevel;
    }

    /**
     * Get difficulty name for a level
     */
    private getDifficultyName(level: number): string {
        const names: Record<number, string> = {
            1: 'Eerstejaars (Beginner)',
            2: 'Tweedejaars (Intermediate)',
            3: 'Derdejaars (Advanced)',
            4: 'Vierdejaars (Expert)'
        };
        return names[level] || 'Unknown';
    }
}