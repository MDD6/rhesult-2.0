/**
 * Validation Utility Module
 * Provides validation functions following SOLID principles
 * Enables easy extension and composition of validation rules
 */

import { AppError, ErrorCode, HttpStatusCode } from "../errors/AppError";

export type ValidationRule<T> = (value: T) => true | string;

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

/**
 * Validator class for data validation
 */
export class Validator {
  /**
   * Validates a single value against a rule
   */
  static validate<T>(value: T, rule: ValidationRule<T>): true | string {
    return rule(value);
  }

  /**
   * Validates an object against a schema
   */
  static validateObject<T extends Record<string, unknown>>(
    obj: T,
    schema: ValidationSchema<T>,
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const [key, rule] of Object.entries(schema)) {
      if (rule && obj[key] !== undefined) {
        const result = (rule as ValidationRule<unknown>)(obj[key]);
        if (result !== true) {
          errors[key] = result;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Throws an AppError if validation fails
   */
  static validateOrThrow<T extends Record<string, unknown>>(
    obj: T,
    schema: ValidationSchema<T>,
  ): void {
    const result = this.validateObject(obj, schema);

    if (!result.valid) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: result.errors,
      });
    }
  }
}

/**
 * Predefined validation rules
 */
export const ValidationRules = {
  required: <T,>(value: T): true | string => {
    if (value === null || value === undefined || value === "") {
      return "This field is required";
    }
    return true;
  },

  email: (value: string): true | string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? true : "Invalid email format";
  },

  minLength: (min: number) => (value: string): true | string => {
    return value.length >= min ? true : `Minimum length is ${min}`;
  },

  maxLength: (max: number) => (value: string): true | string => {
    return value.length <= max ? true : `Maximum length is ${max}`;
  },

  pattern: (pattern: RegExp, message: string) => (value: string): true | string => {
    return pattern.test(value) ? true : message;
  },

  min: (min: number) => (value: number): true | string => {
    return value >= min ? true : `Minimum value is ${min}`;
  },

  max: (max: number) => (value: number): true | string => {
    return value <= max ? true : `Maximum value is ${max}`;
  },

  url: (value: string): true | string => {
    try {
      new URL(value);
      return true;
    } catch {
      return "Invalid URL format";
    }
  },

  combine: (...rules: ValidationRule<unknown>[]): ValidationRule<unknown> => {
    return (value: unknown): true | string => {
      for (const rule of rules) {
        const result = rule(value);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  },
};
