/**
 * The nation-name input, isolated (BRDC-CLAIM-009 / BRDC-CHAR-001 field-jank note).
 *
 * `NationIdentity` sits in the Keep, which is inside MapView — and MapView re-renders
 * every second on the game clock. A live input in that subtree can lose its caret when a
 * re-render coincides with the mobile keyboard opening. `React.memo` over stable props
 * (a plain string and one `useCallback`) takes the field out of that churn: the parent
 * re-rendering no longer reaches it, and the caret stays put.
 */
import { memo, useState } from 'react';

export interface NationNameFieldProps {
  initial: string;
  placeholder: string;
  onCommit: (name: string) => void;
}

function NationNameFieldInner({ initial, placeholder, onCommit }: NationNameFieldProps) {
  const [draft, setDraft] = useState(initial);
  return (
    <input
      id="nation-name"
      className="nation__name"
      value={draft}
      placeholder={placeholder}
      maxLength={28}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export const NationNameField = memo(NationNameFieldInner);
