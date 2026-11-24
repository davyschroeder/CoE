# Art assets

The image sheets under `public/art/` combine artwork supplied earlier in this project with newly generated artwork for the Isometric Edition. The new child and companion portraits, scenery cutouts, civilian miniatures and material atlas were generated for this iteration with OpenAI image generation.

The earlier hero, NPC and miniature sheets were recovered unchanged from the supplied project files. The menu art, the map of Elyndra, the paper grain and the dedicated portraits of Kael, Seris, Nima, Ilyra, Varek and Korr live in `src/assets/visuals/` and are bundled by Vite.

Art direction: richly painted dark fantasy; warm bronze and ivory light against slate, moss and aether violet. Miniatures use a consistent overhead three-quarter view. Scenery is cut out against transparent alpha; material sheets use top-down surfaces projected by the renderer.

The civilian sheet was corrected to depict innkeeper Tobin as a man and mayor Edda as a woman. Minor NPCs share archetypal art. Atlas source pixels are preserved; the game uses source rectangles and clipping to display cells.

The atlas indices and their named assignments live in `src/ui/portraits.ts`, `src/ui/render/isometric.ts` and `src/ui/render/materials.ts`.

All art was made with ChatGPT / OpenAI image generation for the project owner.
