const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // no 0/o, 1/l/i
const ROOM_ID_LENGTH = 12; // ~59 bits: unguessable, still short enough to read aloud

export function roomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_ID_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const isRoomId = (value: string): boolean =>
  value.length === ROOM_ID_LENGTH && [...value].every((c) => ALPHABET.includes(c));

export const uid = (): string => crypto.randomUUID();
