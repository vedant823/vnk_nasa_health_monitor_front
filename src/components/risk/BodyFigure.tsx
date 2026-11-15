// AI-generated illustration and code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// A simple original outline of a person, drawn as SVG shapes. Each body area is colored by the worst
// zone among its risks. It carries a visible "AI-generated" watermark and is not based on any agency
// artwork or branding.
import { BODY_AREA_LABEL, BODY_AREA_ORDER, type BodyArea } from '../../content/bodyAreas';
import { ZONE_LABEL, type Zone } from '../../lib/zones';
import { AiMark } from '../status/Status';

interface Props {
  zones: Partial<Record<BodyArea, Zone>>;
  selected?: BodyArea | null;
  onSelect?: (area: BodyArea) => void;
  /** Only draw attention to one area (risk screen). */
  highlight?: BodyArea;
  compact?: boolean;
}

export function BodyFigure({ zones, selected, onSelect, highlight, compact }: Props) {
  const areas = BODY_AREA_ORDER.filter((a) => zones[a] !== undefined);
  const cls = (area: BodyArea) => {
    const zone = zones[area] ?? 'none';
    const dim = highlight && highlight !== area && highlight !== 'whole' ? ' dim' : '';
    const sel = selected === area || highlight === area ? ' selected' : '';
    return `area zone-${zone}${dim}${sel}${zones[area] === undefined ? ' absent' : ''}`;
  };
  const props = (area: BodyArea) =>
    onSelect && zones[area] !== undefined
      ? {
          className: `${cls(area)} clickable`,
          role: 'button' as const,
          tabIndex: 0,
          'aria-label': `${BODY_AREA_LABEL[area]}: ${ZONE_LABEL[zones[area] ?? 'none']}`,
          onClick: () => onSelect(area),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(area);
            }
          },
        }
      : { className: cls(area) };

  return (
    <figure className={`body-figure${compact ? ' compact' : ''}`}>
      <div className="body-figure-art">
        <svg viewBox="0 0 200 400" role="img" aria-label="Outline of a body with health areas colored by status">
          {/* Whole body: a soft outline around the figure */}
          <g {...props('whole')}>
            <rect className="aura" x="16" y="3" width="168" height="394" rx="84" />
          </g>
          {/* Arms: muscles */}
          <g {...props('muscles')}>
            <path d="M58 92c-10 6-16 16-18 30l-8 76c-1 9 11 11 13 2l12-66z" />
            <path d="M142 92c10 6 16 16 18 30l8 76c1 9-11 11-13 2l-12-66z" />
          </g>
          {/* Legs: bones */}
          <g {...props('bones')}>
            <path d="M66 226h30l-6 142c-1 12-19 12-19 0z" />
            <path d="M134 226h-30l6 142c1 12 19 12 19 0z" />
          </g>
          {/* Torso base */}
          <path className="torso" d="M62 86h76c4 0 6 3 6 7v126c0 4-3 7-7 7H63c-4 0-7-3-7-7V93c0-4 2-7 6-7z" />
          {/* Lungs */}
          <g {...props('lungs')}>
            <path d="M68 100c8-4 18-2 20 6v44c0 8-22 12-24 0v-38c0-5 1-10 4-12z" />
            <path d="M132 100c-8-4-18-2-20 6v44c0 8 22 12 24 0v-38c0-5-1-10-4-12z" />
          </g>
          {/* Heart */}
          <g {...props('heart')}>
            <path d="M100 150c-16-11-22-20-17-28 4-7 13-6 17 1 4-7 13-8 17-1 5 8-1 17-17 28z" />
          </g>
          {/* Stomach */}
          <g {...props('stomach')}>
            <rect x="74" y="168" width="52" height="42" rx="18" />
          </g>
          {/* Neck: blood and immune system (lymph nodes) */}
          <g {...props('immune')}>
            <rect x="88" y="70" width="24" height="20" rx="6" />
          </g>
          {/* Head: mind and sleep */}
          <g {...props('mind')}>
            <circle cx="100" cy="42" r="30" />
          </g>
          {/* Ears: balance */}
          <g {...props('balance')}>
            <circle cx="68" cy="44" r="7" />
            <circle cx="132" cy="44" r="7" />
          </g>
          {/* Eyes */}
          <g {...props('eyes')}>
            <ellipse cx="89" cy="42" rx="7" ry="5" />
            <ellipse cx="111" cy="42" rx="7" ry="5" />
          </g>
        </svg>
        <AiMark />
      </div>
      {!compact && (
        <figcaption>
          <ul className="area-legend">
            {areas.map((area) => {
              const zone = zones[area] ?? 'none';
              const content = (
                <>
                  <span className={`dot zone-${zone}`} aria-hidden="true" />
                  <span>{BODY_AREA_LABEL[area]}</span>
                  <span className="muted small">{ZONE_LABEL[zone]}</span>
                </>
              );
              return (
                <li key={area}>
                  {onSelect ? (
                    <button type="button" className={`legend-btn${selected === area ? ' selected' : ''}`} onClick={() => onSelect(area)} aria-pressed={selected === area}>
                      {content}
                    </button>
                  ) : (
                    <span className="legend-btn">{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}
