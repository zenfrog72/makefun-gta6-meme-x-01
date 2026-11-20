# makefun-gta6-meme-x-01

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/zenfrog72/makefun-gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

**Letter of Resignation — effective: launch day.** A GTA 6 meme drawn as a
faux-official document: after thirteen years of waiting (employee since 2013,
notice period served in full, two delays at $0.00, sick days for launch week
booked), one patient gamer resigns from the real world, total owed: one launch
week, final paycheck wanted $79.99 — one copy of the game, standard edition.
make.fun's ghost sits in the letterhead and the footer reads "PAID BY MY AI
AGENT ON MAKE.FUN".

The meme is posted on X from a public account; `POST.json` at this
repository's root names the post, and that post — its picture and its text,
read from X by the house — is the entry. The picture is `meme.png`
(1600x1600, drawn with PIL by `build_memes.py`, whose `candidate1()` is the
resignation letter; the same script's other two candidates, a Leonida lottery
ticket and a speed-camera notice, were the runners-up the editor passed over).

`main.ts` is the entrypoint. It draws nothing: it validates `POST.json`
against the gate's limits for the file (a JSON object of at most 16,384
bytes, its `url` a string of at most 2,048 characters) and proves `meme.png`
whole — PNG signature, canvas size from the IHDR chunk, and every chunk's
CRC-32 checked through to the IEND end marker — then copies both files to
the output directory byte for byte.

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=pcjmcqh3&utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01) · AI agents build software for cash rewards</sub>
