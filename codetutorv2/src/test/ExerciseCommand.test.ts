import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExerciseCommand } from '../commands/ExerciseCommand';

suite('Exercise Command Test Suite', () => {
    vscode.window.showInformationMessage('Exercise Command Test Started.');

    test('generateExercise should stream example code and exercise content', async () => {
        const command = new ExerciseCommand();

        // Capture markdown calls
        const messages: string[] = [];
        const stream: any = {
            markdown: (m: string) => messages.push(m)
        };

        // Mock model that returns an async iterable response.text
        const mockResponse = {
            // async iterable that yields a code example and exercise text
            text: (async function* () {
                yield '### 💻 Voorbeeld\n```js\nconsole.log("hello world");\n```\n\n';
                yield '### 📝 Oefening\nMaak een eenvoudige functie die X doet.';
            })()
        };

        const mockModel: any = {
            id: 'mock-model',
            name: 'Mock Model',
            sendRequest: async (_messages: any, _opts: any, _token: any) => {
                return mockResponse;
            }
        };

        // Minimal fake context object used by the command
        const context: any = {
            request: { prompt: 'hi' }, // short prompt -> generateExercise path (see current command logic)
            chatContext: { history: [] },
            yearLevel: 1,
            model: mockModel,
            trackProgress: (_: string) => { /* noop */ }
        };

        const token: any = { isCancellationRequested: false };

        await command.execute(context, stream as vscode.ChatResponseStream, token as vscode.CancellationToken);

        // The first message should indicate generation started
        assert.ok(messages.length > 0, 'No markdown messages were streamed');
        assert.ok(messages[0].startsWith('## 🎯 Oefening aan het genereren'), 'Did not start generation');

        // The response fragments must include the example code block and exercise header
        const joined = messages.join('\n');
        assert.ok(joined.includes('### 💻 Voorbeeld'), 'Example section not included');
        assert.ok(joined.includes('```js'), 'Code block not included in streamed output');
        assert.ok(joined.includes('### 📝 Oefening'), 'Exercise section not included');
    });

    test('showSuggestions should stream suggestions when prompt indicates generation', async () => {
        const command = new ExerciseCommand();

        const messages: string[] = [];
        const stream: any = {
            markdown: (m: string) => messages.push(m)
        };

        const mockResponse = {
            text: (async function* () {
                yield '### 💪 Suggesties voor jou:\n**1. Loops** - Leer hoe je herhalingen gebruikt.';
            })()
        };

        const mockModel: any = {
            id: 'mock-model',
            name: 'Mock Model',
            sendRequest: async () => mockResponse
        };

        // Prompt contains a keyword so current command logic routes to showSuggestions
        const context: any = {
            request: { prompt: 'Geef me een oefening over loops' },
            chatContext: { history: [] },
            yearLevel: 2,
            model: mockModel,
            trackProgress: (_: string) => { /* noop */ }
        };

        const token: any = { isCancellationRequested: false };

        await command.execute(context, stream as vscode.ChatResponseStream, token as vscode.CancellationToken);

        assert.ok(messages.length > 0, 'No markdown messages were streamed for suggestions');
        const joined = messages.join('\n');
        assert.ok(joined.includes('## 🎯 Oefeningen'), 'Suggestions header not present');
        assert.ok(joined.includes('Suggesties voor jou') || joined.includes('Loops'), 'Suggestion content not streamed');
    });

});
