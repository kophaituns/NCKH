// Custom error class for API errors
export class APIError extends Error {
  public status: number;
  public data: any;
  public isNetworkError: boolean;
  public isRateLimit: boolean;

  constructor(message, details: { 
    status: number; 
    data: any;
    isNetworkError: boolean;
    isRateLimit: boolean;
  }) {
    super(message);
    this.name = 'APIError';
    this.status = details?.status;
    this.data = details?.data;
    this.isNetworkError = details?.isNetworkError;
    this.isRateLimit = details?.isRateLimit;
  }
}

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

// Logger service
class LoggerService {
  private static instance: LoggerService;
  private logs: Array<{
    timestamp: Date;
    level: LogLevel;
    message: string;
    data: any;
  }> = [];

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public log(level, message, data?): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === LogLevel.ERROR ? console.error :
                       level === LogLevel.WARNING ? console.warn :
                       console.log;
      
      logMethod(`[${level}] ${message}`, data || '');
    }
  }

  public getRecentLogs(count: number = 100): Array<any> {
    return this.logs.slice(-count);
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Network service
class NetworkService {
  private static instance: NetworkService;
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(isOnline) => void> = [];

  private constructor() {
    window.addEventListener('online', () => this.handleConnectivityChange(true));
    window.addEventListener('offline', () => this.handleConnectivityChange(false));
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private handleConnectivityChange(online): void {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
  }

  public addListener(listener: (isOnline) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (isOnline) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public checkConnectivity(): boolean {
    return this.isOnline;
  }
}

export const logger = LoggerService.getInstance();
export const network = NetworkService.getInstance();