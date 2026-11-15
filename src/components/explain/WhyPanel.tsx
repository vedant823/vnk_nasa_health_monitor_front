// AI-generated code (Claude by Anthropic), reviewed by team VNK. See AI_DISCLOSURE.md.
// Every screen answers the same two questions in plain words.
import { Icon } from '../status/Status';

interface Props {
  why: string;
  space: string;
  /** Risks use "Why pay attention to this?"; measurements use the default. */
  whyTitle?: string;
  open?: boolean;
}

export function WhyPanel({ why, space, whyTitle = 'Why is this exam needed?', open = true }: Props) {
  return (
    <details className="card why-panel" open={open}>
      <summary>
        <Icon name="help" /> {whyTitle} How does spaceflight affect this?
      </summary>
      <div className="why-grid">
        <div>
          <h4>{whyTitle}</h4>
          <p>{why}</p>
        </div>
        <div>
          <h4>How does spaceflight affect this?</h4>
          <p>{space}</p>
        </div>
      </div>
    </details>
  );
}
