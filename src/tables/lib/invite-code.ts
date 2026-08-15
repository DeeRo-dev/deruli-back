import { randomInt } from 'crypto';

/**
 * Sin I, O, 0 ni 1: el código se dicta o se copia a mano y esos caracteres
 * se confunden entre sí.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 8;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Normaliza lo que escribe el usuario: minúsculas, espacios, guiones. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}
