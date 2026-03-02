import * as vscode  from "vscode";
import { ActivationLogger} from "./ActivationLogger";

/**
 * ActivationProgress - Manages progress reporting during extension activation
 *
 * Coordinates progress updates with the VS Code activation progress UI
 * and logs all progress steps for debugging.
 */
export class ActivationProgress {
    private progress: vscode.Progress<{ message?: string; increment?: number }>;
    private logger: ActivationLogger;

    constructor(
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        logger: ActivationLogger
    ) {
        this.progress = progress;
        this.logger = logger;
    }

    /**
     * Report progress with both UI update and logging
     *
     * @param message - The progress message to display
     * @param increment - Optional progress increment (0-100)
     */
    report(message: string, increment?: number): void {
        this.progress.report({ message, increment });
        this.logger.log(message);
    }
}