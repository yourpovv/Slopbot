import { config } from 'dotenv';
config();

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`missing env: ${key}`);
  return val;
}

function optEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const TOKEN = env('TOKEN');
export const PREFIX = optEnv('PREFIX', '.');
export const BRAND = optEnv('BRAND_NAME', '/brand to set');

export const COLORS = {
  brand: 0x2b2d31,
  success: 0x57f287,
  error: 0xed4245,
  warn: 0xfee75c,
  info: 0x5865f2,
  pastel: 0xffc8dd,
} as const;

export const ROLES = {
  owner: optEnv('ROLE_OWNER', ''),
  admin: optEnv('ROLE_ADMIN', ''),
  mod: optEnv('ROLE_MOD', ''),
  staff: optEnv('ROLE_STAFF', ''),
};

export const COLOR_ROLES: Record<string, string> = {
  red: optEnv('ROLE_RED', ''),
  orange: optEnv('ROLE_ORANGE', ''),
  yellow: optEnv('ROLE_YELLOW', ''),
  green: optEnv('ROLE_GREEN', ''),
  blue: optEnv('ROLE_BLUE', ''),
  purple: optEnv('ROLE_PURPLE', ''),
  pink: optEnv('ROLE_PINK', ''),
  white: optEnv('ROLE_WHITE', ''),
  black: optEnv('ROLE_BLACK', ''),
};

export const IDENTITY_ROLES: Record<string, string> = {
  male: optEnv('ROLE_MALE', ''),
  female: optEnv('ROLE_FEMALE', ''),
  him: optEnv('ROLE_HIM', ''),
  her: optEnv('ROLE_HER', ''),
  adult: optEnv('ROLE_ADULT', ''),
  minor: optEnv('ROLE_MINOR', ''),
};
