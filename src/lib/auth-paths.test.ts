import { describe, expect, it } from 'vitest';

import { isPublicPath, safeRedirectPath } from './auth-paths';

describe('isPublicPath', () => {
  it('matches auth pages, with or without a query', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/login?next=/expenses')).toBe(true);
    expect(isPublicPath('/forgot-password/verify')).toBe(true);
  });

  it('matches the help center and its topics', () => {
    expect(isPublicPath('/help')).toBe(true);
    expect(isPublicPath('/help/install')).toBe(true);
    expect(isPublicPath('/helpdesk')).toBe(false);
  });

  it('does not match app pages or look-alike names', () => {
    expect(isPublicPath('/dashboard')).toBe(false);
    expect(isPublicPath('/login-help')).toBe(false);
    expect(isPublicPath('/')).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('keeps same-site app paths with their query', () => {
    expect(safeRedirectPath('/expenses?month=2026-09')).toBe('/expenses?month=2026-09');
    expect(safeRedirectPath('/planning/12')).toBe('/planning/12');
  });

  it('rejects other sites, auth pages and non-strings', () => {
    expect(safeRedirectPath('https://evil.example')).toBeUndefined();
    expect(safeRedirectPath('//evil.example')).toBeUndefined();
    expect(safeRedirectPath('/\\evil.example')).toBeUndefined();
    expect(safeRedirectPath('/login')).toBeUndefined();
    expect(safeRedirectPath('/')).toBeUndefined();
    expect(safeRedirectPath(['/expenses'])).toBeUndefined();
    expect(safeRedirectPath(undefined)).toBeUndefined();
  });
});
