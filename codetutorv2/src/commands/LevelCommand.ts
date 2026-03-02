import * as vscode from 'vscode';
import { ICommand } from '../core/ICommand';
import { ChatContext } from '../core/ChatContext';

/**
 * Level Command - Change student difficulty level
 *
 * Allows students to set their current year level/difficulty.
 * This affects how explanations, feedback, and exercises are tailored.
 *
 * Usage:
 *   @tutor /level 1         (Set to 1st year / beginner)
 *   @tutor /level 2         (Set to 2nd year / intermediate)
 *   @tutor /level 3         (Set to 3rd year / advanced)
 *   @tutor /level 4         (Set to 4th year / expert)
 *   @tutor /level           (Show current level)
 *
 * Features:
 *   - Set student year level (1-4)
 *   - Persists across sessions
 *   - Affects all tutoring content
 *   - Shows current level if no argument
 *
 * Priority: P2 (Important for personalization)
 */
export class LevelCommand implements ICommand {
	readonly name = 'level';
	readonly description = 'Verander je moeilijkheidsniveau';
	readonly aliases = ['year', 'difficulty', 'moeilijkheid', 'jaar'];

	async execute(
		context: ChatContext,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken
	): Promise<void> {
		const userInput = context.request.prompt.toLowerCase().trim();

		// Check if user specified a level
		const levelMatch = userInput.match(/(\d+)/);
		const level = levelMatch ? parseInt(levelMatch[1], 10) : null;

		if (level && level >= 1 && level <= 4) {
			// User wants to change level
			await this.setLevel(context, stream, level);
		} else if (level) {
			// Invalid level provided
			stream.markdown(`❌ **Ongeldig niveau!**\n\n`);
			stream.markdown(`Kies een niveau tussen 1 en 4:\n\n`);
			this.showLevelOptions(stream);
		} else {
			// No level specified, show current level and options
			await this.showCurrentLevel(context, stream);
		}
	}

	/**
	 * Set the student's level
	 */
	private async setLevel(
		context: ChatContext,
		stream: vscode.ChatResponseStream,
		newLevel: number
	): Promise<void> {
		try {
			// Get or create user profile
			let userProfile = context.getUserProfile() || {};
			const oldLevel = userProfile.yearLevel || 2;

			// Update the profile
			userProfile.yearLevel = newLevel;
			userProfile.lastUpdated = new Date().toISOString();

			// Save to global state
			await context.updateUserProfile(userProfile);

			// Show confirmation with description
			const description = this.getLevelDescription(newLevel);
			const emoji = this.getLevelEmoji(newLevel);

			stream.markdown(`## ${emoji} Niveau Gewijzigd!\n\n`);
			stream.markdown(`✅ Je niveau is bijgewerkt van **${this.getLevelName(oldLevel)}** naar **${this.getLevelName(newLevel)}**\n\n`);
			stream.markdown(`### ${this.getLevelName(newLevel)}\n`);
			stream.markdown(`${description}\n\n`);

			// Show what changes
			stream.markdown(`### 📝 Wat verandert er?\n`);
			stream.markdown(`- **Uitleggen**: ${this.getExplanationStyle(newLevel)}\n`);
			stream.markdown(`- **Feedback**: ${this.getFeedbackStyle(newLevel)}\n`);
			stream.markdown(`- **Oefeningen**: ${this.getExerciseStyle(newLevel)}\n\n`);

			stream.markdown(`Veel succes! 🚀\n`);

			context.trackProgress('level');
		} catch (error) {
			console.error('Error setting level:', error);
			stream.markdown(`❌ Kon je niveau niet opslaan. Probeer het opnieuw.\n`);
			context.trackProgress('level');
		}
	}

	/**
	 * Show current level and options
	 */
	private async showCurrentLevel(
		context: ChatContext,
		stream: vscode.ChatResponseStream
	): Promise<void> {
		const currentLevel = context.yearLevel;
		const emoji = this.getLevelEmoji(currentLevel);

		stream.markdown(`## ${emoji} Je Huidige Niveau\n\n`);
		stream.markdown(`Je bent ingesteld als **${this.getLevelName(currentLevel)}** student.\n\n`);

		stream.markdown(`### 📊 Alle Niveaus\n\n`);
		this.showLevelOptions(stream);

		stream.markdown(`### 💡 Hoe Wijzigen?\n`);
		stream.markdown(`Type bijvoorbeeld: \`@tutor /level 3\` om naar derdejaars over te stappen.\n`);

		context.trackProgress('level');
	}

	/**
	 * Show all level options
	 */
	private showLevelOptions(stream: vscode.ChatResponseStream): void {
		for (let i = 1; i <= 4; i++) {
			const emoji = this.getLevelEmoji(i);
			const name = this.getLevelName(i);
			const description = this.getLevelDescription(i);

			stream.markdown(`**${emoji} ${name}** - ${description}\n`);
		}

		stream.markdown(`\n`);
	}

	/**
	 * Get emoji for level
	 */
	private getLevelEmoji(level: number): string {
		const emojis: Record<number, string> = {
			1: '🌱',
			2: '📈',
			3: '⭐',
			4: '🏆'
		};
		return emojis[level] || '📚';
	}

	/**
	 * Get name for level
	 */
	private getLevelName(level: number): string {
		const names: Record<number, string> = {
			1: 'Eerstejaars (Beginner)',
			2: 'Tweedejaars (Intermediate)',
			3: 'Derdejaars (Advanced)',
			4: 'Vierdejaars (Expert)'
		};
		return names[level] || 'Unknown';
	}

	/**
	 * Get description for level
	 */
	private getLevelDescription(level: number): string {
		const descriptions: Record<number, string> = {
			1: 'Je bent net begonnen. Fundamentals zijn het belangrijkst. Veel voorbeelden en uitleg.',
			2: 'Je hebt basis kennis. Focus op praktische projecten en best practices.',
			3: 'Je kunt goed programmeren. Tijd voor advanced patterns en system design.',
			4: 'Je bent expert. Focus op research, cutting-edge tech en specialisaties.'
		};
		return descriptions[level] || 'Unknown level';
	}

	/**
	 * Get explanation style for level
	 */
	private getExplanationStyle(level: number): string {
		const styles: Record<number, string> = {
			1: 'Heel gedetailleerd, veel voorbeelden, stap voor stap',
			2: 'Praktisch gericht, met enkele voorbeelden',
			3: 'Technisch, met aandacht voor details',
			4: 'Geavanceerd, met onderliggende principes'
		};
		return styles[level] || 'Standard';
	}

	/**
	 * Get feedback style for level
	 */
	private getFeedbackStyle(level: number): string {
		const styles: Record<number, string> = {
			1: 'Veel hints, aanmoediging, kleine stappen',
			2: 'Praktische tips, debugging techniques',
			3: 'Specifieke feedback, design patterns',
			4: 'Geavanceerde optimalisaties en best practices'
		};
		return styles[level] || 'Standard';
	}

	/**
	 * Get exercise style for level
	 */
	private getExerciseStyle(level: number): string {
		const styles: Record<number, string> = {
			1: 'Kleine, gefocuste oefeningen met veel begeleiding',
			2: 'Praktische projecten met realistische problemen',
			3: 'Complexere challenges met design vragen',
			4: 'Onderzoeks- en innovatieprojecten'
		};
		return styles[level] || 'Standard';
	}
}

