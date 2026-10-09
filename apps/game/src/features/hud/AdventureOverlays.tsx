/**
 * The sanctuary's own transient moments — a discovery, a quest beat, a cipher shard, a
 * wonder found — grouped because they share exactly one gate: none of them exist for a
 * route-mode save (BRDC-MODE-001). The hooks behind them keep running in route mode
 * regardless (BRDC-MODE-002 is what changes the rules underneath, not this ticket);
 * this component only withholds the screens. Lifted out of `MapView`, which is at its
 * line ceiling.
 */
import type { Cell, GameRepository, H3Index } from '@es3/core';
import { EurekaMoment } from '../research/EurekaMoment.js';
import { MythosHeadline } from '../keep/MythosHeadline.js';
import { DreamCard } from '../keep/DreamCard.js';
import { GreatBirth } from '../keep/GreatBirth.js';
import { DiscoveryModal } from '../territory/DiscoveryModal.js';
import type { DiscoveryState } from '../territory/useDiscovery.js';
import { QuestReveal } from '../quest/QuestReveal.js';
import { AdventureDialog } from '../quest/AdventureDialog.js';
import { EncounterDialog } from '../quest/EncounterDialog.js';
import type { FumingLake } from '../quest/useFumingLake.js';
import { CipherReveal } from '../cipher/CipherReveal.js';
import type { Cipher } from '../cipher/useCipher.js';
import { WonderMoment } from '../wonder/WonderMoment.js';
import type { Settings } from './settings.js';

export interface AdventureOverlaysProps {
  isRoute: boolean;
  discovery: DiscoveryState;
  owned: readonly Cell[];
  onOpenCell: (h3: H3Index) => void;
  quest: FumingLake;
  cipher: Cipher;
  settings: Settings;
  standingOn: H3Index | null;
  /** For the moments that read the store themselves (BRDC-EUREKA-001). */
  repository: GameRepository | null;
  /** A route is playing back: finds wait behind a button (BRDC-SIM-002). */
  quiet?: boolean;
}

export function AdventureOverlays({
  isRoute,
  discovery,
  owned,
  onOpenCell,
  quest,
  cipher,
  settings,
  standingOn,
  repository,
  quiet = false,
}: AdventureOverlaysProps) {
  if (isRoute) return null;

  return (
    <>
      <DiscoveryModal
        discovered={discovery.discovered}
        owned={owned}
        revealed={discovery.revealed}
        onOpenCell={onOpenCell}
        onReveal={discovery.onReveal}
        quiet={quiet}
      />
      <QuestReveal found={quest.justFound} onDismiss={quest.dismissFound} settings={settings} />
      <CipherReveal found={cipher.justFound} view={cipher.view} settings={settings} onDismiss={cipher.dismiss} />
      {quest.questHex ? (
        <AdventureDialog binding={quest.adventures} onHex={quest.atStageHex} onClose={() => quest.openQuestHex(null)} />
      ) : null}
      <EncounterDialog encounter={discovery.encounter} standingOn={standingOn} onChoose={discovery.onEncounterChoice} />
      <EurekaMoment repository={repository} owned={owned} />
      <MythosHeadline repository={repository} />
      <DreamCard repository={repository} owned={owned} />
      <GreatBirth repository={repository} owned={owned} />
      {discovery.wonderFound ? <WonderMoment id={discovery.wonderFound} onClose={discovery.clearWonder} /> : null}
    </>
  );
}
