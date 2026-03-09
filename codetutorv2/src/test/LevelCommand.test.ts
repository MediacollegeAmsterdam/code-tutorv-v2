import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.mock('vscode');
const vscode: any = require('vscode');

import { LevelCommand } from '../commands/LevelCommand';

describe('LevelCommand', () => {
  let cmd: LevelCommand;
  let stream: any;
  let context: any;

  beforeEach(() => {
    cmd = new LevelCommand();
    stream = { markdown: jest.fn() };
    const globalState = new Map<string, any>();
    const extensionContext: any = {
      globalState: {
        get: (k: string) => ({ yearLevel: 2 }),
        update: jest.fn()
      }
    };

    context = {
      request: { prompt: '3' },
      chatContext: {},
      yearLevel: 2,
      codeContext: null,
      model: new vscode.LanguageModelChat(),
      extensionContext,
      getUserProfile: () => ({ yearLevel: 2 }),
      updateUserProfile: jest.fn(),
      trackProgress: jest.fn()
    };
  });

  test('set level updates profile and confirms', async () => {
    await cmd.execute(context, stream, new vscode.CancellationToken());
    expect(context.updateUserProfile).toHaveBeenCalled();
    expect(stream.markdown).toHaveBeenCalled();
    expect(context.trackProgress).toHaveBeenCalledWith('level');
  });
});
