/**
 * Base Application Operational Error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 400 Bad Request / Payload Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Dữ liệu không hợp lệ', public issues?: unknown[]) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * 401 Unauthorized Error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Bạn cần đăng nhập để thực hiện thao tác này') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Bạn không có quyền thực hiện thao tác này') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Không tìm thấy tài nguyên yêu cầu') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 429 Too Many Requests / Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}
