import {expect, jest, test, describe, beforeEach} from '@jest/globals';

// use the local mock for vscode
jest.mock('vscode');
const vscode: any = require('vscode');

import {ExerciseCommand} from '../../commands/ExerciseCommand';

describe('ExerciseCommand', () => {
    let cmd: ExerciseCommand;
    let stream: any;
    let context: any;

    beforeEach(() => {
        cmd = new ExerciseCommand();
        stream = {markdown: jest.fn()};
        context = {
            request: {prompt: 'Give me an exercise'},
            chatContext: {},
            yearLevel: 1,
            codeContext: {code: 'const x += 1'},
            model: new vscode.LanguageModelChat(),
            trackProgress: jest.fn()
        };
    });

    test('generate exercise writes markdown and tracks progress', async () => {
        await cmd.execute(context, stream, new vscode.CancellationToken());
        expect(stream.markdown).toHaveBeenCalled();
        expect(context.request.prompt).toBe('Give me an exercise');
        expect(context.trackProgress).toHaveBeenCalledWith('exercise');
    });
});
