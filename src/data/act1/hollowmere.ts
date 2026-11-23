/**
 * Act I — Hollowmere the morning after: small reactive scenes for prologue choices that the main storyline
 * does not otherwise pick up (Lira's fate, the Grey Hawks, Brother Halric's name). All optional.
 */
import type { ContentModule } from './module';

const AFTER = 'prologue_complete && chapter:act1';

export const HOLLOWMERE_A1: ContentModule = {
  dialogues: [
    {
      id: 'a1h_pell', title: 'Pell under the Lantern Tree',
      start: [{ if: 'a1h_pell_seen', node: 'again' }, { if: 'lira_fate=anchored', node: 'anchored' }, { if: 'lira_fate=bottled', node: 'bottled' }, { node: 'faded' }],
      nodes: {
        anchored: {
          speaker: 'dm',
          effects: ['set a1h_pell_seen'],
          text: `Pell is sitting on the bottom rung of the lamplighters' ladder with a little girl wedged against his side — a real girl, solid, with mud on her knees and a kite string wound twice around her wrist as though she is afraid the wind will take her again. Lira. She is eating a heel of bread with enormous concentration.

"She doesn't remember the fog," Pell says, before you can ask. "Or the singing. She thinks she fell asleep in the bell meadow." He looks up at you, fierce. "Don't tell her. I'm going to tell her when she's older. Maybe never."

Across the square, Sister Maren walks past the Lantern Tree without looking at it. Lira waves at her. Maren waves back, kindly, the way you wave at a child you do not know.`,
          interjections: [
            { who: 'ilyra', text: `Ilyra watches Maren go, and says nothing for a long moment. "Every lantern on that tree," she murmurs, "is somebody's whole world. We moved one from the dark to the light. Somewhere, one went the other way."` },
            { who: 'nima', text: `Nima crouches to Lira's height. "Hey. Nice kite." Lira holds it up to show her. Nima's sparks, for once, are perfectly steady.` },
          ],
          options: [
            { text: `"Look after her, Pell."`, tone: 'compassionate', tags: ['mercy'], effects: ['xp 25'], next: 'bye' },
            { text: `"Maren paid for this. She just doesn't know it."`, tone: 'pragmatic', tags: ['honesty'], next: 'cost' },
          ],
        },
        cost: {
          speaker: 'pell',
          text: `Pell's arm tightens around his sister. "Then I'll remember for her," he says. "Somebody should." He looks at the tree, at the one blank lantern Maren still hangs every year without knowing why. "I'll put a name on it. I don't know her name. I'll make one up. That's allowed, isn't it?"`,
          next: 'bye',
        },
        faded: {
          speaker: 'dm',
          effects: ['set a1h_pell_seen'],
          text: `Pell is sitting on the bottom rung of the lamplighters' ladder with the tin music box open on his knees. It plays the lullaby — the bottom half of it, anyway; the comb is missing two teeth. He has hung a lantern on the lowest branch of the tree. The name-panel says LIRA in letters he has gone over so many times the paper has worn thin.

"I'm going to learn the top half," he tells you. "There's an old woman at the mill who knows it. Then it'll be the whole song again." He shuts the box. "She'd want the whole song."`,
          interjections: [
            { who: 'tessa', text: `Tessa sits down on the rung beside him without asking and hums the top half, very quietly, twice, until he can hum it back. Then she gets up and walks away briskly, and does not let anyone see her face.` },
            { who: 'korr', text: `"In the high camps," Korr says, "we sing the dead across the river. You sang her across. That is a brother's work, done well."` },
          ],
          options: [
            { text: `"She'd be proud of you."`, tone: 'compassionate', tags: ['mercy'], effects: ['xp 25'], next: 'bye' },
            { text: `(Leave him to his song.)`, tone: 'leave', end: true },
          ],
        },
        bottled: {
          speaker: 'dm',
          effects: ['set a1h_pell_seen'],
          text: `Pell is sitting on the bottom rung of the lamplighters' ladder. When he sees you, his eyes go straight to your pack — to where the stoppered bottle rides, faintly warm, humming a lullaby only you can hear.

"Is she all right in there?" he asks. "Is it dark? Does she know it's me if I talk to it?" He doesn't wait for an answer. "You said till there's a better answer. You *said*." He sticks out his chin. "So you'd better find one."`,
          interjections: [
            { who: 'vaelis', text: `Vaelis says, very gently for Vaelis, "She is not in the dark. She is in a pause. The difference matters, and I promise you that I will spend a great deal of my very long life making sure the pause ends well."` },
            { who: 'varek', text: `"She's safer in there than out here," Varek tells him. "For now. That's not nothing, kid. That's most of what any of us get."` },
          ],
          options: [
            { text: `"I'll find one. I promise."`, tone: 'compassionate', tags: ['mercy', 'honesty'], effects: ['set a1h_promised_pell', 'xp 25'], next: 'bye' },
            { text: `"I don't know if there is one, Pell."`, tone: 'pragmatic', tags: ['honesty'], next: 'honest' },
          ],
        },
        honest: {
          speaker: 'pell',
          text: `He takes that the way children take hard truths: completely, all at once, and then he puts it somewhere and carries on. "Then don't break the bottle," he says. "That's all. Just don't break it."`,
          next: 'bye',
        },
        bye: { speaker: 'dm', text: `Behind you, the Lantern Tree creaks in the morning wind, and every lantern on it — named and blank — turns a little toward the sun.` },
        again: { speaker: 'pell', text: `"You're still here?" Pell says. "Go on. The world's breaking. Somebody's got to fix it, and it isn't going to be the Mayor."` },
      },
    },
    {
      id: 'a1h_hawks', title: 'The Grey Hawks on the Roofs',
      start: [{ if: 'a1h_hawks_seen', node: 'again' }, { node: 'a' }],
      nodes: {
        a: {
          speaker: 'dag',
          effects: ['set a1h_hawks_seen'],
          text: `Dag Morrow is on a roof on the east road with a mouthful of nails and a bundle of thatch, and three more Grey Hawks are handing straw up to him in a line. He spits the nails into his palm when he sees you.

"Don't look so surprised. You told us we'd be useful last night, so we were useful. Pulled two families out of the Tanner's Row cellars before the fog took 'em." He jerks a thumb at the roof. "And now we're useful again. Mayor's paying in porridge. Worst contract I ever signed." He grins. "Best one too, maybe. Don't tell the lads."`,
          interjections: [
            { who: 'brakka', text: `Brakka eyes the roof with professional disgust. "Your ridge-line's crooked." "It's thatch, dwarf, not a fortress." "Everything's a fortress if you do it right." She is already climbing the ladder.` },
            { who: 'kael', text: `"Sellswords working for porridge," Kael says. "There's a ballad in that somewhere. A short, sad one."` },
          ],
          options: [
            { text: `"Hollowmere's lucky to have you."`, tone: 'friendly', tags: ['charity'], effects: ['rep hollowmere 5', 'xp 25'], next: 'gift' },
            { text: `"Watch the town while we're gone, Dag."`, tone: 'pragmatic', tags: ['tradition'], effects: ['set a1h_hawks_guard', 'rep hollowmere 5', 'xp 25'], next: 'gift' },
          ],
        },
        gift: {
          speaker: 'dag',
          effects: ['give healing_potion 2'],
          text: `"Here." He tosses down two red vials, wrapped in a rag. "Took 'em off a Covenant quartermaster in a card game. Fair and square. Mostly square." He goes back to his nails. "Bring 'em back empty, that's all I ask."`,
        },
        again: { speaker: 'dag', text: `"Still here? Roof's not going to thatch itself, and neither's the world. Off you go."` },
      },
    },
    {
      id: 'a1h_halric', title: 'Chalk on the Cathedral Road',
      start: 'a',
      nodes: {
        a: {
          speaker: 'dm',
          text: `Someone has chalked a name on the flagstones of the cathedral road, in letters a foot high, where everyone going up to the ruin has to step around them: BROTHER HALRIC. Beneath it, in a dozen different hands, people have added things. *He rang the bell.* *He was kind to my grandmother.* *Sorry.* A child has drawn a bell with a smiling face.

Old Wenna is sitting on the wall beside it with a stick of chalk in her lap. "You gave him his name back," she says. "Least the rest of us could do was write it down where it can't be forgotten again." She considers. "Well. Until it rains."`,
          interjections: [
            { who: 'seris', text: `Seris stops, and after a moment kneels and touches two fingers to the chalk. "The Light remembers the faithful," she says quietly. "Even the ones it let fall."` },
            { who: 'orren', text: `"Rain's all right," Orren says. "Rain just means you have to write it again. That's how remembering works anyway."` },
          ],
          options: [
            { text: `(Add a line of your own.)`, tone: 'compassionate', tags: ['tradition', 'mercy'], effects: ['set a1h_halric_line', 'xp 25'], next: 'line' },
            { text: `(Walk on.)`, tone: 'leave', end: true },
          ],
        },
        line: { speaker: 'dm', text: `You take the chalk from Wenna and write, under the smiling bell, the only thing that seems true: *He listened, at the end.* Wenna reads it, nods once, and takes her chalk back.` },
      },
    },
  ],
  objects: [
    { map: 'hollowmere', object: { id: 'a1h_pell', kind: 'npc', name: 'Pell', x: 18, y: 15, if: `${AFTER} && lira_fate`, dialogue: 'a1h_pell', glyph: 'p', blocks: true } },
    { map: 'hollowmere', object: { id: 'a1h_hawks', kind: 'npc', name: 'Dag Morrow on a Roof', x: 31, y: 16, if: `${AFTER} && hawks_help`, dialogue: 'a1h_hawks', glyph: 'D', blocks: true } },
    { map: 'hollowmere', object: { id: 'a1h_halric', kind: 'inspect', name: 'A Name in Chalk', x: 27, y: 10, if: `${AFTER} && halric_named && !a1h_halric_line`, dialogue: 'a1h_halric' } },
  ],
};
