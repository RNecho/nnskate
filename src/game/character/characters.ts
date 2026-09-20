export type CharacterId = 'nana' | 'nunu';
export const CHARACTER_ORDER: CharacterId[] = ['nana', 'nunu'];
export function nextCharacter(id: CharacterId, step = 1): CharacterId {
  return CHARACTER_ORDER[(CHARACTER_ORDER.indexOf(id) + step + CHARACTER_ORDER.length) % CHARACTER_ORDER.length];
}

/** Art and labels only: all characters share the same movement and powers. */
export const CHARACTERS: Record<CharacterId, { label: string; gear: 'skate' | 'patins' }> = {
  nana: { label: 'Nana', gear: 'skate' },
  nunu: { label: 'Nunu', gear: 'patins' },
};
