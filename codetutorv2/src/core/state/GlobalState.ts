
export class GlobalState{

    // Feature instances - using any to avoid circular imports
    assignmentFeature: any | undefined;
    // Assignment action tracking
    lastAssignmentAction: { action: string; assignmentId: string; timestamp: string } | null = null;


}

// Singleton instance
let globalStateInstance: GlobalState | undefined;

/**
 * Get or create the global state instance
 */
export function getGlobalState(): GlobalState {
    if (!globalStateInstance) {
        globalStateInstance = new GlobalState();
    }
    return globalStateInstance;
}