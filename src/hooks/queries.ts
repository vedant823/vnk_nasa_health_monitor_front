// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// TanStack Query wrappers, one per backend endpoint, plus useDashboard which joins them for screens.
import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEnvironment } from '../auth/EnvironmentContext';
import { displayUnit, formatValue, usesBaseline } from '../content/inputSpecs';
import { recordChange, type ChangeAction, type ChangeEntry } from '../lib/changeLog';
import { withEnvironmentLimits } from '../lib/environment';
import { data, officer, user } from '../api/endpoints';
import type { LogMeasurementRequest, Measurement, MeasurementSet, Reminder, RiskEvaluation, RiskFactor, UserStatus } from '../api/types';
import { measurementZone, scoreZone, setValue, worstZone, type Zone } from '../lib/zones';

const STATIC = { staleTime: Infinity, gcTime: Infinity };

export const useRiskFactors = () => useQuery({ queryKey: ['riskFactors'], queryFn: data.getRisks, ...STATIC });
export const useRiskFactor = (riskId: string) =>
  useQuery({ queryKey: ['riskFactor', riskId], queryFn: () => data.getRisk(riskId), ...STATIC });
/** One measurement definition, with the limits for the crew member's environment applied. */
export function useMeasurement(measurementId: string) {
  const { environment } = useEnvironment();
  return useQuery({
    queryKey: ['measurement', measurementId],
    queryFn: () => data.getMeasurement(measurementId),
    select: (m: Measurement) => withEnvironmentLimits(m, environment.id),
    ...STATIC,
  });
}

/** The user's badges, evaluated by the backend (GET /users/badges). */
export const useBadges = () => useQuery({ queryKey: ['badges'], queryFn: user.getBadges });

export const useRiskScores = () => useQuery({ queryKey: ['riskScores'], queryFn: user.getRiskScores });
export const useRiskScore = (riskId: string) =>
  useQuery({ queryKey: ['riskScore', riskId], queryFn: () => user.getRiskScore(riskId) });
export const useUpcoming = (withinDays = 30) =>
  useQuery({ queryKey: ['upcoming', withinDays], queryFn: () => user.getUpcoming(withinDays) });
export const useDigest = () => useQuery({ queryKey: ['digest'], queryFn: user.getDigest });
export const useHistory = (measurementId: string) =>
  useQuery({ queryKey: ['history', measurementId], queryFn: () => user.getHistory(measurementId) });
export const useTrend = (measurementId: string) =>
  useQuery({ queryKey: ['trend', measurementId], queryFn: () => user.getTrend(measurementId) });

export function useLogMeasurement(measurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LogMeasurementRequest) => user.logMeasurement(measurementId, body),
    // A new reading changes history, trend, reminders and every risk score that uses it.
    onSuccess: () =>
      Promise.all(
        [['history', measurementId], ['trend', measurementId], ['upcoming'], ['digest'], ['riskScores'], ['riskScore'], ['badges']].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

const AFTER_CHANGE = (measurementId: string) => [['history', measurementId], ['trend', measurementId], ['upcoming'], ['digest'], ['riskScores'], ['riskScore'], ['badges']];

const refreshAfterChange = (queryClient: QueryClient, measurementId: string) =>
  Promise.all(AFTER_CHANGE(measurementId).map((queryKey) => queryClient.invalidateQueries({ queryKey })));

const definitionOf = (queryClient: QueryClient, measurementId: string) =>
  queryClient.fetchQuery({ queryKey: ['measurement', measurementId], queryFn: () => data.getMeasurement(measurementId), ...STATIC });

/** A reading in words for the change record, e.g. "5.23 hours per night". */
function readingText(m: Measurement, set: MeasurementSet | undefined): string {
  const value = set ? setValue(set) : null;
  if (m.category === 'visual' || value === null) return 'a saved image';
  return `${formatValue(value)} ${displayUnit(m)}`.trim();
}

const isoTime = (set: MeasurementSet | undefined) => (set ? new Date(typeof set.timestamp === 'number' && set.timestamp < 1e12 ? set.timestamp * 1000 : set.timestamp).toISOString() : null);

/**
 * Deletes one reading: the newest when no index is given, otherwise that position in the
 * newest-first history. The change (what was removed, and when in GMT) is written to the change record.
 */
export function useDeleteMeasurement(measurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ index, action }: { index?: number; action: Exclude<ChangeAction, 'edit'> }): Promise<ChangeEntry> => {
      const [m, history] = await Promise.all([definitionOf(queryClient, measurementId), user.getHistory(measurementId)]);
      const target = history[index ?? 0];
      await user.deleteMeasurement(measurementId, index);
      return recordChange({
        at: new Date().toISOString(),
        action,
        measurementId,
        measurementName: m.name,
        from: readingText(m, target),
        to: null,
        readingTakenAt: isoTime(target),
      });
    },
    // Removing a reading changes the same things that adding one does.
    onSuccess: () => refreshAfterChange(queryClient, measurementId),
  });
}

/**
 * Edits a reading. The backend has no edit call, so this saves the corrected reading and then
 * deletes the old one. The corrected reading gets the current time, because the backend stamps
 * every new reading itself. If saving fails, nothing is changed.
 */
export function useEditMeasurement(measurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ index, body }: { index: number; body: LogMeasurementRequest }): Promise<ChangeEntry> => {
      const [m, before] = await Promise.all([definitionOf(queryClient, measurementId), user.getHistory(measurementId)]);
      const target = before[index];
      if (!target) throw new Error('That reading no longer exists.');
      if (usesBaseline(m) && before.length === 1) {
        // The only reading is the baseline: remove it first so the corrected one becomes the new baseline.
        await user.deleteMeasurement(measurementId, index);
        await user.logMeasurement(measurementId, body);
      } else {
        await user.logMeasurement(measurementId, body);
        // Find the old reading again by its time, in case the order changed.
        const now = await user.getHistory(measurementId);
        const position = now.findIndex((set) => String(set.timestamp) === String(target.timestamp));
        await user.deleteMeasurement(measurementId, position >= 0 ? position : index + 1);
      }
      const after = await user.getHistory(measurementId);
      return recordChange({
        at: new Date().toISOString(),
        action: 'edit',
        measurementId,
        measurementName: m.name,
        from: readingText(m, target),
        to: readingText(m, after[0]),
        readingTakenAt: isoTime(target),
      });
    },
    onSuccess: () => refreshAfterChange(queryClient, measurementId),
    // If the second step failed, the screens should still show what the backend now holds.
    onError: () => refreshAfterChange(queryClient, measurementId),
  });
}

export function useSetFrequency(measurementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (days: number) => user.setFrequency(measurementId, days),
    onSuccess: () =>
      Promise.all([['upcoming'], ['digest']].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

/** "normal" or "medical officer" (GET /users/status). */
export const useStatus = (enabled = true) => useQuery({ queryKey: ['status'], queryFn: user.getStatus, enabled });
/** Username of the crew member's medical officer, or null. */
export const useOfficer = () => useQuery({ queryKey: ['officer'], queryFn: user.getOfficer });
/** The crew assigned to this medical officer. */
export const useChildren = (enabled: boolean) => useQuery({ queryKey: ['children'], queryFn: officer.getChildren, enabled });
/** Overdue checks across the assigned crew. */
export const useCrewOverdue = (enabled: boolean) => useQuery({ queryKey: ['crewOverdue'], queryFn: officer.getOverdue, enabled });
/** The checklist of findings for a visual measurement. */
export const useFlags = (measurementId: string) => useQuery({ queryKey: ['flags', measurementId], queryFn: () => data.getFlags(measurementId), ...STATIC });

const ROLE_KEYS = [['status'], ['officer'], ['children'], ['crewOverdue']];

export function useSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: UserStatus) => user.setStatus(status),
    onSuccess: () => Promise.all(ROLE_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export function useSetOfficer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => user.setOfficer(username),
    onSuccess: () => Promise.all(ROLE_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

/**
 * Saves a medical officer's review of one scan: the number of findings. With a childId it goes
 * through the officer endpoint for that crew member, otherwise it scores the signed-in user's own scan.
 */
export function useScoreScan(measurementId: string, childId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ index, numAbnormal }: { index: number; numAbnormal: number }) =>
      childId ? officer.setScore(childId, measurementId, numAbnormal, index) : user.setScore(measurementId, numAbnormal, index),
    // A review changes the scan's history entry and every risk score that uses it.
    onSuccess: () => Promise.all([['history', measurementId], ['riskScores'], ['riskScore'], ['badges']].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export interface RiskView {
  factor: RiskFactor;
  evaluation: RiskEvaluation | undefined;
  score: number;
  /** 'none' when the risk has no measurements, or none of them has a reading yet. */
  zone: Zone;
  hasMeasurements: boolean;
}

export interface Dashboard {
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  risks: RiskView[];
  measurementIds: string[];
  measurements: Record<string, Measurement | undefined>;
  histories: Record<string, MeasurementSet[] | undefined>;
  zones: Record<string, Zone>;
  upcoming: Reminder[];
}

/**
 * Everything the Home, Reminders and Risk screens need, joined by backend ids. Measurement ids are
 * discovered from the risk factors and the reminder list, so nothing is hardcoded.
 * With a childId, a medical officer gets the same picture of an assigned crew member, read through
 * the /users/children/{id}/... endpoints.
 */
export function useDashboard(childId?: string): Dashboard {
  const { environment } = useEnvironment();
  const factors = useRiskFactors();
  const who = childId ?? 'me';
  const scores = useQuery({ queryKey: ['riskScores', who], queryFn: () => (childId ? officer.getRiskScores(childId) : user.getRiskScores()) });
  const upcoming = useQuery({ queryKey: ['upcoming', 30, who], queryFn: () => (childId ? officer.getUpcoming(childId, 30) : user.getUpcoming(30)) });

  const measurementIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of factors.data ?? []) for (const id of f.measurementIds) ids.add(id);
    for (const r of upcoming.data ?? []) ids.add(r.measurementId);
    return [...ids];
  }, [factors.data, upcoming.data]);

  const defs = useQueries({
    queries: measurementIds.map((id) => ({ queryKey: ['measurement', id], queryFn: () => data.getMeasurement(id), ...STATIC })),
  });
  const hists = useQueries({
    queries: measurementIds.map((id) => ({ queryKey: childId ? ['history', id, childId] : ['history', id], queryFn: () => (childId ? officer.getHistory(childId, id) : user.getHistory(id)) })),
  });

  const defsData = defs.map((q) => q.data);
  const histsData = hists.map((q) => q.data);

  {
    const measurements: Record<string, Measurement | undefined> = {};
    const histories: Record<string, MeasurementSet[] | undefined> = {};
    const zones: Record<string, Zone> = {};
    measurementIds.forEach((id, i) => {
      measurements[id] = withEnvironmentLimits(defsData[i], environment.id);
      histories[id] = histsData[i];
      zones[id] = measurementZone(measurements[id], histsData[i]);
    });
    const scoreById = new Map((scores.data ?? []).map((e) => [e.riskId, e]));
    const risks: RiskView[] = (factors.data ?? []).map((factor) => {
      const evaluation = scoreById.get(factor.id);
      const score = evaluation?.score ?? 100;
      // The backend leaves a risk at 100 when it has no readings; show that as grey, not green.
      const hasReadings = factor.measurementIds.some((id) => (histories[id] ?? []).length > 0);
      const childZones = factor.measurementIds.map((id) => zones[id] ?? 'none');
      const scored = worstZone(childZones) !== 'none';
      return {
        factor,
        evaluation,
        score,
        zone: hasReadings && (scored || score < 100) ? scoreZone(score) : 'none',
        hasMeasurements: factor.measurementIds.length > 0,
      };
    });
    const loading =
      factors.isLoading || scores.isLoading || upcoming.isLoading || defs.some((q) => q.isLoading) || hists.some((q) => q.isLoading);
    const error = factors.error ?? scores.error ?? upcoming.error ?? defs.find((q) => q.error)?.error ?? hists.find((q) => q.error)?.error ?? null;
    return {
      isLoading: loading,
      error,
      refetch: () => {
        void factors.refetch();
        void scores.refetch();
        void upcoming.refetch();
      },
      risks,
      measurementIds,
      measurements,
      histories,
      zones,
      upcoming: upcoming.data ?? [],
    };
  }
}
