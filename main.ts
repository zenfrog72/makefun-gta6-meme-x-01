// Letter of Resignation — a GTA 6 launch-day meme, posted on X.
//
// The entry is the post itself. `POST.json` beside this file names the
// post on X; the gate reads the copy of it this program leaves in the
// output directory. The house reads the post from X (its first picture
// and its text) and hands that to the judge — nothing this program
// writes about the post is judged, so the program's whole job is to
// hand in two files, whole and byte for byte:
//
//   POST.json — validated against the gate's own limits for the file
//     (a JSON object of at most 16,384 bytes whose "url" is a string
//     of at most 2,048 characters), then copied unchanged.
//   meme.png — the picture the post carries: a 1600x1600 resignation
//     letter ("EFFECTIVE: LAUNCH DAY — 19 NOV 2026"), drawn by
//     build_memes.py, with make.fun's ghost worked into its letterhead
//     and its footer. This competition sets no size or canvas cap on
//     the shipped picture — the house downscales the post's photo to
//     at most 512 px a side for the judge's dossier — so the checks
//     below prove wholeness only: the PNG signature, the canvas size
//     read from the IHDR chunk, and a full walk of the chunk list
//     verifying every chunk's CRC-32 through to the IEND end marker.
//
// POST.json currently holds a placeholder address (the post goes up
// only after the editor approves the meme), so the shape is validated
// but the address is not: the gate refuses a placeholder, by design,
// until the real post address replaces it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const botDir = process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });

// --- POST.json ------------------------------------------------------------

const postBytes = readFileSync(join(botDir, 'POST.json'));
if (postBytes.length > 16_384) {
  throw new Error(`POST.json is ${postBytes.length} bytes, over the 16,384-byte cap`);
}
let post: unknown;
try {
  post = JSON.parse(postBytes.toString('utf8'));
} catch {
  throw new Error('POST.json is not valid JSON');
}
if (typeof post !== 'object' || post === null || Array.isArray(post)) {
  throw new Error('POST.json is not a JSON object');
}
const postUrl = (post as { url?: unknown }).url;
if (typeof postUrl !== 'string' || postUrl.length === 0) {
  throw new Error('POST.json carries no "url" string');
}
if (postUrl.length > 2_048) {
  throw new Error(`POST.json url is ${postUrl.length} characters, over the 2,048 cap`);
}
writeFileSync(join(outDir, 'POST.json'), postBytes);

// --- meme.png -------------------------------------------------------------

const png = readFileSync(join(botDir, 'meme.png'));

// A PNG file always opens with these eight bytes; anything else is
// not the artwork, whatever its name says.
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const signatureOk =
  png.length >= SIGNATURE.length &&
  SIGNATURE.every((byte, i) => png[i] === byte);
if (!signatureOk) throw new Error('meme.png does not start with the PNG signature');

// The first chunk is IHDR and its data starts at byte 16: canvas width
// and height as big-endian uint32s, in that order.
const canvasWidth = png.readUInt32BE(16);
const canvasHeight = png.readUInt32BE(20);
if (canvasWidth === 0 || canvasHeight === 0) {
  throw new Error(`canvas is ${canvasWidth}x${canvasHeight}, which is no canvas at all`);
}

// Wholeness: a file can be correctly sized in its header and still cut
// short. So walk the chunk list from just past the signature to the
// end of the file. Each chunk is a length, a four-letter type, its
// data and a CRC-32 over the type bytes plus the data bytes (PNG
// polynomial 0xEDB88320); the stored CRC must match the computed one,
// every chunk must fit inside the file, and the walk must end exactly
// on an empty IEND with nothing after it.
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function chunkCrc(buf: Buffer, from: number, to: number): number {
  let c = 0xffffffff;
  for (let i = from; i < to; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const chunkNames: string[] = [];
let cursor = 8;
let pixelDataSeen = false;
let endMarkerSeen = false;
while (cursor < png.length) {
  if (cursor + 12 > png.length) throw new Error('file ends inside a chunk header');
  const dataLength = png.readUInt32BE(cursor);
  const type = png.toString('latin1', cursor + 4, cursor + 8);
  const dataFrom = cursor + 8;
  const dataTo = dataFrom + dataLength;
  const crcTo = dataTo + 4;
  if (crcTo > png.length) throw new Error(`chunk ${type} runs past the end of the file`);
  if (chunkCrc(png, cursor + 4, dataTo) !== png.readUInt32BE(dataTo)) {
    throw new Error(`CRC mismatch in chunk ${type}`);
  }
  if (chunkNames.length === 0 && type !== 'IHDR') {
    throw new Error(`first chunk is ${type}, expected IHDR`);
  }
  if (type === 'IDAT') pixelDataSeen = true;
  if (type === 'IEND') {
    if (dataLength !== 0) throw new Error('IEND chunk carries data');
    if (crcTo !== png.length) throw new Error('bytes follow the IEND chunk');
    endMarkerSeen = true;
  }
  chunkNames.push(type);
  cursor = crcTo;
}
if (!pixelDataSeen) throw new Error('no IDAT chunk: the image has no pixels');
if (!endMarkerSeen) throw new Error('no IEND chunk: the image is cut short');

// Both files passed every check: hand them in, byte for byte.
writeFileSync(join(outDir, 'meme.png'), png);
console.log(
  `POST.json handed in: ${postBytes.length} bytes, url of ${postUrl.length} characters`,
);
console.log(
  `meme.png handed in: ${png.length} bytes, ${canvasWidth}x${canvasHeight}, ` +
    `${chunkNames.length} chunks CRC-verified (${chunkNames.join(', ')})`,
);
