import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';
import {buildChatMessages, sendChatRequest} from '../core/chat-utils';

/**
 * Exercise Command - Generate or suggest programming exercises
 *
 * Generates custom programming exercises based on user requests using AI.
 *
 * Usage:
 *   Generate: @tutor /exercise Geef me een oefening over loops
 *   Suggest: @tutor /exercise
 *
 * Features:
 *   - AI-powered exercise generation
 *   - Difficulty adaptation based on student year level
 *   - Structured exercises with learning outcomes
 *   - Hints and tips included
 *   - Markdown formatted output
 *
 * Priority: P1 (Core learning feature)
 */
export class ExerciseCommand implements ICommand {
    readonly name = 'exercise';
    readonly description = 'Genereer of bekijk oefeningen';
    readonly aliases = ['exercises', 'oefening'];

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const userQuery = context.request.prompt.toLowerCase().trim();

        // Check if user is asking to generate an exercise
        const isGenerating = userQuery.length > 3 &&
            (userQuery.includes('geef') || userQuery.includes('maak') ||
                userQuery.includes('give') || userQuery.includes('create') ||
                userQuery.includes('generate') || userQuery.includes('oefening') ||
                userQuery.includes('assignment') || userQuery.includes('exercise'));

        if (isGenerating) {
            // Generate a new exercise based on the user's request
            await this.generateExercise(context, stream, token);
        } else {
            // Show exercise suggestions
            await this.showSuggestions(context, stream, token);
        }
    }

    /**
     * Generate a new exercise using AI with example
     */
    private async generateExercise(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown(`## 🎯 Oefening aan het genereren...\n\n`);
        try {
            const difficulty = this.getDifficultyForYear(context.yearLevel);
            const difficultyText = this.getDifficultyDescription(context.yearLevel);

            // Extract the topic
            let topic = context.request.prompt;
            topic = topic.replace(/geef\s+me\s+een\s+oefening\s+over\s+|give\s+me\s+an\s+exercise\s+about\s+|geef\s+een\s+oefening\s+over\s+/gi, '').trim();

            // Generate BOTH example and exercise in ONE request
            const basePrompt = `Je bent een expert programmeerleraar. Maak een oefening voor ${difficultyText} studenten over: "${topic}"

JE MOET DEZE EXACTE STRUCTUUR VOLGEN - GEEN UITZONDERINGEN:

STAP 1 - Begin met deze sectie:


### 💻 Voorbeeld

\`\`\`javascript
// [Schrijf hier 5-15 regels werkende code voor ${difficulty} niveau]
// [Met Nederlands commentaar]
\`\`\`

**Output:**
\`\`\`
[Toon hier de output van de code]
\`\`\`

STAP 2 - Daarna volgt dit:

---

### 📝 Oefening

## 📚 ${topic.charAt(0).toUpperCase() + topic.slice(1)} Oefening

**Niveau:** ${difficulty.toUpperCase()}  
**Geschatte tijd:** 45-60 minuten

### 🎯 Lesdoelen
- Lesdoel 1
- Lesdoel 2  
- Lesdoel 3

### 📖 Context & Inleiding
Uitleg waarom dit belangrijk is.

### 🚀 Hoofd Opdracht
Wat de student moet doen.

### 📋 Stap-voor-stap
1. **Voorbereiding**: Setup stap
2. **Taak 1**: Eerste taak
3. **Taak 2**: Tweede taak
4. **Taak 3**: Derde taak

### 💡 Hints
- **Voor taak 1**: Hint 1
- **Voor taak 2**: Hint 2
- **Voor taak 3**: Hint 3

### 📚 Nuttige Resources
- Resource 1
- Resource 2

### ✅ Klaar om in te dienen?
- [ ] Alle taken afgemaakt
- [ ] Code schoon en opgemaakt
- [ ] Getest en werkend

NU GENEREER JE HET ANTWOORD MET ECHTE CODE EN INHOUD:`;

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                context.request.prompt,
                ''
            );

            const response = await sendChatRequest(context.model, messages, token, stream);
            if (response) {
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                }
                stream.markdown(`\n\n---\n\n`);
                stream.markdown(`💡 **Tip:** Vraag me om /feedback als je hulp nodig hebt bij het oplossen!\n`);
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error('Error generating exercise:', error);
            stream.markdown(`❌ Kon de oefening niet genereren. Probeer het opnieuw.\n`);
            context.trackProgress('exercise');
        }
    }


    /**
     * Show exercise suggestions and guidance
     */
    private async showSuggestions(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown(`## 🎯 Oefeningen\n\n`);

        try {
            const basePrompt = `Je bent een programmeerleraar. Geef 3-4 interessante oefening suggesties die goed passen voor ${this.getDifficultyDescription(context.yearLevel)} students.

Maak het leuk en inspirerend. Kort en direct. Gebruik deze format:

### 💪 Suggesties voor jou:

**1. [Onderwerp 1]** - [1 zin wat je leert]
**2. [Onderwerp 2]** - [1 zin wat je leert]
**3. [Onderwerp 3]** - [1 zin wat je leert]
**4. [Onderwerp 4]** - [1 zin wat je leert]

💬 Zeg bijvoorbeeld: "Geef me een oefening over loops" en ik maak er één voor je!`;

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                'Geef suggesties voor interessante oefeningen',
                ''
            );

            const response = await sendChatRequest(context.model, messages, token, stream);
            if (response) {
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                }
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error('Error showing suggestions:', error);
            stream.markdown(`❌ Kon suggesties niet laden.\n`);
            context.trackProgress('exercise');
        }
    }

    /**
     * Get difficulty level based on year
     */
    private getDifficultyForYear(yearLevel: number): string {
        const map: Record<number, string> = {
            1: 'beginner',
            2: 'intermediate',
            3: 'advanced',
            4: 'advanced'
        };
        return map[yearLevel] || 'intermediate';
    }

    /**
     * Get difficulty description for year level
     */
    private getDifficultyDescription(yearLevel: number): string {
        const descriptions: Record<number, string> = {
            1: 'eerstejaars',
            2: 'tweedejaars',
            3: 'derdejaars',
            4: 'vierdejaars / professionals'
        };
        return descriptions[yearLevel] || 'intermediate';
    }
}

