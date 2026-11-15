// AI-generated text (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Plain-language answers to "Why is this exam needed?" and "How does spaceflight affect this?".
// The backend does not serve these yet, so they live here keyed by backend id, with a safe
// fallback for any id this file has not seen. Numbers come from the team's data report
// (public NASA OSDR, NOAA and CDC datasets) and NASA Human Research Program risk summaries;
// the full source list is on the About page.
import type { Measurement, RiskFactor } from '../api/types';

export interface Explainer {
  /** Everyday name shown next to the backend's name. */
  plainName?: string;
  why: string;
  space: string;
  /** Equipment needed, all confirmed on board the International Space Station. */
  need?: string[];
}

const MEASUREMENTS: Record<string, Explainer> = {
  white_blood_cells: {
    plainName: 'Infection-fighting cells',
    why: 'White blood cells fight germs. Counting them shows whether your body is ready to fight an infection, or is already fighting one.',
    space: 'Stress, radiation and poor sleep in space weaken the immune system, and germs spread easily in a closed cabin.',
    need: ['Finger-prick white cell analyzer', 'Lancet', 'Alcohol wipe'],
  },
  lymphocytes: {
    plainName: 'Virus-fighting cells',
    why: 'Lymphocytes are the white cells that remember and fight viruses. A low count means old viruses, like cold sores or shingles, can come back.',
    space: 'After one short private spaceflight, crew lymphocytes were 17% lower on landing day. Long missions add more stress.',
    need: ['The same finger-prick sample as the white cell count'],
  },
  body_mass_change: {
    plainName: 'Body weight',
    why: 'Losing weight is the easiest early sign that you are not eating enough, and it speeds up muscle and bone loss.',
    space: 'Food tastes duller in space, schedules are busy and appetite drops, so many astronauts eat less than they need.',
    need: ['Body mass measuring device (it swings you gently, because scales do not work without gravity)'],
  },
  grip_strength_change: {
    plainName: 'Hand strength',
    why: 'Grip strength is a quick check of overall muscle strength. You need strong hands for spacewalks, tools and emergencies.',
    space: 'Muscles shrink fast when they do not carry weight. In animal studies, grip strength fell by about half after four weeks of weightlessness.',
    need: ['Grip force sensor'],
  },
  intraocular_pressure: {
    plainName: 'Eye pressure',
    why: 'It catches pressure building up inside the eye early, before your eyesight changes.',
    space: 'Without gravity, body fluid moves up toward your head. In tests on Earth that copy this, eye pressure rose about 4 mmHg in a week.',
    need: ['Handheld tonometer with a fresh tip cover', 'Numbing eye drop', 'A crewmate to help'],
  },
  retinal_thickness_change: {
    plainName: 'Swelling at the back of the eye',
    why: 'The scan measures swelling of the nerve layer at the back of the eye. Swelling there can blur vision for good if it is missed.',
    space: 'Fluid shifting toward the head presses on the back of the eye. Most astronauts on long missions show at least one sign of this.',
    need: ['Eye scanner (OCT)', 'A crewmate to operate it'],
  },
  oct_fundus_scan: {
    plainName: 'Photo of the back of the eye',
    why: 'A picture of the back of your eye lets the medical team see swelling or folds that numbers alone can miss.',
    space: 'The same upward fluid shift that changes eye pressure can change the shape of the eye over weeks and months.',
    need: ['Eye scanner (OCT) and eye camera', 'A crewmate to operate it'],
  },
  stand_test_systolic_drop: {
    plainName: 'Blood pressure when you stand up',
    why: 'It shows whether your body can keep blood flowing to your brain when you stand. A big drop means you could faint.',
    space: 'In space your heart and blood vessels stop working against gravity and get out of practice, so landing day and planet surfaces are risky.',
    need: ['Blood pressure cuff or sensor shirt', 'Five quiet minutes'],
  },
  resting_heart_rate: {
    plainName: 'Heart beats per minute at rest',
    why: 'A resting heart rate that drifts up or down can be an early sign of dehydration, illness, stress or lost fitness.',
    space: 'You lose body fluid in the first days of flight and your heart adapts to easier work, so its resting pace can change.',
    need: ['Sensor shirt or a pulse check', 'Five quiet minutes'],
  },
  ejection_fraction: {
    plainName: 'How well your heart pumps',
    why: 'This is the share of blood your heart pushes out with each beat. It is the most direct check that the heart muscle is still strong.',
    space: 'Less work in weightlessness, plus space radiation over months, may weaken the heart, so it is worth tracking on long missions.',
    need: ['Ultrasound with on-screen guidance', 'A crewmate to help hold the probe'],
  },
  sleep_duration: {
    plainName: 'Hours of sleep',
    why: 'Too little sleep slows your reactions and raises the chance of mistakes during critical tasks.',
    space: 'Noise, light, a tight schedule and a sunrise every 90 minutes cut sleep to about 6 hours a night, compared with about 7.4 on Earth.',
    need: ['Sleep-tracking headband and shirt, or your sleep diary'],
  },
  memory_score_change: {
    plainName: 'Memory and attention test',
    why: 'A short test catches slower thinking or memory slips before they cause errors in real tasks.',
    space: 'Poor sleep, stuffy cabin air, stress and space radiation can all dull memory and attention.',
    need: ['Cognition test on the laptop or tablet', 'A quiet spot'],
  },
  balance_score_change: {
    plainName: 'Balance check',
    why: 'It shows how well your brain is keeping track of where your body is, which matters for spacewalks, driving a rover and landing.',
    space: 'Your inner ear re-tunes itself to weightlessness, so balance and walking are off when gravity returns.',
    need: ['Tablet balance task'],
  },
  mood_score: {
    plainName: 'How you feel today',
    why: 'A daily mood check spots stress, low mood or tension early, when rest or a talk can still fix it.',
    space: 'Months in a small space, far from family, with little privacy and broken sleep, wear on anyone.',
    need: ['One minute of honest reflection'],
  },
  solar_proton_flux: {
    plainName: 'Solar storm level',
    why: 'It tells you when a solar storm is sending dangerous particles your way, so you can shelter in time.',
    space: 'Outside Earth\'s protective magnetic field, a solar storm can deliver a harmful radiation dose within hours.',
    need: ['Onboard radiation monitor', 'Your personal dosimeter'],
  },
};

const RISK_SPACE: Record<string, string> = {
  immune_dysregulation: 'Stress, radiation, poor sleep and a closed cabin weaken your defenses, and medical help is far away.',
  cardiovascular_adaptations: 'Without gravity your heart works less and you lose body fluid, so blood pressure control gets out of practice.',
  host_microorganism_interactions: 'A sealed cabin, recycled air and water, and a changed diet shift the balance of microbes on and inside you.',
  nutrition: 'Food tastes duller in space and schedules are busy, so crews often eat less than their bodies need.',
  bone_loss_fracture_kidney_stones: 'Bones that carry no weight thin out about 1% per month, and the lost calcium ends up in your urine.',
  muscle_and_aerobic_fitness: 'Muscles and lungs do far less work when floating, so they weaken unless you exercise daily.',
  sans_eye_and_brain_pressure: 'Body fluid drifts up toward your head in weightlessness and presses on the back of your eyes.',
  sensorimotor_changes: 'Your inner ear and sense of body position re-tune to floating, then have to re-learn gravity.',
  hypoxia_and_cabin_co2: 'In a sealed cabin, the air you breathe out can build up around you because warm air does not rise without gravity.',
  decompression_sickness: 'Spacesuits run at lower pressure than the cabin, so gas dissolved in your blood can form bubbles during a spacewalk.',
  eva_injury: 'A stiff, pressurized suit strains hands and shoulders, and Moon or Mars dust is sharp and irritating.',
  injury_from_dynamic_loads: 'Launch, docking and landing put strong forces on a body whose bones and muscles have weakened in flight.',
  radiation_acute_syndrome: 'Away from Earth\'s magnetic field, a solar storm can deliver a large radiation dose in hours.',
  radiation_cancer: 'Space radiation is constant and stronger than on Earth, and every dose adds to lifetime risk.',
  radiation_central_nervous_system: 'Heavy particles in deep space can pass through the brain and may affect memory and attention.',
  radiation_cardiovascular: 'Radiation over many months may slowly damage the heart and blood vessels.',
  behavioral_conditions: 'Isolation, confinement, distance from home and broken sleep build up over a long mission.',
  sleep_loss_and_circadian_disruption: 'Sixteen sunrises a day, noise and shift work confuse the body clock.',
  team_performance: 'A small crew lives and works together for months with no break and delayed contact with home.',
  human_system_integration: 'Tired crews working with complex systems far from help make more mistakes when tools are hard to use.',
  inadequate_ground_support_and_medical_care: 'Messages to Earth can take up to about 22 minutes each way, so the crew must handle problems alone.',
};

export function measurementExplainer(m: Pick<Measurement, 'id' | 'name'>): Explainer {
  return (
    MEASUREMENTS[m.id] ?? {
      why: `${m.name} is one of the checks the medical team uses to spot a health change early, while it is still easy to fix.`,
      space: 'Living without gravity, in a closed cabin and far from Earth changes how the body works, so regular checks matter more than at home.',
    }
  );
}

export function riskSpaceEffect(risk: Pick<RiskFactor, 'id' | 'category'>): string {
  return (
    RISK_SPACE[risk.id] ??
    (risk.category === 'psychological'
      ? 'Isolation, a small shared space and distance from home put steady pressure on the mind during a long mission.'
      : 'Weightlessness, radiation and a closed cabin change how the body works, often without any early warning signs.')
  );
}

export const GENERAL_EXPLAINER: Explainer = {
  why: 'Regular self-checks catch small changes early, while rest, food, exercise or a talk with the Crew Medical Officer can still fix them.',
  space: 'Weightlessness, radiation, a closed cabin and distance from Earth change your body and mind slowly, often before you feel anything. Help from Earth may be many minutes away.',
};
