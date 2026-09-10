# Playing Arcanum Machina on your own machine

The game is a web page with no build step and no server of its own. It runs from
<https://salemlayonn-gif.github.io/arcanum-machina/>, and once you have opened it
once it keeps working with no network.

---

## The short version

1. Open <https://salemlayonn-gif.github.io/arcanum-machina/> in Edge or Chrome.
2. Address bar → the **install icon** (a screen with an arrow), or menu → *Apps → Install this site as an app*.
3. It gets its own window, its own icon, and a Start-menu entry. **F11** for full screen.
4. In the game: **CONFIG → SAVEGAME FILES → SAVE TO FILE**, and point it at whatever folder
   you keep savegames in. After the first time, saving is one click — it remembers the file.

That is the whole thing. What follows is detail.

---

## Installing it as an app (recommended)

The game ships a web app manifest and a service worker, which means Edge and Chrome will
offer to install it. An installed copy:

- opens in its own window with no address bar or tabs,
- has a proper icon and a Start-menu / taskbar entry,
- **works with no internet** — the service worker keeps the whole game cached,
- updates itself the next time you open it with a network.

On a phone it is the same: open the link, then *Add to Home screen*.

## A Desktop shortcut instead

If you would rather not install it, `tools/install-desktop.ps1` makes a Desktop shortcut
that opens the game in a bare window and creates a savegames folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\install-desktop.ps1
```

| Option | What it does |
|---|---|
| `-Fullscreen` | the window starts full screen |
| `-Local` | run from this folder instead of the web — a fully offline copy |
| `-SaveFolder <path>` | where the savegames folder goes (default `Documents\Arcanum Machina\savegames`) |

No admin rights, nothing written outside your profile.

> `-Local` opens the game from a `file://` path. That works, but browsers do not allow a
> service worker on `file://`, so there is no cache layer — which does not matter, because
> the files are already on your disk. Note that a `file://` copy keeps its progress
> **separately** from the web copy; see below.

---

## Where your progress lives

There are two kinds of save, and it is worth knowing the difference.

**1. The automatic one.** The game saves itself every 30 seconds into the browser's
`localStorage`. That is invisible, it needs no clicking, and it is tied to the *origin* —
so the installed app and `https://…github.io/arcanum-machina/` share one save, while a
`file://` copy has its own. Clearing "site data" for that origin erases it.

**2. Savegame files.** **CONFIG → SAVEGAME FILES**:

- **SAVE TO FILE** — writes a real `.json` file wherever you point it. The first time it
  asks; after that it writes to the same file with one click. In Edge and Chrome the game
  remembers the file across restarts (it may ask once for permission again).
- **SAVE AS…** — write a second file, for keeping a run before an Awakening.
- **LOAD FROM FILE** — pick a savegame back up. The game reloads into it.

A savegame file is plain readable JSON. Copy them, back them up, keep dated ones — they are
yours. In a browser without the file picker (Firefox, Safari) the same buttons fall back to a
normal download and a file chooser, which works just as well.

**3. A save code.** **CONFIG → SAVE CODE** is the same data as text, for pasting a run from
one device to another.

### Moving a run between the phone and the desktop

Save to file on one, load from file on the other. Or copy the save code across. The formats
are identical.

---

## Keeping the game itself up to date

The installed app checks for a new version whenever it starts with a network, and the
service worker swaps the cache when the version changes. If you ever want to force it:
close the app window, reopen it, and it will be current. Your progress is untouched by an
update — it lives in `localStorage` and in your savegame files, not in the cache.

---

## If something goes wrong

| Symptom | What to do |
|---|---|
| The install icon never appears | It only shows on `https://` (or `localhost`). It will not appear on a `file://` copy. |
| Progress vanished | Check you are on the same origin — the installed app and a `file://` copy do not share saves. Then load your last savegame file. |
| The game looks stale after an update | Close and reopen the window. If it persists: browser menu → *Settings → site data* → clear for the site (this **does** erase the automatic save, so save to file first). |
| No sound | Browsers keep audio off until you click. Click anything once. Then CONFIG → SOUND. |
| Text is cramped on a phone | The panels have a narrow layout under 620px. Rotating to landscape gives the wide one back. |
