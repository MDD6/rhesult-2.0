/**
 * HTTP Client with Retry Logic and Error Handling
 * Implements the Retry Pattern and Adapter Pattern
 * Provides a centralized way to make HTTP requests with consistent error handling
 */

import { AppError, ErrorCode, HttpStatusCode, parseError } from "../errors/AppError";
import { API_CONFIG } from "../constants/app";

export interface HttpRequestConfig<T = unknown> {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: T;
  timeout?: number;
  retryAttempts?: number;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * HttpClient with retry logic, timeout handling, and error management
 */
export class HttpClient {
  private readonly baseURL: string;
  private defaultTimeout: number;
  private defaultRetryAttempts: number;

  constructor(
    baseURL: string = API_CONFIG.BASE_URL,
    timeout: number = API_CONFIG.TIMEOUT,
    retryAttempts: number = API_CONFIG.RETRY_ATTEMPTS,
  ) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    this.defaultRetryAttempts = retryAttempts;
  }

  /**
   * Makes an HTTP GET request
   */
  async get<T>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: "GET" });
  }

  /**
   * Makes an HTTP POST request
   */
  async post<T, R = unknown>(url: string, body: T, config?: HttpRequestConfig): Promise<HttpResponse<R>> {
    return this.request<R>(url, { ...config, method: "POST", body });
  }

  /**
   * Makes an HTTP PUT request
   */
  async put<T, R = unknown>(url: string, body: T, config?: HttpRequestConfig): Promise<HttpResponse<R>> {
    return this.request<R>(url, { ...config, method: "PUT", body });
  }

  /**
   * Makes an HTTP DELETE request
   */
  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: "DELETE" });
  }

  /**
   * Core request method with retry logic and error handling
   */
  private async request<T>(
    url: string,
    config: HttpRequestConfig = {},
  ): Promise<HttpResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retryAttempts = this.defaultRetryAttempts,
    } = config;

    const fullUrl = this.buildUrl(url);
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await this.executeRequest<T>(fullUrl, {
          method,
          headers,
          body,
          timeout,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors (4xx) or last attempt
        if (this.isClientError(error) || attempt === retryAttempts) {
          throw error;
        }

        // Exponential backoff
        const delayMs = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        await this.sleep(delayMs);
      }
    }

    throw lastError || new Error("Request failed");
  }

  /**
   * Executes the actual fetch request
   */
  private async executeRequest<T>(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: unknown;
      timeout: number;
    },
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw this.createHttpError(response);
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : ({} as T);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      throw this.handleFetchError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Creates an AppError from HTTP response
   */
  private createHttpError(response: Response): AppError {
    let statusCode: HttpStatusCode;

    switch (response.status) {
      case 400:
        statusCode = HttpStatusCode.BAD_REQUEST;
        break;
      case 401:
        statusCode = HttpStatusCode.UNAUTHORIZED;
        break;
      case 403:
        statusCode = HttpStatusCode.FORBIDDEN;
        break;
      case 404:
        statusCode = HttpStatusCode.NOT_FOUND;
        break;
      case 409:
        statusCode = HttpStatusCode.CONFLICT;
        break;
      default:
        statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    }

    return new AppError({
      code: this.mapStatusToErrorCode(statusCode),
      message: `HTTP ${response.status}: ${response.statusText}`,
      statusCode,
    });
  }

  /**
   * Handles fetch errors (network, timeout, etc.)
   */
  private handleFetchError(error: unknown): AppError {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new AppError({
        code: ErrorCode.TIMEOUT_ERROR,
        message: "Request timeout",
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      });
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      return new AppError({
        code: ErrorCode.NETWORK_ERROR,
        message: "Network error occurred",
        statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      });
    }

    return parseError(error);
  }

  /**
   * Checks if error is a client error (4xx)
   */
  private isClientError(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
  }

  /**
   * Maps HTTP status code to ErrorCode
   */
  private mapStatusToErrorCode(statusCode: HttpStatusCode): ErrorCode {
    switch (statusCode) {
      case HttpStatusCode.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatusCode.UNAUTHORIZED:
        return ErrorCode.AUTHENTICATION_ERROR;
      case HttpStatusCode.FORBIDDEN:
        return ErrorCode.AUTHORIZATION_ERROR;
      case HttpStatusCode.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatusCode.CONFLICT:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Builds full URL from relative path
   */
  private buildUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${this.baseURL}${path}`;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for global use
 */
export const httpClient = new HttpClient();
