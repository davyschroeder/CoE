export interface NpcDef { id: string; name: string; title: string; hue: number; glyph: string; desc: string; }

export const NPCS: NpcDef[] = [
  { id: 'maren', name: 'Sister Maren Ash', title: 'Keeper of the Cathedral Records', hue: 210, glyph: 'M', desc: 'Gentle, tired, ink-stained fingers. She smiles as if apologising for something.' },
  { id: 'wenna', name: 'Old Wenna', title: 'Hedge-witch', hue: 120, glyph: 'W', desc: 'Eighty-eight years old, sharp as a thorn, smelling of rue and woodsmoke.' },
  { id: 'hale', name: 'Captain Roderic Hale', title: 'Captain of the Town Watch', hue: 0, glyph: 'H', desc: 'Grey-bearded, square-shouldered, plainly out of his depth and too honest to hide it.' },
  { id: 'mayor', name: 'Mayor Edda Brannock', title: 'Mayor of Hollowmere', hue: 30, glyph: 'E', desc: 'A practical woman who holds the town together with lists, and holds the lists together with string.' },
  { id: 'tobin', name: 'Tobin Marsh', title: 'Innkeeper of the Lantern & Lamb', hue: 40, glyph: 'T', desc: 'Round, rosy and incapable of keeping a secret for longer than a pint.' },
  { id: 'garrick', name: 'Garrick Dunmore', title: 'Blacksmith', hue: 15, glyph: 'G', desc: 'Forearms like hams, voice like a forge bellows, gentle with horses.' },
  { id: 'ysolde', name: 'Ysolde Quill', title: 'Merchant of Quill\'s Sundries', hue: 300, glyph: 'Q', desc: 'Sharp-eyed shopkeeper who knows the price of everything and the value of most things.' },
  { id: 'pell', name: 'Pell', title: 'A boy of about ten', hue: 50, glyph: 'p', desc: 'Freckled, grubby, fierce. Clutches a tin music box.' },
  { id: 'corvin', name: 'Corvin Thale', title: 'Travelling Scholar', hue: 180, glyph: 'c', desc: 'Nervous, earnest, spectacles cracked, boots caked in centuries-old mud.' },
  { id: 'dag', name: 'Dag Morrow', title: 'Captain of the Grey Hawks', hue: 25, glyph: 'D', desc: 'Scarred, loud and grinning. A grey hawk feather in his cap.' },
  { id: 'lio', name: 'Lio Fenwick', title: 'Minstrel', hue: 330, glyph: 'l', desc: 'A lanky young minstrel with a bruised lute and a braver heart than sense.' },
  { id: 'hob', name: 'Old Hob', title: 'Farmer', hue: 80, glyph: 'o', desc: 'Weathered, toothless, cheerful, and convinced the moon used to be bigger.' },
  { id: 'mira', name: 'Mira', title: 'Lantern-seller', hue: 55, glyph: 'm', desc: 'A girl of twelve with a tray of paper lanterns and a fierce sales pitch.' },
  { id: 'abel', name: 'Abel Thorn', title: 'Miller', hue: 35, glyph: 'A', desc: 'A big, flour-dusted man whose family lives above the mill.' },
  { id: 'lira', name: 'Lira', title: 'An echo', hue: 200, glyph: 'L', desc: 'A small girl made of grey light, humming a lullaby.' },
  { id: 'halric', name: 'Brother Halric', title: 'The Bellwarden', hue: 45, glyph: 'B', desc: 'A man and a bell, fused into one grieving thing.' },
  { id: 'ysolt', name: 'Seeker Ysolt Ravencourt', title: 'Seeker of the Aether Conclave', hue: 260, glyph: 'Y', desc: 'Grey coat, silver instruments, a voice like a closing door.' },
  { id: 'maelis', name: 'A Voice', title: 'From within the Heart', hue: 220, glyph: '✧', desc: 'Calm, archaic, fond. Unbearably old.' },
  { id: 'sentinel', name: 'Echo Sentinel', title: 'Ithari guardian construct', hue: 185, glyph: 'S', desc: 'Stone and singing crystal.' },
  { id: 'ysolde_echo', name: 'The Other Ysolde', title: 'An echo', hue: 300, glyph: 'q', desc: 'Ysolde Quill as she might have been: grey, translucent, furious.' },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));
