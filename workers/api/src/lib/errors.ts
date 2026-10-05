/** Thrown by routes and helpers; `app.onError` turns it into `{ error: message }` with `status`. */
export class ApiError extends Error {
  constructor(
    public status: 400 | 401 | 402 | 403 | 404 | 409 | 500 | 503,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
