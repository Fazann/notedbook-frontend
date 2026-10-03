/**
 * Every API path the frontend calls, relative to `NEXT_PUBLIC_API_URL` (the Go API serves them under `/api/v1`).
 * Mirrors `routes/api_route.go` in notebook-backend; keep the two in sync.
 * `:name` segments are filled with `buildPath`; query strings are passed as `params` to `apiCall`.
 */
export enum ApiEndpoint {
  Attachments = '/attachments',
  AttachmentDetail = '/attachments/:id',

  AuthRegister = '/auth/register',
  AuthLogin = '/auth/login',
  AuthRefreshToken = '/auth/refresh-token',
  AuthMailOtpRequest = '/auth/mail-otp/request',
  AuthMailOtpVerify = '/auth/mail-otp/verify',
  AuthResetPassword = '/auth/reset-password',
  AuthProfile = '/auth/profile',
  AuthChangePassword = '/auth/change-password',

  Categories = '/categories',
  CategoryDetail = '/categories/:id',
  CategoriesAll = '/categories/all',

  Expenses = '/expenses',
  ExpenseDetail = '/expenses/:id',
  ExpenseSummary = '/expenses/summary',

  PlanAreas = '/plan-areas',

  Plans = '/plans',
  PlanDetail = '/plans/:id',
  PlanStatus = '/plans/:id/status',
  PlanSteps = '/plans/:id/steps',
  PlanStats = '/plans/stats',

  StepDetail = '/steps/:id',
  StepToggle = '/steps/:id/toggle',
  StepMove = '/steps/:id/move',

  ScheduleOccurrences = '/schedule/occurrences',
  ScheduleSummary = '/schedule/summary',
  ScheduleActivities = '/schedule/activities',
  ScheduleActivityDetail = '/schedule/activities/:id',

  // TODO(api): the backend has no board / card routes yet.
  Boards = '/boards',
  CardsDue = '/cards/due',
}

/** Endpoints called without a session; a 401 from them means wrong input, not an expired token. */
export const PUBLIC_ENDPOINTS: ReadonlySet<string> = new Set([
  ApiEndpoint.AuthRegister,
  ApiEndpoint.AuthLogin,
  ApiEndpoint.AuthRefreshToken,
  ApiEndpoint.AuthMailOtpRequest,
  ApiEndpoint.AuthMailOtpVerify,
  ApiEndpoint.AuthResetPassword,
]);

/** Fills the `:name` segments: `buildPath(ApiEndpoint.PlanDetail, { id: 3 })` → `/plans/3`. */
export function buildPath(endpoint: ApiEndpoint, params: Record<string, string | number>): string {
  return endpoint.replace(/:(\w+)/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing path param "${key}" for ${endpoint}`);
    return encodeURIComponent(String(value));
  });
}
