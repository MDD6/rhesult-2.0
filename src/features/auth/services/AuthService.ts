/**
 * Auth Service - Improved Implementation
 * Uses HttpClient, AppError, and Adapter pattern
 * Demonstrates best practices for API integration
 */

import { httpClient } from "@/shared/utils/HttpClient";
import { AppError, ErrorCode, HttpStatusCode } from "@/shared/errors/AppError";
import { ENDPOINT, AUTH_CONFIG } from "@/shared/constants/app";
import { LoginRequest, LoginResponse, User } from "@/shared/types/domain";

/**
 * Authentication service
 * Handles all authentication-related API calls
 */
export class AuthService {
  /**
   * Login with email and password
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginRequest, LoginResponse>(
        ENDPOINT.AUTH_LOGIN,
        credentials,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === ErrorCode.AUTHENTICATION_ERROR) {
          throw new AppError({
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: "Invalid email or password",
            statusCode: HttpStatusCode.UNAUTHORIZED,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Logout and clear auth state
   */
  static async logout(): Promise<void> {
    try {
      // Optional: Call backend logout endpoint
      // await httpClient.post(ENDPOINT.AUTH_LOGOUT, {});
    } catch (error) {
      console.warn("Logout error:", error);
      // Don't throw on logout failure
    } finally {
      // Always clear local auth state
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      }
    }
  }

  /**
   * Get the current token from storage
   */
  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  }

  /**
   * Get the current user from storage
   */
  static getUser(): User | null {
    if (typeof window === "undefined") return null;

    const userJson = localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null && this.getUser() !== null;
  }

  /**
   * Verify token with backend (optional)
   */
  static async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await httpClient.get(ENDPOINT.AUTH_VERIFY, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }
}
