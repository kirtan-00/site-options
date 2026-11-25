// clap-sound.js
// Synthesized film clapperboard "CLACK". Web Audio only: no files, no network.
//
//   import { clack, unlock } from './clap-sound.js';
//   clack();      // one snap, call inside a user gesture
//   clack(0.6);   // softer snap
//   unlock();     // optional, warm the AudioContext on first interaction

let ctx = null;
let bus = null;        // every voice lands here, dry
let verbSend = null;   // small room tail send
let noiseBuf = null;   // cached white noise, shared by all layers
const voices = [];     // live claps, oldest first
const MAX_VOICES = 4;  // cap on tracked voices while mashing

// Build the context and the shared output chain once.
function getCtx() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();

  // Compressor catches fast repeats before they clip.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 6;
  comp.ratio.value = 8;
  comp.attack.value = 0.001;
  comp.release.value = 0.08;

  // Master sits around -6 dBFS at peak.
  const master = ctx.createGain();
  master.gain.value = 0.55;
  comp.connect(master);
  master.connect(ctx.destination);

  bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(comp);

  // Tiny room: a 160 ms decaying noise impulse, darkened, kept very low.
  const verb = ctx.createConvolver();
  verb.buffer = makeRoomImpulse(ctx, 0.16);
  const verbTone = ctx.createBiquadFilter();
  verbTone.type = 'lowpass';
  verbTone.frequency.value = 3500;
  const verbGain = ctx.createGain();
  verbGain.gain.value = 0.35;
  verbSend = ctx.createGain();
  verbSend.gain.value = 1;
  verbSend.connect(verb);
  verb.connect(verbTone);
  verbTone.connect(verbGain);
  verbGain.connect(comp);

  noiseBuf = makeNoise(ctx, 0.5);
  return ctx;
}

function makeNoise(c, seconds) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeRoomImpulse(c, seconds) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Short pre-delay gap, then a fast exponential fall.
      const env = i < c.sampleRate * 0.006 ? 0 : Math.pow(1 - t, 3) * Math.exp(-t * 4);
      d[i] = (Math.random() * 2 - 1) * env;
    }
  }
  return buf;
}

// Random factor around 1, e.g. jitter(0.05) gives 0.95..1.05.
function jitter(amount) {
  return 1 + (Math.random() * 2 - 1) * amount;
}

// Percussive envelope on a gain param: instant hit, exponential fall.
function hit(param, t, peak, decay, attack = 0.0008) {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// Play one noise layer through a filter chain into dest.
function noiseLayer(t, dest, filters, peak, decay, nodes) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  // Random start point so no two cracks share the same grain.
  const offset = Math.random() * (noiseBuf.duration - 0.2);
  let node = src;
  for (const f of filters) { node.connect(f); node = f; nodes.push(f); }
  const g = ctx.createGain();
  hit(g.gain, t, peak, decay);
  node.connect(g);
  g.connect(dest);
  src.start(t, offset, decay + 0.03);
  nodes.push(src, g);
  return src;
}

function biquad(type, freq, q) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (q !== undefined) f.Q.value = q;
  return f;
}

// Fade a voice out fast and let its sources end; used when too many pile up.
function choke(v) {
  try {
    const now = ctx.currentTime;
    v.out.gain.cancelScheduledValues(now);
    v.out.gain.setValueAtTime(Math.max(v.out.gain.value, 0.0001), now);
    v.out.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
  } catch (e) { /* ignore */ }
}

function cleanup(v) {
  const i = voices.indexOf(v);
  if (i !== -1) voices.splice(i, 1);
  for (const n of v.nodes) { try { n.disconnect(); } catch (e) { /* ignore */ } }
  try { v.out.disconnect(); } catch (e) { /* ignore */ }
}

export function unlock() {
  try {
    const c = getCtx();
    if (c && c.state === 'suspended') {
      const p = c.resume();
      if (p && p.catch) p.catch(() => {});
    }
  } catch (e) { /* no audio, no problem */ }
}

export function clack(strength = 1) {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      const p = c.resume();
      if (p && p.catch) p.catch(() => {});
    }

    const s = Math.max(0, Math.min(1.5, Number(strength) || 0));
    if (s === 0) return;

    // A new snap replaces the last one, like real sticks: fade any still
    // ringing claps fast so mashing never stacks up into distortion.
    for (const v of voices) choke(v);
    while (voices.length >= MAX_VOICES) voices.shift();

    const t = c.currentTime + 0.002;
    const pitch = jitter(0.05);
    const level = s * jitter(0.1);
    const nodes = [];

    // Per clap output, feeds the dry bus and the room send.
    const out = c.createGain();
    out.gain.value = level;
    out.connect(bus);
    const send = c.createGain();
    send.gain.value = 0.5;
    out.connect(send);
    send.connect(verbSend);
    nodes.push(send);

    // 1. Crack: bright, very short noise snap where the sticks meet.
    // A peaking boost near 5.5 kHz gives the crack its bite.
    const bite = biquad('peaking', 5500 * pitch, 1.2);
    bite.gain.value = 6;
    noiseLayer(t, out, [biquad('highpass', 3200 * pitch, 0.7), bite], 0.8, 0.018, nodes);

    // 2. Body: the hardwood slap, mid band noise with a quick fall.
    noiseLayer(t, out,
      [biquad('bandpass', 1550 * pitch, 1.4), biquad('lowpass', 4200, 0.5)],
      1.3, 0.075 * jitter(0.1), nodes);

    // 3. Tok: two detuned woody partials ringing for a moment.
    const partials = [
      { f: 820, type: 'triangle', g: 0.32, d: 0.055 },
      { f: 1090, type: 'sine', g: 0.2, d: 0.04 },
    ];
    for (const p of partials) {
      const o = c.createOscillator();
      o.type = p.type;
      o.frequency.setValueAtTime(p.f * pitch * jitter(0.015), t);
      const g = c.createGain();
      hit(g.gain, t, p.g, p.d);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + p.d + 0.03);
      nodes.push(o, g);
    }

    // 4. Thump: a soft low knock from the slate frame, pitch dropping.
    const th = c.createOscillator();
    th.type = 'sine';
    th.frequency.setValueAtTime(160 * pitch, t);
    th.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.08);
    const thg = c.createGain();
    hit(thg.gain, t, 0.4, 0.085, 0.002);
    th.connect(thg);
    thg.connect(out);
    th.start(t);
    th.stop(t + 0.12);
    nodes.push(th, thg);

    // The thump is the longest source; when it ends, tear the voice down.
    // Give the room tail a little extra time before disconnecting.
    const v = { out, nodes };
    voices.push(v);
    th.onended = () => { setTimeout(() => cleanup(v), 220); };
  } catch (e) { /* never throw from a click handler */ }
}
