export type CharacterId = 'nana' | 'nunu';

/** Art and labels only: both sisters use the same configurable movement. */
export const CHARACTERS: Record<CharacterId, { label: string; gear: 'skate' | 'patins' }> = {
  nana: { label: 'Nana', gear: 'skate' },
  nunu: { label: 'Nunu', gear: 'patins' },
};
