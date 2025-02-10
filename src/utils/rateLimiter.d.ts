export declare class RateLimiter {
    private attempts;
    private maxAttempts;
    private timeWindow;
    constructor(maxAttempts?: number, timeWindow?: number);
    isRateLimited(key: string): boolean;
}
