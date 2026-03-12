import {expect, jest, test, describe, beforeEach, afterEach} from '@jest/globals';

jest.mock('vscode');
const vscode: any = require('vscode');

jest.mock('../../core/chat-utils', () => ({
    buildChatMessages: jest.fn(),
    sendChatRequest: jest.fn()
}));

import {ExerciseCommand} from '../../commands/ExerciseCommand';

describe('ExerciseCommand', () => {
    let cmd: ExerciseCommand;
    let stream: any;
    let context: any;
    let token: any;
    let sendChatRequest: any;
    let buildChatMessages: any;

    beforeEach(() => {
        cmd = new ExerciseCommand();
        stream = {markdown: jest.fn()};
        token = new vscode.CancellationToken();

        context = {
            request: {prompt: 'Give me an exercise'},
            chatContext: {history: []},
            yearLevel: 1,
            codeContext: {code: 'const x = 1;'},
            model: new vscode.LanguageModelChat(),
            trackProgress: jest.fn()
        };

        const chatUtils = require('../../core/chat-utils');
        sendChatRequest = chatUtils.sendChatRequest;
        buildChatMessages = chatUtils.buildChatMessages;

        jest.clearAllMocks();
        buildChatMessages.mockReturnValue([{role: 'user', content: 'test'}]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute method', () => {
        test('should call generateExercise when execute is called', async () => {
            const generateSpy = jest.spyOn(cmd as any, 'generateExercise').mockResolvedValue(undefined);

            await cmd.execute(context, stream, token);

            expect(generateSpy).toHaveBeenCalledWith(context, stream, token);
            generateSpy.mockRestore();
        });
    });

    describe('generateExercise method', () => {
        test('should stream initial message and track progress', async () => {
            const asyncGen = (async function* () { yield 'Exercise content'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(stream.markdown).toHaveBeenCalledWith(expect.stringContaining('🎯'));
            expect(context.trackProgress).toHaveBeenCalledWith('exercise');
        });

        test('should handle exercise with code context', async () => {
            context.codeContext = {code: 'function test() { return 1; }'};
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(sendChatRequest).toHaveBeenCalled();
            const prompt = buildChatMessages.mock.calls[0][0];
            expect(prompt).toContain('Code:');
        });

        test('should handle exercise without code context', async () => {
            context.codeContext = {code: ''};
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(sendChatRequest).toHaveBeenCalled();
        });

        test('should extract topic from prompt', async () => {
            context.request.prompt = 'geef me een oefening over loops';
            context.codeContext = {code: ''};
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            const prompt = buildChatMessages.mock.calls[0][0];
            expect(prompt).toContain('loops');
        });

        test('should use default topic when none provided', async () => {
            context.request.prompt = 'exercise';
            context.codeContext = {code: ''};
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            const prompt = buildChatMessages.mock.calls[0][0];
            expect(prompt).toContain('programmeren');
        });

        test('should handle different year levels', async () => {
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(buildChatMessages).toHaveBeenCalled();
        });

        test('should handle error during generation', async () => {
            sendChatRequest.mockRejectedValueOnce(new Error('API Error'));
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(stream.markdown).toHaveBeenCalledWith(expect.stringContaining('❌'));
            expect(context.trackProgress).toHaveBeenCalledWith('exercise');
        });

        test('should stream response content correctly', async () => {
            const asyncGen = (async function* () {
                yield 'Line 1\n';
                yield 'Line 2\n';
            })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            const calls = stream.markdown.mock.calls.filter((c: any[]) => c[0].includes('Line'));
            expect(calls.length).toBeGreaterThan(0);
        });
    });

    describe('createExerciseFile method', () => {
        beforeEach(() => {
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/workspace'}}];
            vscode.workspace.fs = {
                stat: (jest.fn() as any).mockResolvedValue(undefined),
                createDirectory: (jest.fn() as any).mockResolvedValue(undefined),
                writeFile: (jest.fn() as any).mockResolvedValue(undefined)
            };
            vscode.workspace.openTextDocument = (jest.fn() as any).mockResolvedValue({uri: 'file:///test.md'});
            vscode.window = vscode.window || {};
            vscode.commands = vscode.commands || {};
            vscode.commands.executeCommand = (jest.fn() as any).mockResolvedValue(undefined);
            vscode.window.showInformationMessage = jest.fn();
            vscode.window.showErrorMessage = jest.fn();
        });

        test('should create exercise file with correct content', async () => {
            const content = 'Exercise content';
            const topic = 'loops';
            const difficulty = 'beginner';

            await (cmd as any).createExerciseFile(content, topic, difficulty);

            expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
            const calls = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls;
            const [, fileContent]: any = calls[0];
            const text = new TextDecoder().decode(fileContent as Uint8Array);

            expect(text).toContain('📝 Oefening: loops');
            expect(text).toContain('beginner');
            expect(text).toContain('Exercise content');
        });

        test('should create exercises directory if not exists', async () => {
            ((vscode.workspace.fs.stat as jest.Mock).mockRejectedValueOnce as any)(new Error('Not found'));
            const content = 'content';

            await (cmd as any).createExerciseFile(content, 'topic', 'beginner');

            expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
        });

        test('should not try to create directory if it already exists', async () => {
            ((vscode.workspace.fs.stat as jest.Mock).mockResolvedValueOnce as any)(undefined);
            const content = 'content';

            await (cmd as any).createExerciseFile(content, 'topic', 'beginner');

            expect(vscode.workspace.fs.createDirectory).not.toHaveBeenCalled();
        });

        test('should open file in markdown preview', async () => {
            const content = 'Exercise content';

            await (cmd as any).createExerciseFile(content, 'loops', 'beginner');

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'markdown.showPreview',
                expect.any(Object)
            );
        });

        test('should show success notification', async () => {
            const content = 'Exercise content';

            await (cmd as any).createExerciseFile(content, 'loops', 'beginner');

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('✅')
            );
        });

        test('should skip file creation if content is empty', async () => {
            await (cmd as any).createExerciseFile('', 'topic', 'beginner');

            expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
        });

        test('should skip file creation if no workspace folder', async () => {
            vscode.workspace.workspaceFolders = null;
            const content = 'content';

            await (cmd as any).createExerciseFile(content, 'topic', 'beginner');

            expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
        });

        test('should handle file creation error gracefully', async () => {
            ((vscode.workspace.fs.writeFile as jest.Mock).mockRejectedValueOnce as any)(new Error('Write error'));
            const content = 'content';

            await (cmd as any).createExerciseFile(content, 'topic', 'beginner');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('❌')
            );
        });

        test('should include help section in markdown', async () => {
            const content = 'Exercise content';

            await (cmd as any).createExerciseFile(content, 'topic', 'beginner');

            const calls = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls;
            const [, fileContent]: any = calls[0];
            const text = new TextDecoder().decode(fileContent as Uint8Array);

            expect(text).toContain('💭 Hulp');
            expect(text).toContain('/hint');
            expect(text).toContain('/feedback');
        });

        test('should include date in markdown header', async () => {
            const content = 'Exercise content';

            await (cmd as any).createExerciseFile(content, 'loops', 'beginner');

            const calls = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls;
            const [, fileContent]: any = calls[0];
            const text = new TextDecoder().decode(fileContent as Uint8Array);

            expect(text).toContain('Datum:');
        });

        test('should fallback to "Programmeren" if topic is null', async () => {
            const content = 'Exercise content';

            await (cmd as any).createExerciseFile(content, '', 'beginner');

            const calls = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls;
            const [, fileContent]: any = calls[0];
            const text = new TextDecoder().decode(fileContent as Uint8Array);

            expect(text).toContain('Programmeren');
        });
    });

    describe('getDifficultyForYear method', () => {
        test('should return beginner for year 1', () => {
            const difficulty = (cmd as any).getDifficultyForYear(1);
            expect(difficulty).toBe('beginner');
        });

        test('should return intermediate for year 2', () => {
            const difficulty = (cmd as any).getDifficultyForYear(2);
            expect(difficulty).toBe('intermediate');
        });

        test('should return advanced for year 3', () => {
            const difficulty = (cmd as any).getDifficultyForYear(3);
            expect(difficulty).toBe('advanced');
        });

        test('should return advanced for year 4', () => {
            const difficulty = (cmd as any).getDifficultyForYear(4);
            expect(difficulty).toBe('advanced');
        });

        test('should return intermediate for unknown year', () => {
            const difficulty = (cmd as any).getDifficultyForYear(99);
            expect(difficulty).toBe('intermediate');
        });
    });

    describe('getDifficultyDescription method', () => {
        test('should return eerstejaars for year 1', () => {
            const desc = (cmd as any).getDifficultyDescription(1);
            expect(desc).toBe('eerstejaars');
        });

        test('should return tweedejaars for year 2', () => {
            const desc = (cmd as any).getDifficultyDescription(2);
            expect(desc).toBe('tweedejaars');
        });

        test('should return derdejaars for year 3', () => {
            const desc = (cmd as any).getDifficultyDescription(3);
            expect(desc).toBe('derdejaars');
        });

        test('should return vierdejaars for year 4', () => {
            const desc = (cmd as any).getDifficultyDescription(4);
            expect(desc).toBe('vierdejaars / professionals');
        });
    });

    describe('command metadata', () => {
        test('should have correct name', () => {
            expect(cmd.name).toBe('exercise');
        });

        test('should have correct description', () => {
            expect(cmd.description).toBe('Genereer of bekijk oefeningen');
        });

        test('should have correct aliases', () => {
            expect(cmd.aliases).toContain('exercises');
            expect(cmd.aliases).toContain('oefening');
        });
    });

    describe('edge cases', () => {
        test('should handle very long topic names', async () => {
            context.request.prompt = 'exercise ' + 'a'.repeat(200);
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(sendChatRequest).toHaveBeenCalled();
        });

        test('should handle special characters in topic', async () => {
            context.request.prompt = 'exercise über öops';
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(sendChatRequest).toHaveBeenCalled();
        });

        test('should handle null response from AI', async () => {
            sendChatRequest.mockResolvedValueOnce(null);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(context.trackProgress).toHaveBeenCalledWith('exercise');
        });

        test('should handle very large code context', async () => {
            context.codeContext = {code: 'const x = 1;\n'.repeat(1000)};
            const asyncGen = (async function* () { yield 'Exercise'; })();
            const mockResponse: any = {text: asyncGen};
            sendChatRequest.mockResolvedValueOnce(mockResponse);
            vscode.workspace.workspaceFolders = [{uri: {fsPath: '/test'}}];

            await (cmd as any).generateExercise(context, stream, token);

            expect(sendChatRequest).toHaveBeenCalled();
        });
    });
});

