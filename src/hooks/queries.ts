// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// TanStack Query wrappers, one per backend endpoint, plus useDashboard which joins them for screens.
import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { data, user } from '../api/endpoints';
import type { LogMeasurementRequest, Measurement, MeasurementSet, Reminder, RiskEvaluation, RiskFactor } from '../api/types';
import { measurementZone, scoreZone, worstZone, type Zone } from '../lib/zones';

const STATIC = { staleTime: Infinity, gcTime: Infinity };

export const useRiskFactors = () => useQuery({ queryKey: ['riskFactors'], queryFn: data.getRisks, ...STATIC });
export const useRiskFactor = (riskId: string) =>
  useQuery({ queryKey: ['riskFactor', riskId], queryFn: () => data.getRisk(riskId), ...STATIC });
export const useMeasurement = (measurementId: string) =>
  useQuery({ queryKey: ['measurement', measurementId], queryFn: () => data.getMeasurement(measurementId), ...STATIC });

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
        [['history', measurementId], ['trend', measurementId], ['upcoming'], ['digest'], ['riskScores'], ['riskScore']].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      ),
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
 */
export function useDashboard(): Dashboard {
  const factors = useRiskFactors();
  const scores = useRiskScores();
  const upcoming = useUpcoming(30);

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
    queries: measurementIds.map((id) => ({ queryKey: ['history', id], queryFn: () => user.getHistory(id) })),
  });

  const defsData = defs.map((q) => q.data);
  const histsData = hists.map((q) => q.data);

  {
    const measurements: Record<string, Measurement | undefined> = {};
    const histories: Record<string, MeasurementSet[] | undefined> = {};
    const zones: Record<string, Zone> = {};
    measurementIds.forEach((id, i) => {
      measurements[id] = defsData[i];
      histories[id] = histsData[i];
      zones[id] = measurementZone(defsData[i], histsData[i]);
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
