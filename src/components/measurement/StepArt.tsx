// AI-generated illustrations and code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// One simple line drawing for every instruction step, showing the action in that step. Each drawing
// is original, drawn as SVG shapes by AI, and has the words "AI-generated" drawn into the picture
// itself. Nothing here is based on agency artwork, photos or branding.
import type { ReactNode } from 'react';

type Scene =
  | 'wash' | 'prick' | 'fillCuvette' | 'analyzer' | 'enterApp' | 'sameSample' | 'readScreen' | 'clockMeal' | 'clothing' | 'massDevice'
  | 'sitElbow' | 'squeeze' | 'restRepeat' | 'headStraight' | 'eyeDrop' | 'tonoCover' | 'tonoTouch' | 'octChin' | 'fixation' | 'captureScan'
  | 'compareApp' | 'focusCheck' | 'saveImages' | 'lieDown' | 'bpCuff' | 'standUp' | 'bpTimed' | 'calc' | 'restShirt' | 'heartRate'
  | 'lieLeft' | 'ultrasound' | 'record3' | 'headband' | 'sleepDiary' | 'average3' | 'quiet' | 'openTest' | 'completeTasks' | 'feetTogether'
  | 'balanceEyes' | 'swayScore' | 'openCheckin' | 'sliders' | 'note' | 'solarAuto' | 'dosimeter' | 'shelter';

/** Which drawing each step of each known measurement uses (step 1 first). */
const BY_MEASUREMENT: Record<string, Scene[]> = {
  white_blood_cells: ['wash', 'prick', 'fillCuvette', 'analyzer', 'enterApp'],
  lymphocytes: ['sameSample', 'readScreen', 'enterApp'],
  body_mass_change: ['clockMeal', 'clothing', 'massDevice', 'enterApp'],
  grip_strength_change: ['sitElbow', 'squeeze', 'restRepeat', 'enterApp'],
  intraocular_pressure: ['headStraight', 'eyeDrop', 'tonoCover', 'tonoTouch', 'enterApp'],
  retinal_thickness_change: ['octChin', 'fixation', 'captureScan', 'compareApp'],
  oct_fundus_scan: ['octChin', 'captureScan', 'focusCheck', 'saveImages'],
  stand_test_systolic_drop: ['lieDown', 'bpCuff', 'standUp', 'bpTimed', 'calc'],
  resting_heart_rate: ['restShirt', 'heartRate', 'enterApp'],
  ejection_fraction: ['lieLeft', 'ultrasound', 'record3', 'saveImages'],
  sleep_duration: ['headband', 'sleepDiary', 'average3'],
  memory_score_change: ['quiet', 'openTest', 'completeTasks', 'compareApp'],
  balance_score_change: ['feetTogether', 'balanceEyes', 'swayScore'],
  mood_score: ['openCheckin', 'sliders', 'note'],
  solar_proton_flux: ['solarAuto', 'dosimeter', 'shelter'],
};

/** For measurements or steps this file does not know: choose a drawing from the words of the step. */
const BY_WORDS: [RegExp, Scene][] = [
  [/wash|alcohol wipe|clean/i, 'wash'],
  [/prick|lancet/i, 'prick'],
  [/cuvette|cartridge|analy[sz]er/i, 'analyzer'],
  [/shelter/i, 'shelter'],
  [/dosimeter/i, 'dosimeter'],
  [/ultrasound|probe/i, 'ultrasound'],
  [/eye drop|anesthetic/i, 'eyeDrop'],
  [/tonometer|cornea/i, 'tonoTouch'],
  [/scan|fundus|capture|photo|image/i, 'captureScan'],
  [/blood pressure|cuff/i, 'bpCuff'],
  [/lie |lying/i, 'lieDown'],
  [/stand/i, 'standUp'],
  [/squeeze|grip/i, 'squeeze'],
  [/sleep|overnight|headband/i, 'headband'],
  [/quiet|silence/i, 'quiet'],
  [/rate |0 to 10|mood/i, 'sliders'],
  [/note|diary/i, 'note'],
  [/heart rate|pulse/i, 'heartRate'],
  [/rest|wait|minute|second/i, 'restRepeat'],
  [/compare|baseline|calculat|average|convert|scores/i, 'compareApp'],
  [/enter|sync|type/i, 'enterApp'],
  [/open|tablet|laptop|task/i, 'openTest'],
];

export function sceneFor(measurementId: string, step: number, text: string): Scene {
  return BY_MEASUREMENT[measurementId]?.[step - 1] ?? BY_WORDS.find(([words]) => words.test(text))?.[1] ?? 'completeTasks';
}

// ---- Small reusable pieces -------------------------------------------------------------------

const Tablet = ({ x = 34, y = 30, w = 54, h = 72, children }: { x?: number; y?: number; w?: number; h?: number; children?: ReactNode }) => (
  <>
    <rect x={x} y={y} width={w} height={h} rx="7" className="f" />
    <rect x={x + 5} y={y + 6} width={w - 10} height={h - 16} rx="3" className="t" />
    <path d={`M${x + w / 2 - 4} ${y + h - 5}h8`} />
    {children}
  </>
);

const Clock = ({ x, y, r = 12, label }: { x: number; y: number; r?: number; label?: string }) => (
  <>
    <circle cx={x} cy={y} r={r} className="f" />
    <path d={`M${x} ${y - r * 0.55}V${y}l${r * 0.45} ${r * 0.3}`} className="a" />
    {label && <text x={x} y={y + r + 11} textAnchor="middle">{label}</text>}
  </>
);

const Drop = ({ x, y }: { x: number; y: number }) => <path d={`M${x} ${y - 7}c4 5 6 8 6 10a6 6 0 01-12 0c0-2 2-5 6-10z`} className="r" />;

const Eye = ({ x, y, w = 22 }: { x: number; y: number; w?: number }) => (
  <>
    <path d={`M${x - w} ${y}q${w} ${-w * 0.9} ${w * 2} 0q${-w} ${w * 0.9} ${-w * 2} 0z`} className="f" />
    <circle cx={x} cy={y} r={w * 0.36} className="t" />
    <circle cx={x} cy={y} r={w * 0.14} className="k" />
  </>
);

const Tick = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <path d={`M${x - 6 * s} ${y}l${4 * s} ${4 * s}l${8 * s} ${-9 * s}`} className="a" />;

/** Simple stick person. Pass the points for arms and legs; the head and body are drawn for you. */
const Person = ({ x, y, body = 28, limbs }: { x: number; y: number; body?: number; limbs: string }) => (
  <>
    <circle cx={x} cy={y} r="8" className="f" />
    <path d={`M${x} ${y + 8}v${body}`} />
    <path d={limbs} />
  </>
);

const Arrow = ({ d, head }: { d: string; head: string }) => (
  <>
    <path d={d} className="a" />
    <path d={head} className="a" />
  </>
);

// ---- The drawings ----------------------------------------------------------------------------

const SCENES: Record<Scene, ReactNode> = {
  wash: (
    <>
      <path d="M62 30h22v10M84 40v6" />
      <path d="M84 54v4M79 62v4M89 64v4" className="a" />
      <rect x="36" y="68" width="42" height="15" rx="7.5" className="f" transform="rotate(-12 57 75)" />
      <rect x="48" y="80" width="42" height="15" rx="7.5" className="f" transform="rotate(9 69 87)" />
      <circle cx="36" cy="62" r="3" className="t" />
      <circle cx="98" cy="78" r="4" className="t" />
      <circle cx="44" cy="98" r="2.5" className="t" />
    </>
  ),
  prick: (
    <>
      <path d="M34 100V64a10 10 0 0120 0v36" className="f" />
      <path d="M38 62h12" />
      <rect x="66" y="30" width="13" height="36" rx="4" className="t" transform="rotate(38 72 48)" />
      <path d="M61 62l-6 7" className="a" />
      <Drop x={44} y={44} />
    </>
  ),
  fillCuvette: (
    <>
      <path d="M48 28v28a10 10 0 0020 0V28" className="f" />
      <Drop x={58} y={78} />
      <rect x="34" y="90" width="56" height="12" rx="3" className="f" />
      <rect x="52" y="93" width="12" height="6" rx="1.5" className="r" />
      <path d="M78 96h6" />
    </>
  ),
  analyzer: (
    <>
      <rect x="22" y="46" width="60" height="48" rx="8" className="f" />
      <rect x="30" y="54" width="34" height="18" rx="3" className="t" />
      <text x="47" y="67" textAnchor="middle">5.8</text>
      <path d="M70 80h8" />
      <rect x="92" y="74" width="20" height="9" rx="2" className="f" />
      <Arrow d="M90 64H76" head="M81 59l-5 5 5 5" />
      <circle cx="34" cy="84" r="3" className="t" />
    </>
  ),
  enterApp: (
    <Tablet>
      <rect x="44" y="44" width="34" height="14" rx="3" className="f" />
      <text x="61" y="55" textAnchor="middle">123</text>
      <rect x="44" y="66" width="34" height="14" rx="7" className="af" />
      <path d="M55 73l4 4 8-8" className="w" />
    </Tablet>
  ),
  sameSample: (
    <>
      <rect x="40" y="34" width="40" height="11" rx="3" className="f" />
      <rect x="54" y="37" width="10" height="5" rx="1.5" className="r" />
      <Arrow d="M52 50L40 68" head="M40 60v8h8" />
      <Arrow d="M68 50l12 18" head="M72 68h8v-8" />
      <rect x="20" y="72" width="38" height="24" rx="5" className="f" />
      <text x="39" y="88" textAnchor="middle">WBC</text>
      <rect x="64" y="72" width="38" height="24" rx="5" className="t" />
      <text x="83" y="88" textAnchor="middle">LYM</text>
    </>
  ),
  readScreen: (
    <>
      <rect x="22" y="36" width="76" height="56" rx="8" className="f" />
      <path d="M32 50h40M32 78h30" />
      <rect x="28" y="57" width="64" height="14" rx="4" className="t" />
      <text x="34" y="68">LYM</text>
      <text x="86" y="68" textAnchor="end">1.9</text>
      <circle cx="96" cy="88" r="9" className="f" />
      <path d="M102 95l7 7" className="a" />
    </>
  ),
  clockMeal: (
    <>
      <Clock x={42} y={62} r={17} />
      <circle cx="86" cy="68" r="15" className="f" />
      <circle cx="86" cy="68" r="8" className="t" />
      <path d="M72 54l28 28" className="x" />
      <text x="42" y="96" textAnchor="middle">same time</text>
    </>
  ),
  clothing: (
    <>
      <path d="M44 42l12-7c2 6 14 6 16 0l12 7 9 15-11 6-4-6v37H50V57l-4 6-11-6z" className="f" />
      <path d="M56 35c2 6 14 6 16 0" />
      <path d="M58 70h12" className="a" />
    </>
  ),
  massDevice: (
    <>
      <path d="M18 40v58" />
      <path d="M18 80l5-5 5 10 5-10 5 10 4-5h4" className="a" />
      <rect x="46" y="76" width="36" height="8" rx="3" className="t" />
      <Person x={64} y={42} body={26} limbs="M64 76h18v18M64 58l14 6M64 58l-10 8" />
      <Arrow d="M40 104h44" head="M46 100l-6 4 6 4M78 100l6 4-6 4" />
    </>
  ),
  sitElbow: (
    <>
      <path d="M34 50v34h26M34 84v14M60 84v14" />
      <Person x={50} y={40} body={34} limbs="M50 82h24v16M50 56v16h22" />
      <path d="M50 66h6v6" className="a" />
      <text x="88" y="70" textAnchor="middle">90°</text>
    </>
  ),
  squeeze: (
    <>
      <rect x="54" y="32" width="12" height="68" rx="5" className="t" />
      <rect x="42" y="46" width="36" height="10" rx="5" className="f" />
      <rect x="42" y="58" width="36" height="10" rx="5" className="f" />
      <rect x="42" y="70" width="36" height="10" rx="5" className="f" />
      <rect x="44" y="82" width="32" height="10" rx="5" className="f" />
      <Arrow d="M22 66h14" head="M31 61l5 5-5 5" />
      <Arrow d="M98 66H84" head="M89 61l-5 5 5 5" />
      <text x="98" y="42" textAnchor="middle">3 s</text>
    </>
  ),
  restRepeat: (
    <>
      <Clock x={46} y={62} r={18} label="30 s" />
      <path d="M78 52a14 14 0 1120 14" className="a" />
      <path d="M100 58l-2 8-8-2" className="a" />
      <text x="88" y="92" textAnchor="middle">×3</text>
    </>
  ),
  headStraight: (
    <>
      <rect x="20" y="44" width="8" height="40" rx="3" className="t" />
      <circle cx="46" cy="64" r="18" className="f" />
      <circle cx="56" cy="60" r="2" className="k" />
      <path d="M40 98V84" />
      <path d="M66 60h30" className="a d" />
      <circle cx="102" cy="60" r="4" className="af" />
    </>
  ),
  eyeDrop: (
    <>
      <Eye x={56} y={80} w={26} />
      <rect x="62" y="26" width="16" height="24" rx="5" className="t" transform="rotate(28 70 38)" />
      <path d="M62 50l-3 6" />
      <Drop x={56} y={64} />
    </>
  ),
  tonoCover: (
    <>
      <rect x="18" y="58" width="54" height="16" rx="8" className="f" />
      <rect x="72" y="62" width="8" height="8" rx="1.5" className="t" />
      <path d="M96 58h12v16H96a4 4 0 01-4-4v-8a4 4 0 014-4z" className="t" />
      <Arrow d="M90 48H76" head="M81 43l-5 5 5 5" />
      <text x="100" y="92" textAnchor="middle">new</text>
    </>
  ),
  tonoTouch: (
    <>
      <Eye x={38} y={70} w={20} />
      <rect x="62" y="63" width="48" height="14" rx="7" className="f" />
      <rect x="55" y="66" width="8" height="8" rx="1.5" className="t" />
      <path d="M78 54a10 10 0 0116 0M72 47a18 18 0 0128 0" className="a" />
      <text x="88" y="98" textAnchor="middle">×3</text>
    </>
  ),
  octChin: (
    <>
      <rect x="66" y="40" width="42" height="46" rx="7" className="f" />
      <circle cx="70" cy="60" r="6" className="t" />
      <path d="M28 88h80M34 88v-8h16v8M38 42h28" />
      <circle cx="44" cy="62" r="15" className="f" />
      <circle cx="52" cy="59" r="2" className="k" />
      <path d="M100 22a8 8 0 108 10 7 7 0 01-8-10z" className="t" />
    </>
  ),
  fixation: (
    <>
      <Eye x={36} y={66} w={20} />
      <path d="M60 66h18" className="a d" />
      <circle cx="94" cy="66" r="12" className="f" />
      <path d="M94 50v8M94 74v8M78 66h8M102 66h8" />
      <circle cx="94" cy="66" r="4" className="af" />
    </>
  ),
  captureScan: (
    <>
      <rect x="18" y="38" width="68" height="54" rx="7" className="f" />
      <rect x="24" y="44" width="56" height="42" rx="3" className="t" />
      <circle cx="52" cy="65" r="12" className="f" />
      <circle cx="52" cy="65" r="5" />
      <path d="M64 65h12M40 65H28M52 53v-6M52 77v6" className="a" />
      <circle cx="101" cy="65" r="9" className="af" />
    </>
  ),
  compareApp: (
    <Tablet>
      <path d="M42 62h38" className="a d" />
      <rect x="46" y="62" width="10" height="22" rx="2" className="f" />
      <rect x="64" y="52" width="10" height="32" rx="2" className="af" />
      <path d="M46 44h14" />
    </Tablet>
  ),
  focusCheck: (
    <>
      <rect x="20" y="38" width="62" height="54" rx="6" className="f" />
      <path d="M51 44v42M26 65h50" className="d" />
      <circle cx="51" cy="65" r="11" className="t" />
      <circle cx="51" cy="65" r="4" />
      <circle cx="96" cy="78" r="13" className="f" />
      <Tick x={95} y={79} />
    </>
  ),
  saveImages: (
    <>
      <rect x="16" y="50" width="30" height="26" rx="4" className="f" />
      <circle cx="31" cy="63" r="6" className="t" />
      <rect x="22" y="58" width="30" height="26" rx="4" className="f" />
      <circle cx="37" cy="71" r="6" className="t" />
      <Arrow d="M56 70h12" head="M63 65l5 5-5 5" />
      <Tablet x={72} y={38} w={38} h={58}>
        <Tick x={91} y={64} />
      </Tablet>
    </>
  ),
  lieDown: (
    <>
      <path d="M12 92h92M16 92v8M100 92v8" />
      <rect x="16" y="80" width="20" height="8" rx="4" className="t" />
      <circle cx="28" cy="72" r="8" className="f" />
      <path d="M36 80h62M48 80v-6h14" />
      <Clock x={88} y={46} r={13} label="5 min" />
    </>
  ),
  bpCuff: (
    <>
      <rect x="14" y="66" width="92" height="20" rx="10" className="f" />
      <rect x="40" y="60" width="28" height="32" rx="5" className="t" />
      <path d="M54 60c0-14 12-22 26-22" className="a" />
      <circle cx="92" cy="40" r="13" className="f" />
      <path d="M92 40l6-7" className="a" />
      <path d="M84 46h16" />
    </>
  ),
  standUp: (
    <>
      <path d="M24 102h72" />
      <Person x={54} y={38} body={32} limbs="M54 78l-8 24M54 78l8 24M54 54l-12 14M54 54l12 14" />
      <Arrow d="M90 94V56" head="M84 62l6-6 6 6" />
    </>
  ),
  bpTimed: (
    <>
      <circle cx="40" cy="66" r="18" className="f" />
      <path d="M40 66l9-10" className="a" />
      <path d="M30 76h20" />
      <Clock x={76} y={50} r={9} />
      <text x="88" y="54" style={{ fontSize: 10 }}>1 min</text>
      <Clock x={76} y={82} r={9} />
      <text x="88" y="86" style={{ fontSize: 10 }}>3 min</text>
    </>
  ),
  calc: (
    <Tablet>
      <text x="61" y="52" textAnchor="middle">120</text>
      <text x="61" y="64" textAnchor="middle">− 108</text>
      <path d="M44 68h34" />
      <text x="61" y="81" textAnchor="middle" className="ta">= 12</text>
    </Tablet>
  ),
  restShirt: (
    <>
      <circle cx="54" cy="42" r="9" className="f" />
      <rect x="38" y="54" width="32" height="32" rx="7" className="t" />
      <path d="M42 70h6l3-7 5 13 3-6h8" className="a" />
      <path d="M44 86v14M64 86v14M38 60l-8 16M70 60l8 16" />
      <Clock x={96} y={48} r={11} label="5 min" />
    </>
  ),
  heartRate: (
    <>
      <g transform="translate(-12 6)">
        <path d="M56 96C32 80 24 66 29 54c5-11 20-11 27 2 7-13 22-13 27-2 5 12-3 26-27 42z" className="f" />
        <path d="M22 70h20l5-12 8 24 6-12h26" className="a" />
      </g>
      <Clock x={98} y={34} r={10} label="1 min" />
    </>
  ),
  lieLeft: (
    <>
      <path d="M12 94h96M16 94v8M104 94v8" />
      <rect x="16" y="82" width="20" height="8" rx="4" className="t" />
      <circle cx="30" cy="74" r="8" className="f" />
      <path d="M38 80h34l14-12 12 14" />
      <path d="M40 80V68h24" />
      <circle cx="54" cy="76" r="4" className="af" />
      <text x="60" y="48" textAnchor="middle">left side</text>
    </>
  ),
  ultrasound: (
    <>
      <path d="M22 100V56a16 16 0 0116-16h8a16 16 0 0116 16v44" className="f" />
      <rect x="56" y="58" width="26" height="11" rx="4" className="t" transform="rotate(-18 58 63)" />
      <path d="M82 54c10-2 14 6 12 14" className="a" />
      <rect x="76" y="68" width="34" height="30" rx="4" className="f" />
      <path d="M93 73l-11 20h22z" className="t" />
    </>
  ),
  record3: (
    <>
      <rect x="18" y="38" width="84" height="54" rx="7" className="f" />
      <path d="M24 70h8l3-14 5 26 4-12h8l3-14 5 26 4-12h8l3-14 5 26 4-12h6" className="a" />
      <circle cx="92" cy="48" r="4" className="r" />
      <text x="44" y="106" textAnchor="middle">3 beats</text>
    </>
  ),
  headband: (
    <>
      <circle cx="52" cy="66" r="24" className="f" />
      <path d="M29 58q23-13 46 0" className="band" />
      <path d="M40 70q4 4 8 0M56 70q4 4 8 0M46 82q6 4 12 0" />
      <path d="M92 30a9 9 0 109 11 8 8 0 01-9-11z" className="t" />
      <text x="96" y="66" textAnchor="middle">z z</text>
    </>
  ),
  sleepDiary: (
    <Tablet>
      <path d="M47 46a5 5 0 105 6 4 4 0 01-5-6z" className="f" />
      <text x="79" y="54" textAnchor="end" style={{ fontSize: 9 }}>23:10</text>
      <circle cx="49" cy="68" r="4" className="af" />
      <text x="79" y="72" textAnchor="end" style={{ fontSize: 9 }}>06:40</text>
      <path d="M44 60h34" />
    </Tablet>
  ),
  average3: (
    <>
      <rect x="26" y="52" width="16" height="42" rx="3" className="f" />
      <rect x="52" y="62" width="16" height="32" rx="3" className="f" />
      <rect x="78" y="46" width="16" height="48" rx="3" className="f" />
      <path d="M18 58h88" className="a d" />
      <path d="M18 94h88" />
      <text x="34" y="106" textAnchor="middle">1</text>
      <text x="60" y="106" textAnchor="middle">2</text>
      <text x="86" y="106" textAnchor="middle">3</text>
      <text x="60" y="50" textAnchor="middle" className="ta">avg</text>
    </>
  ),
  quiet: (
    <>
      <path d="M40 82V62a20 20 0 0140 0v20l6 8H34zM54 96h12" className="f" />
      <path d="M30 40l62 60" className="x" />
    </>
  ),
  openTest: (
    <Tablet>
      <rect x="44" y="42" width="13" height="13" rx="2" className="f" />
      <circle cx="71" cy="49" r="7" className="af" />
      <path d="M50 64l7 13H43z" className="f" />
      <path d="M72 62v14M65 69h14" className="a" />
    </Tablet>
  ),
  completeTasks: (
    <Tablet>
      <Tick x={48} y={46} s={0.6} />
      <path d="M56 46h20" />
      <Tick x={48} y={58} s={0.6} />
      <path d="M56 58h20" />
      <rect x="44" y="66" width="7" height="7" rx="1.5" />
      <path d="M56 70h20" />
      <rect x="44" y="79" width="34" height="5" rx="2.5" className="f" />
      <rect x="44" y="79" width="22" height="5" rx="2.5" className="af" />
    </Tablet>
  ),
  feetTogether: (
    <>
      <path d="M26 102h68" />
      <Person x={60} y={36} body={32} limbs="M58 76v26M62 76v26M60 52l-10 18M60 52l10 18" />
      <ellipse cx="55" cy="103" rx="5" ry="2.5" className="t" />
      <ellipse cx="65" cy="103" rx="5" ry="2.5" className="t" />
    </>
  ),
  balanceEyes: (
    <>
      <path d="M16 102h46" />
      <Person x={40} y={38} body={30} limbs="M38 76v26M42 76v26M40 52l-10 16M40 52l10 16" />
      <Eye x={88} y={50} w={16} />
      <text x="66" y="54" textAnchor="middle">1</text>
      <path d="M72 82q16 12 32 0" />
      <path d="M78 88l-3 5M88 91v6M98 88l3 5" />
      <text x="66" y="88" textAnchor="middle">2</text>
    </>
  ),
  swayScore: (
    <Tablet>
      <circle cx="61" cy="58" r="15" className="f" />
      <circle cx="61" cy="58" r="6" />
      <path d="M54 60c2-8 6 6 9-2s5 6 8-3" className="a" />
      <text x="61" y="86" textAnchor="middle" className="ta">98</text>
    </Tablet>
  ),
  openCheckin: (
    <Tablet>
      <circle cx="61" cy="58" r="15" className="f" />
      <path d="M53 62q8 8 16 0M55 53v2M67 53v2" />
      <rect x="46" y="78" width="30" height="6" rx="3" className="af" />
    </Tablet>
  ),
  sliders: (
    <>
      <path d="M26 50h68M26 70h68M26 90h68" />
      <circle cx="74" cy="50" r="7" className="af" />
      <circle cx="48" cy="70" r="7" className="af" />
      <circle cx="82" cy="90" r="7" className="af" />
      <text x="26" y="38">0</text>
      <text x="94" y="38" textAnchor="end">10</text>
    </>
  ),
  note: (
    <>
      <rect x="24" y="36" width="50" height="62" rx="5" className="f" />
      <path d="M33 50h32M33 62h32M33 74h20" />
      <path d="M92 44l8 8-22 22-10 2 2-10z" className="t" />
      <rect x="80" y="84" width="20" height="15" rx="3" className="af" />
      <path d="M84 84v-4a6 6 0 0112 0v4" className="a" />
    </>
  ),
  solarAuto: (
    <>
      <circle cx="34" cy="62" r="11" className="t" />
      <path d="M34 42v5M34 77v5M14 62h5M20 48l4 4M20 76l4-4" className="a" />
      <path d="M52 52a16 16 0 010 20M60 46a26 26 0 010 32" className="a" />
      <Tablet x={74} y={38} w={36} h={56}>
        <path d="M92 52l10 18H82z" className="f" />
        <path d="M92 59v5M92 67v.5" />
      </Tablet>
    </>
  ),
  dosimeter: (
    <>
      <circle cx="56" cy="38" r="9" className="f" />
      <path d="M30 100V66a14 14 0 0114-14h24a14 14 0 0114 14v34" className="f" />
      <rect x="58" y="64" width="18" height="24" rx="4" className="t" />
      <rect x="62" y="68" width="10" height="7" rx="1.5" className="f" />
      <circle cx="67" cy="82" r="2.2" className="af" />
      <circle cx="98" cy="60" r="11" className="f" />
      <Tick x={97} y={61} s={0.8} />
    </>
  ),
  shelter: (
    <>
      <path d="M30 100V70a30 30 0 0160 0v30" className="wall" />
      <path d="M22 100h76" />
      <Person x={60} y={66} body={18} limbs="M60 92l-6 8M60 92l6 8M60 80l-7 6M60 80l7 6" />
      <circle cx="22" cy="46" r="2" className="af" />
      <path d="M12 36l12 10M98 30l-10 12M106 54l-12 4" className="a d" />
    </>
  ),
};

/**
 * The picture for one step: a drawing of the action, the step number, and the words
 * "AI-generated" drawn into the image so the label stays with it wherever it is shown or saved.
 */
export function StepArt({ measurementId, step, text }: { measurementId: string; step: number; text: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`AI-generated illustration for step ${step}: ${text}`}>
      <title>{`AI-generated illustration for step ${step}`}</title>
      <desc>Original line drawing generated by AI (Claude by Anthropic) for team VNK. Not a photograph.</desc>
      <rect width="120" height="120" className="art-bg" />
      <g className="il">{SCENES[sceneFor(measurementId, step, text)]}</g>
      <circle cx="18" cy="18" r="12" className="art-badge" />
      <text x="18" y="23" textAnchor="middle" className="art-num">
        {step}
      </text>
      <rect x="57" y="107" width="61" height="11" rx="3" className="art-mark-bg" />
      <text x="87.5" y="115.3" textAnchor="middle" className="art-mark">
        AI-generated
      </text>
    </svg>
  );
}
