// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// These shapes mirror the Java records in vnk_nasa_health_monitor_back (domain/dto and domain/document).

export type RiskCategory = 'physical' | 'psychological';
export type MeasurementCategory = 'numerical' | 'visual';
export type BaselineMode = 'none' | 'percent' | 'difference';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface RiskFactor {
  id: string;
  name: string;
  category: RiskCategory;
  measurementIds: string[];
  reason: string;
}

/** Score runs from 1 to 100, where 100 is healthy. */
export interface RiskEvaluation {
  riskId: string;
  score: number;
  advice: string[];
  reason: string;
}

export interface Instruction {
  image: string;
  text: string;
}

export interface Measurement {
  id: string;
  name: string;
  category: MeasurementCategory;
  unit: string | null;
  dangerousLow: number | null;
  abnormalLow: number | null;
  abnormalHigh: number | null;
  dangerousHigh: number | null;
  canBeNegative: boolean;
  baselineMode: BaselineMode | null;
  lowRecommendation: string | null;
  highRecommendation: string | null;
  instructions: Instruction[];
}

export interface MeasurementSet {
  measurementId: string;
  userId: string;
  /** ISO 8601 string from the backend (epoch numbers are also accepted by lib/dates). */
  timestamp: string | number;
  values: number[] | null;
  images: string[] | null;
}

export interface Reminder {
  measurementId: string;
  dueDate: string | number;
}

export interface ReminderDigest {
  username: string;
  daily: Reminder[];
  weekly: Reminder[];
  monthly: Reminder[];
}

export interface MeasurementTrend {
  measurementId: string;
  direction: TrendDirection | null;
}

export interface LogMeasurementRequest {
  values?: number[];
  image?: string;
}

/** One rule inside a badge. Every reading of a listed measurement type counts towards it. */
export interface BadgeCriterion {
  measurementType: string[];
  /** Each counted reading must be on a different day. */
  distinctDays: boolean;
  /** With distinctDays: the days must be consecutive. */
  streak: boolean;
  /** Only readings in the healthy (green) range count. */
  isOk: boolean;
  count: number;
}

/** A badge is granted when all of its criteria are satisfied. */
export interface BadgeRule {
  title: string;
  /** Plain sentence shown under the badge. Optional: the app writes one from the criteria if missing. */
  description?: string;
  criteria: BadgeCriterion[];
}

/** An unearned badge with one progress fraction (0 to 1) per criterion, in criterion order. */
export interface BadgeStatus {
  badge: BadgeRule;
  progress: number[];
}

/** GET /users/badges: the backend works out which badges are earned from the user's history. */
export interface BadgeSet {
  earned: BadgeRule[];
  unearned: BadgeStatus[];
}
