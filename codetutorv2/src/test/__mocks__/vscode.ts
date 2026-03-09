// Minimal mock of vscode surface used by the commands
const mock = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn(() => ({ get: () => undefined }))
  },
  ChatResponseStream: class {
    markdown = jest.fn();
  },
  LanguageModelChatMessage: {
    User: (text: string) => ({ role: 'user', content: text })
  },
  CancellationToken: class {},
  LanguageModelChat: class {
    async sendRequest() {
      return {
        text: (async function* () { yield 'ok'; })()
      };
    }
  }
};

module.exports = mock;

