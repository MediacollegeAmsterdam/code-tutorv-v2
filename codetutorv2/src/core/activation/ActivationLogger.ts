import * as vscode  from "vscode";

/**
 * ActivationLogger - Handles timestamped logging during extension activation
 *
 * Provides consistent, timestamped logging to both the Output channel and console
 * for diagnostic purposes during startup.
 */
export class ActivationLogger{
    private startMs: number;
    private outputChannel: vscode.OutputChannel;


    constructor(outputChannerl: vscode.OutputChannel, startMs: number) {
        this.outputChannel = outputChannerl;
        this.startMs = startMs;
    }

    /**
     * Log a message with elapsed time since activation start
     */
    log(message: string): void {
        const elapsedMs = Date.now() - this.startMs;
        const line = `[activation +${elapsedMs}ms] ${message}`;
        this.outputChannel.appendLine(line);
        console.log(line);
    }

    /**
     * Get elapsed milliseconds since activation start
     */
    getElapsedMs(): number {
        return Date.now() - this.startMs;
    }

    /**
     * Show the output channel
     */
    show(): void {
        this.outputChannel.show();
    }
}