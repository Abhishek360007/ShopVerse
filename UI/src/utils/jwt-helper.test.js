import { getToken, isTokenValid, logOut, saveToken } from './jwt-helper';

const base64Url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const makeToken = (payload) => `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`;

describe('jwt-helper', () => {
  beforeEach(() => localStorage.clear());

  it('saves, reads and removes the token', () => {
    saveToken('abc');
    expect(getToken()).toBe('abc');
    logOut();
    expect(getToken()).toBeNull();
  });

  it('is invalid when no token is stored', () => {
    expect(isTokenValid()).toBe(false);
  });

  it('is valid for a token that has not expired', () => {
    saveToken(makeToken({ sub: 'jane', exp: Math.floor(Date.now() / 1000) + 3600 }));
    expect(isTokenValid()).toBe(true);
  });

  it('is invalid for an expired token', () => {
    saveToken(makeToken({ sub: 'jane', exp: Math.floor(Date.now() / 1000) - 10 }));
    expect(isTokenValid()).toBe(false);
  });

  it('is invalid for a malformed token', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    saveToken('not-a-jwt');
    expect(isTokenValid()).toBe(false);
    console.error.mockRestore();
  });
});
