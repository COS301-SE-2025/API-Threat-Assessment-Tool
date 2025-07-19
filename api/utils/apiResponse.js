// utils/apiResponse.js
class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
  }

  static created(res, message = 'Created', data = null) {
    return this.success(res, message, data, 201);
  }

  static error(res, message, errors = null, statusCode = 500) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };
    if (errors !== null) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, errors, 400);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, null, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, null, 403);
  }

  static notFound(res, message = 'Not found') {
    return this.error(res, message, null, 404);
  }

  static conflict(res, message = 'Conflict') {
    return this.error(res, message, null, 409);
  }

  static internalError(res, message = 'Internal server error', errors = null) {
    return this.error(res, message, errors, 500);
  }
}

module.exports = { ApiResponse };