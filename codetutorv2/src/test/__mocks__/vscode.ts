// Minimal mock of vscode surface used by the commands
const mock = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    activeTextEditor: null
  },
  workspace: {
    getConfiguration: jest.fn(() => ({ get: jest.fn(() => undefined) }))
  },
  chat: {
    createChatParticipant: jest.fn()
  },
  lm: {
    selectChatModels: jest.fn()
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path, path: path }))
  },
  ChatResponseStream: class {
    markdown = jest.fn();
  },
  LanguageModelChatMessage: {
    User: (text: string) => ({ role: 'user', content: text }),
    Assistant: (text: string) => ({ role: 'assistant', content: text })
  },
  CancellationToken: class {},
  CancellationTokenSource: class {
    constructor() {
      this.token = {};
    }
    token: any;
  },
  LanguageModelChat: class {
    async sendRequest() {
      return {
        text: (async function* () { yield 'ok'; })()
      };
    }
  }
};

module.exports = mock;

