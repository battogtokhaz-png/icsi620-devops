// 12-factor config: тохиргоог орчны хувьсагчаас уншина.
// Анхдагч утга нь хуучин локал зан төлөвтэй ижил (127.0.0.1:3000).
export function loadConfig(env = process.env) {
  return {
    host: env.HOST ?? '127.0.0.1',
    port: Number(env.PORT ?? 3000),
    version: env.APP_VERSION ?? 'dev',
  };
}
