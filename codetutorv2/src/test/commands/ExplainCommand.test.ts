import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// use the local mock for vscode
jest.mock('vscode');
const vscode: any = require('vscode');

import { ExplainCommand } from '../../commands/ExplainCommand';

describe('ExplainCommand', () => {
  let cmd: ExplainCommand;
  let stream: any;
  let context: any;

  beforeEach(() => {
    cmd = new ExplainCommand();
    stream = { markdown: jest.fn() };
    context = {
      request: { prompt: 'Wat is een closure?' },
      chatContext: {},
      yearLevel: 1,
      codeContext: { code: 'const x = 1;' },
      model: new vscode.LanguageModelChat(),
      trackProgress: jest.fn()
    };
  });

  test('explain streams response and tracks progress', async () => {
    await cmd.execute(context, stream, new vscode.CancellationToken());
    expect(stream.markdown).toHaveBeenCalled();
    expect(context.trackProgress).toHaveBeenCalledWith('explain');
  });
});
