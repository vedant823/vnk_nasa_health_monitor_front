// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Record of every edit, undo and delete: when it happened (GMT) and what changed from what.
// The backend keeps no change history, so the record is kept in this browser, per account.
import { USERNAME_KEY } from '../api/client';

export type ChangeAction = 'edit' | 'undo' | 'delete';

export interface ChangeEntry {
  /** When the change was made, ISO time in UTC. */
  at: string;
  action: ChangeAction;
  measurementId: string;
  measurementName: string;
  /** The reading before the change, e.g. "5.23 hours per night". */
  from: string;
  /** The reading after an edit. Null for undo and delete. */
  to: string | null;
  /** When the changed reading had been taken, ISO time in UTC. */
  readingTakenAt: string | null;
}

const MAX_ENTRIES = 300;
const key = (username: string) => `chm.changes.${username}`;
const currentUser = () => {
  try {
    return localStorage.getItem(USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
};

/** Newest first. */
export function loadChanges(username = currentUser()): ChangeEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key(username)) ?? '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as ChangeEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordChange(entry: ChangeEntry, username = currentUser()): ChangeEntry {
  try {
    localStorage.setItem(key(username), JSON.stringify([entry, ...loadChanges(username)].slice(0, MAX_ENTRIES)));
  } catch {
    // Storage blocked or full: the change itself still happened on the backend.
  }
  return entry;
}

/** 2026-11-15 17:02 GMT */
export function formatGmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown time';
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} GMT`;
}

const ACTION_WORD: Record<ChangeAction, string> = { edit: 'Edited', undo: 'Undone', delete: 'Deleted' };

/** One plain sentence: when (GMT), what was done, and from what to what. */
export function describeChange(entry: ChangeEntry): string {
  const taken = entry.readingTakenAt ? ` (reading taken ${formatGmt(entry.readingTakenAt)})` : '';
  if (entry.action === 'edit') return `${ACTION_WORD.edit} ${entry.measurementName}: changed from ${entry.from} to ${entry.to ?? 'a new reading'}${taken}.`;
  return `${ACTION_WORD[entry.action]} ${entry.measurementName}: removed ${entry.from}${taken}.`;
}
