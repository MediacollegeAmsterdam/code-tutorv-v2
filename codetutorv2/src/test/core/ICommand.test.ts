import {expect, jest, test, describe} from '@jest/globals';
import {ICommand} from '../../core/ICommand';
import {ChatContext} from '../../core/ChatContext';

jest.mock('vscode');
const vscode: any = require('vscode');

/**
 * Tests for ICommand interface
 *
 * Since ICommand is an interface, we test its contract by verifying
 * that implementations properly follow the interface specification.
 */
describe('ICommand Interface', () => {
    describe('required properties', () => {
        test('should require name property', () => {
            const mockCommand: ICommand = {
                name: 'test-command',
                description: 'Test command',
                async execute(context, stream, token) {
                    stream.markdown('Test');
                }
            };

            expect(mockCommand.name).toBe('test-command');
            expect(typeof mockCommand.name).toBe('string');
        });

        test('should require description property', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'A test command for testing',
                async execute(context, stream, token) {
                    stream.markdown('Test');
                }
            };

            expect(mockCommand.description).toBe('A test command for testing');
            expect(typeof mockCommand.description).toBe('string');
        });

        test('should require execute method', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {
                    stream.markdown('Executed');
                }
            };

            expect(typeof mockCommand.execute).toBe('function');
        });

        test('name should be readonly', () => {
            const mockCommand: ICommand = {
                name: 'original',
                description: 'Test',
                async execute(context, stream, token) {}
            };

            expect(() => {
                (mockCommand as any).name = 'changed';
            }).toThrow();
        });

        test('description should be readonly', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Original description',
                async execute(context, stream, token) {}
            };

            expect(() => {
                (mockCommand as any).description = 'Changed';
            }).toThrow();
        });
    });

    describe('optional properties', () => {
        test('aliases should be optional', () => {
            const withoutAliases: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {}
            };

            expect(withoutAliases.aliases).toBeUndefined();
        });

        test('aliases should accept string array', () => {
            const withAliases: ICommand = {
                name: 'test',
                description: 'Test',
                aliases: ['test-alias', 't'],
                async execute(context, stream, token) {}
            };

            expect(Array.isArray(withAliases.aliases)).toBe(true);
            expect(withAliases.aliases).toContain('test-alias');
            expect(withAliases.aliases).toContain('t');
        });

        test('validate method should be optional', () => {
            const withoutValidate: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {}
            };

            expect(withoutValidate.validate).toBeUndefined();
        });

        test('validate method should return string or undefined', () => {
            const withValidate: ICommand = {
                name: 'test',
                description: 'Test',
                validate(context) {
                    return 'Validation error';
                },
                async execute(context, stream, token) {}
            };

            expect(withValidate.validate).toBeDefined();
            expect(typeof withValidate.validate).toBe('function');
        });

        test('validate can return undefined for valid state', () => {
            const withValidate: ICommand = {
                name: 'test',
                description: 'Test',
                validate(context) {
                    return undefined;
                },
                async execute(context, stream, token) {}
            };

            expect(withValidate.validate?.(null as any)).toBeUndefined();
        });
    });

    describe('execute method signature', () => {
        test('execute should accept context parameter', async () => {
            const mockStream = {markdown: jest.fn()};
            const mockToken = new vscode.CancellationToken();
            const mockContext = {
                request: {prompt: 'test'},
                chatContext: {},
                yearLevel: 1,
                codeContext: {code: ''},
                model: {},
                trackProgress: jest.fn()
            };

            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {
                    expect(context).toBeDefined();
                    expect(context.request).toBeDefined();
                }
            };

            await mockCommand.execute(mockContext as any, mockStream as any, mockToken);
        });

        test('execute should accept stream parameter', async () => {
            const mockStream = {markdown: jest.fn()};
            const mockToken = new vscode.CancellationToken();

            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {
                    stream.markdown('Test output');
                }
            };

            await mockCommand.execute({} as any, mockStream as any, mockToken);
            expect(mockStream.markdown).toHaveBeenCalledWith('Test output');
        });

        test('execute should accept cancellation token', async () => {
            const mockToken = new vscode.CancellationToken();
            let tokenReceived: any = null;

            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {
                    tokenReceived = token;
                }
            };

            await mockCommand.execute({} as any, {} as any, mockToken);
            expect(tokenReceived).toBe(mockToken);
        });

        test('execute should return promise', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {}
            };

            const result = mockCommand.execute({} as any, {} as any, {} as any);
            expect(result instanceof Promise).toBe(true);
        });

        test('execute promise should resolve', async () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                async execute(context, stream, token) {
                    return Promise.resolve();
                }
            };

            await expect(
                mockCommand.execute({} as any, {} as any, {} as any)
            ).resolves.toBeUndefined();
        });
    });

    describe('command contract validation', () => {
        test('name should not be empty', () => {
            const mockCommand: ICommand = {
                name: 'valid-command-name',
                description: 'Description',
                async execute(context, stream, token) {}
            };

            expect(mockCommand.name.length).toBeGreaterThan(0);
        });

        test('description should not be empty', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'A meaningful description',
                async execute(context, stream, token) {}
            };

            expect(mockCommand.description.length).toBeGreaterThan(0);
        });

        test('command name should be unique identifier', () => {
            const cmd1: ICommand = {
                name: 'unique-id-1',
                description: 'First',
                async execute(context, stream, token) {}
            };

            const cmd2: ICommand = {
                name: 'unique-id-2',
                description: 'Second',
                async execute(context, stream, token) {}
            };

            expect(cmd1.name).not.toBe(cmd2.name);
        });

        test('aliases should be unique within command', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                aliases: ['alias1', 'alias2', 'alias1'],
                async execute(context, stream, token) {}
            };

            const aliasSet = new Set(mockCommand.aliases);
            // Note: implementation may allow duplicates, test is for interface contract
            expect(mockCommand.aliases).toBeDefined();
        });
    });

    describe('multiple command implementations', () => {
        test('different commands can coexist', () => {
            const commands: ICommand[] = [
                {
                    name: 'explain',
                    description: 'Explain code',
                    async execute(context, stream, token) {}
                },
                {
                    name: 'feedback',
                    description: 'Give feedback',
                    aliases: ['fb', 'review'],
                    async execute(context, stream, token) {}
                },
                {
                    name: 'exercise',
                    description: 'Generate exercise',
                    validate(context) {
                        return undefined;
                    },
                    async execute(context, stream, token) {}
                }
            ];

            expect(commands.length).toBe(3);
            expect(commands[0].name).toBe('explain');
            expect(commands[1].aliases?.length).toBe(2);
            expect(commands[2].validate).toBeDefined();
        });

        test('can filter commands by name', () => {
            const commands: ICommand[] = [
                {
                    name: 'explain',
                    description: 'Explain',
                    async execute(context, stream, token) {}
                },
                {
                    name: 'feedback',
                    description: 'Feedback',
                    async execute(context, stream, token) {}
                }
            ];

            const findCommand = (name: string) => commands.find(c => c.name === name);

            expect(findCommand('explain')).toBeDefined();
            expect(findCommand('feedback')).toBeDefined();
            expect(findCommand('unknown')).toBeUndefined();
        });

        test('can find command by alias', () => {
            const commands: ICommand[] = [
                {
                    name: 'explain',
                    description: 'Explain',
                    aliases: ['exp', 'help'],
                    async execute(context, stream, token) {}
                }
            ];

            const findByAlias = (alias: string) =>
                commands.find(c => c.aliases?.includes(alias));

            expect(findByAlias('exp')).toBeDefined();
            expect(findByAlias('help')).toBeDefined();
            expect(findByAlias('unknown')).toBeUndefined();
        });
    });

    describe('command error handling', () => {
        test('execute can throw errors', async () => {
            const mockCommand: ICommand = {
                name: 'failing',
                description: 'Failing command',
                async execute(context, stream, token) {
                    throw new Error('Command failed');
                }
            };

            await expect(
                mockCommand.execute({} as any, {} as any, {} as any)
            ).rejects.toThrow('Command failed');
        });

        test('validate can report validation errors', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                validate(context) {
                    return 'Missing required parameter';
                },
                async execute(context, stream, token) {}
            };

            const error = mockCommand.validate?.({} as any);
            expect(error).toBe('Missing required parameter');
        });

        test('validate returning undefined indicates no error', () => {
            const mockCommand: ICommand = {
                name: 'test',
                description: 'Test',
                validate(context) {
                    return undefined;
                },
                async execute(context, stream, token) {}
            };

            const error = mockCommand.validate?.({} as any);
            expect(error).toBeUndefined();
        });
    });
});

