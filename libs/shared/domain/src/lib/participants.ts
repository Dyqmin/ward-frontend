import type { ParticipantId } from './game-contract';

/** 'nurse_ann_x7k2' → 'Ann' */
export function who(id: ParticipantId | string): string {
  const slug = id
    .replace(/^(nurse|dr)_/, '')
    .replace(/_[a-z0-9]{4}$/, '')
    .replace(/_mock$|_seed$/, '');
  const name = slug.replace(/_/g, ' ');
  return (
    (id.startsWith('dr_') ? 'Dr ' : '') +
    name.charAt(0).toUpperCase() +
    name.slice(1)
  );
}
