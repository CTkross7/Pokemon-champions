# Champions-exclusive Mega formes

Pokémon Champions invents Mega Evolutions that do **not** exist in the main
series (Meganium-Mega, Floette-Mega, Starmie-Mega, Delphox-Mega,
Dragonite-Mega, Glimmora-Mega, Clefable-Mega, Greninja-Mega, Scovillain-Mega,
Skarmory-Mega, Froslass-Mega). Their base stats and types are **not** in the
open sources this project uses (PokéAPI / the public Showdown `champions` mod),
so they must be filled in here from the **official Champions data**
(`api.app.pokemonchampions.jp` / the in-game "종족값" screen, which the
reference service also credits).

## How to complete an entry

For each mega in `champions-megas.json`, fill:

```jsonc
{
  "id": "meganiummega",          // keep
  "baseSpecies": "meganium",     // keep (used to derive num, Korean name, sprite)
  "megaStone": "Meganiumite",    // keep
  "tier": "UU",                  // optional; falls back to the roster tier
  "types": ["Grass", "Fairy"],   // FILL: 1–2 official types (English)
  "baseStats": {                 // FILL: official base stats
    "hp": 80, "atk": 100, "def": 100, "spa": 120, "spd": 100, "spe": 80
  },
  "abilities": ["Mega Sol"]      // FILL/verify: official ability name(s)
}
```

`build:pokedex` **skips** any entry whose `baseStats` is `null` or whose
`types` is empty, so placeholders never ship as fabricated data. Once an entry
has valid `types` + all six `baseStats`, it appears in the Pokédex (browse,
stats, matchups) on the next `npm run build:pokedex`.

> Note: the in-app **damage calculator** uses `@smogon/calc`, which has its own
> species table and will not know these custom megas until the calc engine is
> extended with a Champions data layer — a separate follow-up. The Pokédex
> display works from `pokedex.json` and needs only this file.
