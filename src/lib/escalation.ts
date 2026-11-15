// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Escalation ladder: the crew member acts first, then the Crew Medical Officer, then the flight surgeon.
// It follows the decision tree in the project's ranges guide and the four triage tiers in the team's
// requirements spreadsheet. The app shows the steps; it does not send messages itself.
import type { Zone } from './zones';

export interface EscalationStep {
  who: string;
  what: string;
}

export interface Escalation {
  title: string;
  steps: EscalationStep[];
}

export const ESCALATION: Partial<Record<Zone, Escalation>> = {
  yellow: {
    title: 'Watch: act yourself first',
    steps: [
      { who: 'You', what: 'Follow the recommendation shown here, then repeat the measurement at the next reminder.' },
      { who: 'Crew Medical Officer', what: 'If it is still in the watch zone at the re-check, tell the Crew Medical Officer.' },
    ],
  },
  red: {
    title: 'Act now: involve the Crew Medical Officer today',
    steps: [
      { who: 'You', what: 'Stop strenuous tasks. Repeat the measurement now to rule out a mistake.' },
      { who: 'Crew Medical Officer', what: 'Tell the Crew Medical Officer today and share this screen.' },
      { who: 'Flight surgeon', what: 'Prepare a flight surgeon report (the button is on the risk screen) and send it at the next communication window.' },
    ],
  },
  emergency: {
    title: 'Emergency: call the crew now',
    steps: [
      { who: 'You', what: 'Call for a crewmate right away. Do not stay alone.' },
      { who: 'Crew Medical Officer', what: 'The Crew Medical Officer starts the emergency checklist.' },
      { who: 'Flight surgeon', what: 'Alert the flight surgeon at once. Far from Earth a reply can take up to 44 minutes, so the crew acts first.' },
    ],
  },
};

/** Symptoms that turn any result into an emergency, whatever the number says. */
export const RED_FLAGS = [
  'Chest pain or pressure',
  'Fainting or nearly fainting',
  'Sudden confusion or trouble speaking',
  'Trouble breathing',
  'Sudden loss of vision',
];
