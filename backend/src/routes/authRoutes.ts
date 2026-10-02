import { Router } from "express";
import type { RequestHandler, Response } from "express";
import { config, REFRESH_TOKEN_TTL_SEC } from "../config.ts";
import { loginLimit } from "../middleware/loginLimit.ts";
import {
  validateGoogleLogin,
  validateLogin,
  validateSignup,
} from "../validators/authValidator.ts";
import * as authService from "../services/authService.ts";
import { HttpError } from "../errors.ts";

export const authRoutes = Router();

const COOKIE_NAME = "refreshToken";
const COOKIE_PATH = "/api/auth";

// PRD 6.4: Refresh 쿠키 속성. 운영은 프론트와 백엔드가 다른 사이트라 SameSite=None + Secure (PRD 7.2 배포)
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: config.isProduction ? "none" : "strict",
  secure: config.isProduction,
  path: COOKIE_PATH,
} as const;

// 로그인·재발급·비밀번호 변경 공용
export function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
  });
}

// SameSite=None 이면 다른 사이트에서도 쿠키가 실리므로, 쿠키를 쓰는 경로는 운영에서 CORS_ORIGIN 출처만 받는다 (CSRF)
const allowedOriginOnly: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (config.isProduction && origin && !config.corsOrigins.includes(origin)) {
    throw new HttpError(403, "허용되지 않은 출처입니다");
  }
  next();
};

authRoutes.post("/signup", async (req, res) => {
  const user = await authService.signup(validateSignup(req.body));
  res.status(201).json(user);
});

authRoutes.post("/login", loginLimit, async (req, res) => {
  const { email, password } = validateLogin(req.body);
  const { accessToken, refreshToken } = await authService.login(
    email,
    password,
  );
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

authRoutes.post("/google", async (req, res) => {
  const { credential } = validateGoogleLogin(req.body);
  const { accessToken, refreshToken } =
    await authService.googleLogin(credential);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

authRoutes.post("/refresh", allowedOriginOnly, async (req, res) => {
  const { accessToken, refreshToken } = await authService.refresh(
    req.cookies?.[COOKIE_NAME],
  );
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

authRoutes.post("/logout", allowedOriginOnly, async (req, res) => {
  await authService.logout(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.status(204).end();
});
