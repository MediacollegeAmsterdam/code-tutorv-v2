import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('vscode', () => require('../__mocks__/vscode'));
const vscode: any = require('vscode');

import { FeedbackCommand } from '../../commands/FeedbackCommand';

describe('FeedbackCommand', () => {
  let cmd: FeedbackCommand;
  let stream: any;
  let context: any;

  beforeEach(() => {
    cmd = new FeedbackCommand();
    stream = { markdown: jest.fn() };
    context = {
      request: { prompt: 'Mijn code geeft een fout' },
      chatContext: {},
      yearLevel: 2,
      codeContext: { code: '```javascript\nconsole.log("hi")\n```', language: 'javascript' },
      model: new vscode.LanguageModelChat(),
      trackProgress: jest.fn()
    };
  });

  test('feedback returns progressive content and tracks progress', async () => {
    await cmd.execute(context, stream, new vscode.CancellationToken());
    expect(stream.markdown).toHaveBeenCalled();
    expect(context.trackProgress).toHaveBeenCalledWith('feedback');
  });
});

