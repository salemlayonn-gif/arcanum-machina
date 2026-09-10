# Arcanum Machina — Documentació del projecte

## Què és aquest projecte

**ARCANUM MACHINA — Echoes of the First Age**: un idle/RPG de text en anglès (exploració,
combat, crafting, prestige). Un sol `index.html` + `css/style.css` + mòduls a `js/`
(`data.js`, `state.js`, `engine.js`, `combat.js`, `exploration.js`, `prestige.js`,
`render.js`, `music.js`, `sounds.js`, `main.js`). Sense build step: és HTML/CSS/JS pla.

Historial de canvis i decisions de disseny: [`DEVLOG.md`](DEVLOG.md).
Revisió del joc contra el llibre, amb l'estat de cada proposta: [`IMPROVEMENTS.md`](IMPROVEMENTS.md).
El llibre (`../arcanum-machina-book`) és el cànon: veu d'en Salem (precisa, seca, mai melodramàtica),
res no «mor» en combat, els Vault Automatons no es combaten.

**El llibre és públic** des del 2026-09-11: repo `salemlayonn-gif/arcanum-machina-book` (compte personal,
mateixa configuració de credencials) publicat amb GitHub Pages a
<https://salemlayonn-gif.github.io/arcanum-machina-book/>. El `00_bible.md` i el `27_consistency_notes.md`
són al `.gitignore` a propòsit (documents de treball, «not for publication»). La Biblioteca del joc
(`DATA.library`) enllaça cada capítol amb l'àncora del lector: si es reordena el llibre, cal revisar les
àncores — el harness comprova que totes són úniques i vàlides, però no que existeixin al lector.

**Regles:** actualitzar `G.version` (a `state.js`) **i el `VERSION` de `sw.js`** a cada versió — si no es
puja el del service worker, els jugadors es queden amb la memòria cau antiga. Afegir una entrada al
`DEVLOG.md` a cada sessió amb canvis. Sense toasts d'idle-game (cap «Unlocked!»); les cadenes noves en la
veu del llibre.

**El joc és una PWA** publicada a <https://salemlayonn-gif.github.io/arcanum-machina/> (Pages des de `main`,
arrel). Si s'afegeix un fitxer JS nou, cal posar-lo a `index.html` **i** a la llista `ASSETS` de `sw.js`.
Les icones es generen amb `node tools/make-icons.js` (no hi ha dependències; també fa l'`icon.ico`).
Instal·lació i desats a fitxer: `INSTALL.md`.

**Amplada de pantalla:** `RENDER.narrow()` (<620px) tria una disposició ASCII estreta de debò (panell 30
columnes, mapa en cadena, prestatge de 4 lloms per fila). Si es toca qualsevol dibuix ASCII, cal comprovar
les dues amplades — el harness ho fa.

**Test de regressió:** `node test/harness.js` carrega els mòduls reals a Node amb un DOM fals i prova
caps, descodificació de shards, la seqüència de l'Awakening, el final, encontres guionats, els renders
ASCII i save/load. Executar-lo abans de cada commit.

---

## GitHub — compte personal, NO el de professor

Aquest és un projecte **personal/d'oci d'en Robert**, separat de la seva feina de docent.

- Repo remot: **`salemlayonn-gif/arcanum-machina`** (públic) — el compte personal, **mai**
  `robertpotau` (compte de professor, usat per als jocs educatius d'aula).
- La identitat de git d'aquesta carpeta ja està fixada localament (`git config` **local**,
  no global) a `salemlayonn-gif` amb el correu privat `@users.noreply.github.com` d'aquell
  compte — no el gmail de professor.
- El *credential helper* de git també està fixat **només en aquest repo** (`.git/config`
  local) perquè sempre faci servir el token de `salemlayonn-gif` via
  `gh auth token -u salemlayonn-gif`, encara que el compte "actiu" global del `gh` CLI de
  la màquina sigui `robertpotau`. Res d'això afecta els altres repos.
- **No cal repetir aquesta configuració**: ja està feta a `.git/config` d'aquesta carpeta.
  Si mai es clona de nou en un altre lloc, cal refer-la (veure sessió de xat del
  2026-09-10, o la memòria `github_accounts`).

## Flux de treball: primer local, després GitHub

**Regla del projecte: es programa i es prova en local primer. Només es puja a GitHub
(`git push`) quan en Robert ho demana explícitament o ho confirma.**

- Els commits locals (`git commit`) es poden fer lliurement mentre s'avança — no calen
  permís cada vegada, són reversibles i locals.
- **`git push` sempre requereix confirmació explícita d'en Robert abans d'executar-se.**
  No pujar automàticament encara que la sessió anterior ja hagués confirmat un push: cada
  push és una confirmació nova.
- Abans de proposar un push: assegurar-se que el joc s'ha provat en local (veure següent
  secció) i que no hi ha errors de consola.

## Com provar-ho en local

És HTML/JS pla, no cal build. Dues opcions:

1. **Obrir `index.html` directament al navegador** (funciona per a la majoria de proves).
2. **Servidor local** si cal evitar restriccions de `file://` (per exemple per a fetch/CORS):
   ```bash
   npx --yes serve -l tcp://127.0.0.1:5183 .
   ```
   ⚠️ La sintaxi de `serve` necessita `tcp://host:port`, no `host:port` a soles — amb
   `-l 127.0.0.1:5183` peta amb `Unknown --listen endpoint scheme`.

Comprovació ràpida sense screenshot (sovint poc fiable en aquesta màquina): `read_page` /
`get_page_text` del navegador de Claude per confirmar que la pantalla d'intro carrega i
`read_console_messages` per confirmar que no hi ha errors JS.

---

*Creat 2026-09-10.*
