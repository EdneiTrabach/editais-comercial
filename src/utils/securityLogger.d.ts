export declare class SecurityLogger {
    private static logToServer;
    static logLoginAttempt(userId: string, success: boolean, ip?: string): void;
    static logSuspiciousActivity(details: any, userId?: string): void;
}
