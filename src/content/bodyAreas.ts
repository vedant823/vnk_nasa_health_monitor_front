// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Which part of the body each risk belongs to. The backend has no body-area field yet, so this map
// is keyed by backend risk id; unknown ids fall back to "whole body".

export type BodyArea = 'mind' | 'eyes' | 'balance' | 'heart' | 'lungs' | 'immune' | 'stomach' | 'muscles' | 'bones' | 'whole';

export const BODY_AREA_LABEL: Record<BodyArea, string> = {
  mind: 'Mind and sleep',
  eyes: 'Eyes',
  balance: 'Balance',
  heart: 'Heart',
  lungs: 'Lungs and breathing',
  immune: 'Blood and immune system',
  stomach: 'Food and weight',
  muscles: 'Muscles',
  bones: 'Bones',
  whole: 'Whole body',
};

/** Top-to-bottom order used by the figure's legend. */
export const BODY_AREA_ORDER: BodyArea[] = ['mind', 'eyes', 'balance', 'immune', 'heart', 'lungs', 'stomach', 'muscles', 'bones', 'whole'];

const RISK_AREA: Record<string, BodyArea> = {
  behavioral_conditions: 'mind',
  sleep_loss_and_circadian_disruption: 'mind',
  radiation_central_nervous_system: 'mind',
  team_performance: 'mind',
  human_system_integration: 'mind',
  inadequate_ground_support_and_medical_care: 'mind',
  sans_eye_and_brain_pressure: 'eyes',
  sensorimotor_changes: 'balance',
  cardiovascular_adaptations: 'heart',
  radiation_cardiovascular: 'heart',
  hypoxia_and_cabin_co2: 'lungs',
  decompression_sickness: 'lungs',
  immune_dysregulation: 'immune',
  host_microorganism_interactions: 'immune',
  nutrition: 'stomach',
  muscle_and_aerobic_fitness: 'muscles',
  bone_loss_fracture_kidney_stones: 'bones',
  radiation_acute_syndrome: 'whole',
  radiation_cancer: 'whole',
  eva_injury: 'whole',
  injury_from_dynamic_loads: 'whole',
};

export const bodyAreaOf = (riskId: string): BodyArea => RISK_AREA[riskId] ?? 'whole';
