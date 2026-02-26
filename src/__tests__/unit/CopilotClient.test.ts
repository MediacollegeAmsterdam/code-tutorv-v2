import { CopilotClient } from '../../services/CopilotClient';

describe('CopilotClient', () => {
  const mockContext = {} as any;
  let client: CopilotClient;

  beforeEach(() => {
    client = new CopilotClient(mockContext);
  });

  it('should instantiate without error', () => {
    expect(client).toBeInstanceOf(CopilotClient);
  });

  it('should return a stubbed response for sendPrompt', async () => {
    const prompt = 'Explain closures in JavaScript.';
    const response = await client.sendPrompt(prompt);
    expect(response).toContain('AI response for prompt:');
    expect(response).toContain(prompt);
  });
});

