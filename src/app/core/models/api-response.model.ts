/**
 * Core API response models
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
