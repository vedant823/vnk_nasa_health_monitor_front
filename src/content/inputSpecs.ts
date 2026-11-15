// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// What the astronaut actually types for each measurement. The backend's `unit` describes the stored
// value (for example "percent change from pre-flight"), but baseline measurements are entered as raw
// readings (for example kilograms) and converted by the backend. Unknown ids fall back to one field
// labelled with the backend's unit.
import type { Measurement } from '../api/types';

export interface InputField {
  label: string;
  unit: string;
}

export interface InputSpec {
  fields: InputField[];
  /**
   * 'list': send every field as one values list (the backend averages them).
   * 'firstMinusSecond': send one value, field 1 minus field 2.
   */
  combine: 'list' | 'firstMinusSecond';
  hint?: string;
  /** Short unit for charts and chips when the backend's unit text is long. */
  shortUnit?: string;
}

const SPECS: Record<string, InputSpec> = {
  body_mass_change: { fields: [{ label: 'Body mass', unit: 'kg' }], combine: 'list' },
  grip_strength_change: { fields: [{ label: 'Best squeeze', unit: 'kg of force' }], combine: 'list' },
  memory_score_change: { fields: [{ label: 'Test score', unit: 'points' }], combine: 'list' },
  balance_score_change: { fields: [{ label: 'Balance score', unit: 'points' }], combine: 'list' },
  retinal_thickness_change: { fields: [{ label: 'Retinal thickness', unit: 'micrometres' }], combine: 'list' },
  intraocular_pressure: {
    fields: [
      { label: 'Left eye', unit: 'mmHg' },
      { label: 'Right eye', unit: 'mmHg' },
    ],
    combine: 'list',
    hint: 'Enter the average of 3 readings for each eye.',
  },
  sleep_duration: {
    fields: [
      { label: 'Last night', unit: 'hours' },
      { label: '2 nights ago', unit: 'hours' },
      { label: '3 nights ago', unit: 'hours' },
    ],
    combine: 'list',
    hint: 'The score uses the average of these 3 nights.',
    shortUnit: 'hours per night',
  },
  stand_test_systolic_drop: {
    fields: [
      { label: 'Top number lying down', unit: 'mmHg' },
      { label: 'Lowest top number standing', unit: 'mmHg' },
    ],
    combine: 'firstMinusSecond',
    hint: 'The app works out the drop for you.',
    shortUnit: 'mmHg drop on standing',
  },
  mood_score: { fields: [{ label: 'Mood today', unit: '0 (worst) to 10 (best)' }], combine: 'list', shortUnit: 'out of 10' },
  solar_proton_flux: { fields: [{ label: 'Proton flux', unit: 'pfu' }], combine: 'list', shortUnit: 'pfu' },
};

export function inputSpec(m: Measurement): InputSpec {
  return SPECS[m.id] ?? { fields: [{ label: m.name, unit: m.unit ?? '' }], combine: 'list' };
}

/** True when the first reading becomes the personal baseline. */
export const usesBaseline = (m: Measurement) => m.baselineMode === 'percent' || m.baselineMode === 'difference';

/** Short unit for chart axes and value chips. */
export function displayUnit(m: Measurement): string {
  if (m.baselineMode === 'percent') return '% vs your baseline';
  if (m.baselineMode === 'difference') return `${(m.unit ?? '').split(' ')[0]} vs your baseline`;
  const short = SPECS[m.id]?.shortUnit;
  if (short) return short;
  const unit = m.unit ?? '';
  const cut = unit.indexOf(' (');
  return cut > 0 ? unit.slice(0, cut) : unit;
}

/** Rounds the long decimals the backend puts in its reason text, e.g. -2.5333333333 becomes -2.53. */
export function tidyNumbers(text: string): string {
  return text.replace(/-?\d+\.\d{3,}/g, (n) => formatValue(Number(n)));
}

export function formatValue(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const fixed = value.toFixed(digits);
  const text = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
  return text === '-0' ? '0' : text;
}
