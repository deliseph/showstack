/**
 * Static page generation.
 *
 * The search app at / is good for someone who already knows showstack exists.
 * It is useless for the person typing "what port does sACN use" into Google at
 * 1am, because a single-page app gives a crawler one page and one title.
 *
 * So every entry also gets its own static HTML page with the answer in the
 * server-rendered body, a real <title>, a real meta description, and JSON-LD.
 * Plus a page per port number, because "port 5568" and "udp 6454" are what
 * people actually type.
 *
 * This is the acquisition engine. The search app is the retention engine.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PAIRS, comparisonPage, comparisonIndex } from './compare.mjs'
import { interopPage } from './interop.mjs'
import { toolsPage } from './tools.mjs'
import { networkPage } from './network.mjs'
import { rfPage } from './rf.mjs'
import { signalsPage } from './signals.mjs'
import { signalsDataPage } from './signals-data.mjs'
import { signalsMediaPage } from './signals-media.mjs'
import { signalsDisplayPage } from './signals-display.mjs'
import { learnPage } from './learn.mjs'
import { learnDmxPage } from './learn-dmx.mjs'
import { learnNetworkPage } from './learn-network.mjs'
import { learnWirelessPage } from './learn-wireless.mjs'
import { learnSoundPage } from './learn-sound.mjs'
import { learnLightPage } from './learn-light.mjs'
import { learnSoftwarePage } from './learn-software.mjs'
import { learnConnectivityPage } from './learn-connectivity.mjs'
import { learnSystemsPage } from './learn-systems.mjs'
import { learnAerialPage } from './learn-aerial.mjs'
import { learnCodePage } from './learn-code.mjs'
import { learnEnginesPage } from './learn-engines.mjs'
import { learnDrawingsPage } from './learn-drawings.mjs'
import { learnPerceptionPage } from './learn-perception.mjs'
import { learnNeuroPage } from './learn-neuro.mjs'
import { learnCommsPage } from './learn-comms.mjs'
import { learnConnectorsPage } from './learn-connectors.mjs'
import { learnTransducersPage } from './learn-transducers.mjs'
import { learnBitsPage } from './learn-bits.mjs'
import { learnEncodingPage } from './learn-encoding.mjs'
import { learnReadingPage } from './learn-reading.mjs'
import { learnAiPage } from './learn-ai.mjs'
import { learnDevicesPage } from './learn-devices.mjs'
import { learnEmotionPage } from './learn-emotion.mjs'
import { learnPresencePage } from './learn-presence.mjs'
import { learnExperiencePage } from './learn-experience.mjs'
import { learnRiggingPage } from './learn-rigging.mjs'
import { learnColourPage } from './learn-colour.mjs'
import { learnSensesPage } from './learn-senses.mjs'
import { buildPage } from './build-page.mjs'
import { homePage } from './home.mjs'
import { LEARN_TOPICS, LEARN_GROUPS, LEARN_CAPSTONE } from './learn-kit.mjs'
import { buildBacklinks, learnFor, learnBox, learnFooter, RELATED_CSS } from './related.mjs'
import { SUPER_DOMAINS, superDomain } from './graph.mjs'

const SITE = process.env.SHOWSTACK_SITE ?? 'https://showstack.dev'
const REPO = process.env.SHOWSTACK_REPO ?? 'deliseph/showstack'
const GH = `https://github.com/${REPO}`

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/**
 * Serialise JSON for embedding inside a <script> block.
 *
 * JSON.stringify does not escape `<`, so a contributed field containing the
 * literal text `</script>` would close the block early and turn everything
 * after it into live markup. This project merges YAML written by strangers,
 * so that is a real path, not a theoretical one.
 *
 * < and friends are ordinary JSON string escapes: the parsed value is
 * byte-identical, and no sequence of characters in the data can terminate the
 * enclosing tag. This is the standard mitigation and it costs nothing.
 */
const jsonForScript = (obj) =>
  JSON.stringify(obj).replace(/[<>&\u2028\u2029]/g, (c) => ({
    '<': '\\u003c', '>': '\\u003e', '&': '\\u0026',
    '\u2028': '\\u2028', '\u2029': '\\u2029',
  }[c]))

const trunc = (s, n = 155) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t }

/**
 * Header, nav rail and the two header controls. Exported for the same reason
 * as TOKENS: site/search.html used to carry its own copy, which is how the two
 * headers drifted to different heights and different touch-target sizes.
 */
export const SHELL_CSS = `
/* The header is sticky, so every pixel it occupies is a pixel of the page the
   reader never gets back. On a 390px phone the old one wrapped the nav onto
   three or four rows and ate half the viewport. Now it is at most two rows:
   an identity bar, and a nav that scrolls sideways instead of wrapping. */
header{border-bottom:1px solid var(--line);padding:6px 0;position:sticky;top:0;z-index:30;
background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
header::after{content:"";position:absolute;inset:auto 0 -1px 0;height:1px;
background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 35%,transparent),transparent)}
header .wrap{max-width:1120px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.hbar{display:flex;align-items:center;gap:10px;flex:0 0 auto}
header h1{font-family:var(--mono);font-size:17px;margin:0;letter-spacing:-.3px;white-space:nowrap}
header h1 a{display:inline-flex;align-items:center;min-height:44px}
header h1 span{color:var(--accent)}
header nav{margin-left:auto;display:flex;gap:3px;align-items:center;min-width:0;justify-content:flex-start}
header nav a{color:var(--dim);font-family:var(--mono);font-size:12.5px;padding:0 13px;border-radius:999px;
min-height:44px;min-width:44px;justify-content:center;
border:1px solid transparent;display:inline-flex;align-items:center;line-height:1;white-space:nowrap;flex:0 0 auto;
transition:color .15s,background .15s,border-color .15s}
header nav a:hover{color:var(--ink);background:var(--panel2);border-color:var(--line);text-decoration:none}
header nav a.active{color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);
border-color:color-mix(in srgb,var(--accent) 38%,transparent)}
header nav .ncl{font-family:var(--mono);font-size:9px;letter-spacing:.9px;text-transform:uppercase;
color:var(--ink-faint);padding:0 6px 0 0;white-space:nowrap;flex:0 0 auto;align-self:center}
header nav .navgroup{display:flex;gap:3px;align-items:center;padding-left:8px;margin-left:5px;
border-left:1px solid var(--line);flex:0 0 auto}
.ghlink{font-family:var(--mono);font-size:12px;color:var(--dim);border:1px solid var(--rule-strong);
padding:0 12px;border-radius:999px;white-space:nowrap;display:inline-flex;align-items:center;min-height:44px}
.ghlink:hover{color:var(--ink);border-color:var(--dim);text-decoration:none}
.themebtn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
border-radius:999px;border:1px solid var(--rule-strong);background:var(--panel2);color:var(--dim);cursor:pointer;padding:0;
flex:0 0 auto;transition:color .15s,border-color .15s,transform .15s}
.themebtn:hover{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent);transform:translateY(-1px)}
.themebtn svg{display:block}
/* Sideways-scrolling rail. Two rules matter on a phone: nothing may wrap, and
   the reader has to be able to see that there is more off the right edge, so
   the rail is masked rather than cut. */
.rail{overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;scrollbar-width:none;-webkit-overflow-scrolling:touch;
overscroll-behavior-x:contain;scroll-snap-type:x proximity}
/* Above the phone breakpoint there is room for the whole nav, so let it wrap
   rather than scroll - a clipped last item reads as a broken layout on a
   desktop, where nothing suggests the rail is scrollable. */
@media(min-width:861px){
  header nav.rail{overflow:visible;flex-wrap:wrap;row-gap:4px;-webkit-mask-image:none;mask-image:none}
}
.rail::-webkit-scrollbar{display:none}
.rail>*{scroll-snap-align:start}
@media(max-width:1100px){
  header nav{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);
    mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}
}
@media(max-width:860px){
  header{padding:4px 0}
  header .wrap{gap:6px}
  .hbar{width:100%}
  .hbar .themebtn{margin-left:auto}
  header nav{margin-left:0;width:100%;padding-bottom:2px;
    -webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent);
    mask-image:linear-gradient(90deg,#000 calc(100% - 26px),transparent)}
  header nav a{padding:0 11px}
  header nav .navgroup{padding-left:6px;margin-left:3px}
}
`

/**
 * The token layer, exported so site/search.html can inline the same source
 * instead of keeping its own drifting copy of the palette.
 */
export const TOKENS = `
/* ---- TOKEN LAYER -------------------------------------------------------
   Semantic tokens are the source of truth. The older presentational names
   (--bg, --panel, --line, --accent...) are kept as aliases so the 40 page
   modules that use them keep working; new work should use the semantic name.
   Every colour pair below has a measured contrast ratio in the comment.
   The full rationale lives in design-system/showstack/MASTER.md.

   Light is the base palette and dark is the override, so a browser that
   expresses no preference lands on light - the real usage context is a phone
   in a loading dock in daylight. The OS preference is still honoured, and an
   explicit choice via [data-theme] beats the OS in both directions. */
:root{
color-scheme:light;
/* surfaces */
--surface:#f6f7f9;--surface-raised:#ffffff;--surface-sunken:#edf0f4;
/* text - every one of these measured >= 4.5:1 on all three surfaces */
--ink:#141922;          /* 16.44 / 17.62 / 15.41 */
--ink-muted:#46536a;    /*  7.24 /  7.76 /  6.79 */
--ink-faint:#5f6b80;    /*  5.02 /  5.38 /  4.71 - labels only, never body */
/* boundaries. --rule is decorative and deliberately quiet; --rule-strong is
   for anything whose boundary a person needs to see to operate it, and is the
   only one of the two that clears SC 1.4.11's 3:1. */
--rule:#dbe1ea;         /*  1.23 - decorative only */
--rule-strong:#7f8288;  /*  3.59 /  3.85 /  3.37 - controls */
/* the one accent */
--signal:#0b7561;       /*  5.25 /  5.63 /  4.92 */
--signal-ink:#ffffff;   /*  5.63 on --signal */
--focus:#0b7561;        /*  5.25 - clears 3:1 on every surface it lands on */
/* reserved. Never decorative: green means "this fact is sourced", amber means
   a real caution, red means a real failure. */
--verified:#3a7a22;     /*  4.91 */
--warn:#b6462e;         /*  5.02 */
--fail:#b6462e;
/* domain hues, used to identify a domain and nothing else */
--dom-visual:#8f5a10;--dom-audio:#116e93;--dom-network:#22579e;
--dom-safety:#b6462e;--dom-control:#7440ab;
--glow:transparent;
--shadow:0 1px 2px rgba(16,24,40,.06),0 4px 16px rgba(16,24,40,.07);
/* legacy aliases - do not use in new code */
--bg:var(--surface);--panel:var(--surface-raised);--panel2:var(--surface-sunken);
--line:var(--rule);--dim:var(--ink-muted);--dimmer:var(--ink-faint);
--accent:var(--signal);--accent2:#8f6110;--ok:var(--verified);
}
/* --- type scale, 1.2 minor third off a 16px base ------------------------ */
:root{
--text-xs:11px;--text-sm:13px;--text-base:16px;--text-md:17px;--text-lg:20px;
--text-xl:24px;--text-2xl:29px;--text-3xl:35px;--text-display:clamp(30px,5.2vw,50px);
--leading-tight:1.25;--leading-normal:1.5;--leading-prose:1.65;
--measure:68ch;
/* --- 4px spacing scale --- */
--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;
--space-6:24px;--space-8:32px;--space-10:40px;--space-12:48px;--space-16:64px;
/* --- radius --- */
--r-sm:8px;--r-md:12px;--r-lg:16px;--r-pill:999px;
/* --- motion. Standard tier: nothing choreographed. --- */
--dur-fast:150ms;--dur-base:250ms;--dur-slow:400ms;
--ease-out:cubic-bezier(.22,.61,.36,1);--ease-in-out:cubic-bezier(.65,.05,.36,1);
/* --- families --- */
--mono:"JetBrains Mono",ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
--sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
--serif:"Newsreader",Georgia,"Times New Roman",serif}

/* Dark. Same token names, re-measured values. Not an inverted light palette:
   the accent had to be lightened to hold its ratio on a dark ground, and the
   reserved colours were re-picked rather than flipped. */
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){
color-scheme:dark;
--surface:#0b0e14;--surface-raised:#121722;--surface-sunken:#19212f;
--ink:#e9edf4;          /* 16.45 / 15.27 / 13.76 */
--ink-muted:#9aa8bc;    /*  8.00 /  7.43 /  6.69 */
--ink-faint:#7a889f;    /*  5.38 /  4.99 /  4.50 */
--rule:#242f42;         /*  1.44 - decorative only */
--rule-strong:#556e9b;  /*  3.76 /  3.49 /  3.15 - controls */
--signal:#5fd4bb;       /* 10.69 /  9.92 /  8.94 */
--signal-ink:#0b0e14;   /* 10.69 on --signal */
--focus:#5fd4bb;
--verified:#8cc96a;     /*  9.82 */
--warn:#ec7f66;         /*  7.17 */
--fail:#ec7f66;
--dom-visual:#ffb454;--dom-audio:#4fd1ff;--dom-network:#6ea8fe;
--dom-safety:#ec7f66;--dom-control:#b98cf2;
--glow:rgba(95,212,187,.06);
--shadow:0 1px 2px rgba(0,0,0,.35),0 8px 24px rgba(0,0,0,.28);
--accent2:#f0b866}}
:root[data-theme="dark"]{
color-scheme:dark;
--surface:#0b0e14;--surface-raised:#121722;--surface-sunken:#19212f;
--ink:#e9edf4;--ink-muted:#9aa8bc;--ink-faint:#7a889f;
--rule:#242f42;--rule-strong:#556e9b;
--signal:#5fd4bb;--signal-ink:#0b0e14;--focus:#5fd4bb;
--verified:#8cc96a;--warn:#ec7f66;--fail:#ec7f66;
--dom-visual:#ffb454;--dom-audio:#4fd1ff;--dom-network:#6ea8fe;
--dom-safety:#ec7f66;--dom-control:#b98cf2;
--glow:rgba(95,212,187,.06);
--shadow:0 1px 2px rgba(0,0,0,.35),0 8px 24px rgba(0,0,0,.28);
--accent2:#f0b866}
/* Self-hosted, same origin. Two variable files per family cover 400-700, and
   unicode-range means latin-ext only downloads on a page that needs it. The
   CDN version of this was render-blocking and third-party: when that request
   hung behind a venue firewall, mobile LCP went from 316ms to 12812ms. */
@font-face{font-family:"IBM Plex Sans";font-style:normal;font-weight:400 700;font-display:swap;
src:url(/assets/fonts/plex-sans-latin.woff2) format("woff2");
unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"IBM Plex Sans";font-style:normal;font-weight:400 700;font-display:swap;
src:url(/assets/fonts/plex-sans-latin-ext.woff2) format("woff2");
unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400 700;font-display:swap;
src:url(/assets/fonts/jetbrains-mono-latin.woff2) format("woff2");
unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400 700;font-display:swap;
src:url(/assets/fonts/jetbrains-mono-latin-ext.woff2) format("woff2");
unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
`

const CSS = RELATED_CSS + TOKENS + `
*{box-sizing:border-box}html,body{margin:0;padding:0}
/* SC 1.4.11: a control's boundary has to be visible. --rule stays decorative
   at 1.23:1; anything a person operates gets --rule-strong at >= 3:1. */
input,select,textarea,button,summary,.tab,[role="tab"]{border-color:var(--rule-strong)}
input,select,textarea{background:var(--surface-raised);color:var(--ink);
border:1px solid var(--rule-strong);border-radius:var(--r-sm);font-family:var(--mono)}
/* SC 2.5.8: 44px minimum on anything you tap. */
input,select,textarea,button{min-height:44px}
input[type="checkbox"],input[type="radio"]{min-height:0;width:20px;height:20px;
flex:0 0 auto;accent-color:var(--signal);cursor:pointer}
/* A checkbox is tapped on its label, so the label carries the target size. */
label:has(> input[type="checkbox"]),label:has(> input[type="radio"]){min-height:44px;
display:inline-flex;align-items:center;gap:10px;cursor:pointer}

body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.6;
-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
::selection{background:color-mix(in srgb,var(--accent) 30%,transparent)}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:4px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:800px;margin:0 auto;padding:0 20px}
${SHELL_CSS}
/* A keyboard user should not have to tab through 17 nav items to reach the
   page. Hidden until focused, then it sits over the sticky header. */
.skip{position:absolute;left:-9999px;top:0;z-index:60;background:var(--signal);color:var(--signal-ink);
font-family:var(--mono);font-size:13px;padding:12px 18px;border-radius:0 0 var(--r-sm) 0;
text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.skip:focus{left:0}
/* "Free, no account, no tracking" was one line of small text at the bottom of
   two pages. It is a real reason people trust this and it now sits under the
   header on every page - one line, always there, not a banner and not a badge. */
.trust{border-bottom:1px solid var(--line);background:var(--surface-sunken)}
.trust .wrap{max-width:1120px;display:flex;align-items:center;gap:7px;flex-wrap:nowrap;
padding-top:6px;padding-bottom:6px;font-family:var(--mono);font-size:11px;color:var(--ink-faint);
letter-spacing:.2px;white-space:nowrap;overflow-x:auto;scrollbar-width:none;
-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 20px),transparent);
mask-image:linear-gradient(90deg,#000 calc(100% - 20px),transparent)}
.trust .wrap::-webkit-scrollbar{display:none}
.trust .wrap > *{flex:0 0 auto}
.trust b{color:var(--ink-muted);font-weight:500}
.trust svg{flex:0 0 auto;color:var(--verified)}
.trust a{color:var(--ink-muted);text-decoration:underline;text-underline-offset:2px}
.trust a:hover{color:var(--signal)}
@media(max-width:520px){.trust .wrap{font-size:10.5px;gap:6px;
-webkit-mask-image:none;mask-image:none}}
main{padding:36px 0 72px;background:
radial-gradient(600px 220px at 50% -60px,var(--glow),transparent)}
h2{font-size:28px;margin:0 0 6px;line-height:1.25;letter-spacing:-.4px}
.zh{color:var(--dim);font-weight:400}
.lede{font-size:17px;color:var(--dim);margin:0 0 18px}
.meta{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:26px}
.pill{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.4px;border:1px solid var(--line);
color:var(--dimmer);padding:3.5px 9px;border-radius:999px;background:var(--panel2)}
.pill.verified{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 40%,transparent)}
.pill.unverified{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 40%,transparent)}
.pill.port{color:var(--accent2);border-color:color-mix(in srgb,var(--accent2) 40%,transparent)}
.pill.safety{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,transparent)}
.pill.dom-visual{color:var(--dom-visual);border-color:color-mix(in srgb,var(--dom-visual) 40%,transparent)}
.pill.dom-audio{color:var(--dom-audio);border-color:color-mix(in srgb,var(--dom-audio) 40%,transparent)}
.pill.dom-network{color:var(--dom-network);border-color:color-mix(in srgb,var(--dom-network) 40%,transparent)}
.pill.dom-safety{color:var(--dom-safety);border-color:color-mix(in srgb,var(--dom-safety) 45%,transparent)}
.pill.dom-control{color:var(--dom-control);border-color:color-mix(in srgb,var(--dom-control) 40%,transparent)}
h3{font-family:var(--mono);font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:var(--dimmer);
margin:32px 0 10px;font-weight:600}
ul{padding-left:20px;margin:0}li{margin-bottom:8px;color:var(--dim)}li strong{color:var(--ink);font-weight:600}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--dimmer);font-weight:500;font-family:var(--mono);font-size:12px;
padding:6px 10px 6px 0;border-bottom:1px solid var(--line)}
td{padding:8px 10px 8px 0;border-bottom:1px solid var(--line);color:var(--dim);vertical-align:top}
td strong{color:var(--ink);font-weight:600}
/* A four-column table does not fit a 390px screen and never will. Let it
   scroll inside its own box rather than widening the whole document, which
   is what makes a page feel broken on a phone. */
@media(max-width:640px){table{display:block;max-width:100%;overflow-x:auto}}
/* A long "what speaks this" list is folded away by default so it stops
   burying the sources and the rest of the page under 80 table rows. */
details.speaklist{border:1px solid var(--line);border-radius:var(--r-md);background:var(--panel);margin:0 0 10px}
details.speaklist > summary{cursor:pointer;list-style:none;padding:13px 16px;display:flex;align-items:center;
gap:10px;font-size:14.5px;color:var(--dim);border-radius:var(--r-md)}
details.speaklist > summary::-webkit-details-marker{display:none}
details.speaklist > summary:hover{color:var(--ink)}
details.speaklist[open] > summary{border-bottom:1px solid var(--line);border-radius:var(--r-md) var(--r-md) 0 0}
.speakcount{font-family:var(--mono);font-size:15px;color:var(--accent);font-weight:600}
.speakhint{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--dimmer);
border:1px solid var(--line);border-radius:999px;padding:3px 10px}
details.speaklist[open] .speakhint::after{content:"";}
details.speaklist[open] .speakhint{color:var(--accent)}
details.speaklist > table{margin:0}
details.speaklist td:first-child,details.speaklist th:first-child{padding-left:16px}
.ports{background:var(--panel);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 18px;margin:0 0 10px;
box-shadow:var(--shadow);transition:border-color .2s}
.ports:hover{border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}
.ports .big{font-family:var(--mono);font-size:24px;color:var(--accent2);display:block;margin-bottom:2px}
.gotcha{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent2);padding:12px 16px;
margin-bottom:10px;border-radius:var(--r-sm);color:var(--dim);font-size:15px}
.cta{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 7%,var(--panel2)),var(--panel2));
border:1px solid var(--line);border-radius:var(--r-md);padding:18px 20px;margin:36px 0 0}
.cta strong{display:block;margin-bottom:5px}
.cta p{margin:0;color:var(--dim);font-size:14.5px}
footer{border-top:1px solid var(--line);padding:24px 0 60px;color:var(--dimmer);font-size:13px}
footer a{color:var(--dim)}
code{font-family:var(--mono);font-size:13.5px;background:var(--panel2);border:1px solid var(--line);
padding:1.5px 6px;border-radius:6px}
.crumb{font-size:13px;color:var(--dimmer);margin-bottom:14px;font-family:var(--mono)}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation:none!important;scroll-behavior:auto!important}}
`


/**
 * The three-state theme switcher: auto (follow the OS), light, dark.
 * Auto removes the data-theme attribute so the prefers-color-scheme media
 * query decides; an explicit choice pins the attribute and persists in
 * localStorage, read again by the tiny pre-paint script in <head> so pages
 * never flash the wrong theme. Icons are inline SVG, not emoji.
 */
const THEME_JS = `
(function(){
  var KEY='ss-theme', root=document.documentElement;
  var ICONS={
    auto:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/></svg>',
    light:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.9 1.9M17.1 17.1 19 19M19 5l-1.9 1.9M6.9 17.1 5 19"/></svg>',
    dark:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.6 13.2A8.6 8.6 0 1 1 10.8 3.4a7 7 0 1 0 9.8 9.8z"/></svg>'
  };
  function mode(){try{var t=localStorage.getItem(KEY);return t==='light'||t==='dark'?t:'auto'}catch(e){return 'auto'}}
  function apply(m){
    if(m==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',m)}
    try{m==='auto'?localStorage.removeItem(KEY):localStorage.setItem(KEY,m)}catch(e){}
    var btn=document.getElementById('themebtn');
    if(btn){btn.innerHTML=ICONS[m];btn.setAttribute('aria-label','Theme: '+m+' (click to change)');btn.title='Theme: '+m}
  }
  apply(mode());
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.getElementById('themebtn');
    if(btn)btn.addEventListener('click',function(){var o=['auto','light','dark'];apply(o[(o.indexOf(mode())+1)%3])});
    apply(mode());
    /* The nav is a sideways rail on a phone, so the page you are actually on
       can start off-screen to the right. Scroll the rail itself rather than
       calling scrollIntoView on the link: scrollIntoView sets the sequential
       focus navigation starting point, which made the first Tab land in the
       middle of the nav and skip the skip link entirely. */
    var nav=document.querySelector('header nav.rail');
    var cur=nav&&nav.querySelector('a.active');
    if(nav&&cur&&nav.scrollWidth>nav.clientWidth+1){
      nav.scrollLeft=Math.max(0,cur.offsetLeft-(nav.clientWidth-cur.offsetWidth)/2);
    }
  });
})();
`

/**
 * The site nav, with the current section highlighted, grouped so the visual
 * spacing matches what the links actually are: the primary search, then the
 * field-calculator utilities, then the whole-index views. Active state is
 * derived from the canonical URL so no page has to declare it and none can
 * forget to.
 */
export function navBar(canonical) {
  const path = String(canonical ?? '').replace(/^https?:\/\/[^/]+/, '')
  const link = (href, label) => {
    const active = href === '/' ? path === '/' || path === '' : path.startsWith(href)
    return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ''}>${label}</a>`
  }
  const home = link('/', 'Home')
  const main = ['/learn/', '/search/', '/tools/', '/build/']
    .map((h, i) => link(h, ['Learn', 'Search', 'Tools', 'Build'][i])).join('')
  const index = ['/protocols/', '/standards/', '/software/', '/hardware/', '/glossary/']
    .map((h, i) => link(h, ['Protocols', 'Standards', 'Software', 'Hardware', 'Glossary'][i])).join('')
  const views = ['/interop/', '/compare/', '/ports/', '/signals/', '/network/', '/rf/']
    .map((h, i) => link(h, ['Interop', 'Compare', 'Ports', 'Signals', 'Network', 'RF'][i])).join('')
  // The three clusters carry visible labels. Sixteen undifferentiated pills
  // ask the reader to reconstruct the grouping from a thin border; naming the
  // runs is what turns the rail into a model of the site. The labels scroll
  // with the rail, so on a phone you can always see which cluster you are in.
  return `<nav class="rail" aria-label="Site">${home}` +
    `<span class="navgroup"><span class="ncl">Learn</span>${main}</span>` +
    `<span class="navgroup"><span class="ncl">Look up</span>${index}</span>` +
    `<span class="navgroup"><span class="ncl">Work it out</span>${views}</span></nav>`
}

function shell({ title, description, canonical, jsonld, body, h1extra = '', extraStyle = '', extraScript = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="preload" href="/assets/fonts/plex-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>${THEME_JS}</script>
${jsonld ? `<script type="application/ld+json">${jsonForScript(jsonld)}</script>` : ''}
<style>${CSS}${extraStyle}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header><div class="wrap">
  <div class="hbar">
    <h1><a href="/" style="color:inherit">show<span>stack</span></a></h1>
    <a class="ghlink" href="${GH}">GitHub</a>
    <button class="themebtn" id="themebtn" type="button" aria-label="Switch theme"></button>
  </div>
  ${navBar(canonical)}
  ${h1extra}
</div></header>
<div class="trust"><div class="wrap">
  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  <b>Free forever</b><span>&middot;</span><span>no account, no tracking, no third-party requests</span>
  <span>&middot;</span><a href="/build/">open data, free API</a>
</div></div>
<main id="main" tabindex="-1"><div class="wrap">${body}</div></main>
${extraScript ? `<script>${extraScript}</script>` : ''}
<footer><div class="wrap">
  Data <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, code MIT.
  Free JSON API at <a href="/api/v1/index.json">/api/v1/</a>, no key.
  <a href="${GH}">Source and corrections</a>.
  <br>Created by <a href="https://www.linkedin.com/in/mi2dev/" rel="noopener">Migu Mianizt Leung</a> —
  <a href="https://medium.com/@mi2dev" rel="noopener">Medium</a> ·
  <a href="https://instagram.com/mi2.dev" rel="noopener">Instagram</a>
</div></footer>
</body>
</html>`
}

/**
 * Populated at the top of buildPages, before any entry page is rendered, by
 * rendering the explainers first and reading the links out of them.
 */
let BACKLINKS = new Map()

function relatedLearn(kind, entry) {
  return learnBox(esc, learnFor(BACKLINKS, kind, entry))
}

function contributeBox(collection, id, gap) {
  // esc() has to run per field name, not over the joined string - joining
  // first meant the <code> separators were escaped too and the reader saw
  // literal markup in the middle of the sentence.
  const missing = gap
    ? `<p>Known gaps on this entry: ${gap.missing.map((f) => `<code>${esc(f)}</code>`).join(', ')}. If you can source one of them, that is a ten minute pull request.</p>`
    : ''
  return `<div class="cta">
    <strong>Something wrong, or missing?</strong>
    ${missing || '<p>Every entry here is maintained by people who run shows.</p>'}
    <p><a href="${GH}/edit/main/data/${collection}/${esc(id)}.yaml">Edit this entry on GitHub</a> — one file, editable in your browser, and your handle goes on it permanently.</p>
  </div>`
}

function sourcesBlock(sources = []) {
  if (!sources.length) return ''
  return `<h3>Sources</h3><ul>` + sources.map((s) =>
    `<li><a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.title)}</a>${s.publisher ? ` — ${esc(s.publisher)}` : ''}${s.primary ? ' <span class="pill verified">primary</span>' : ''}</li>`
  ).join('') + `</ul>`
}

// --------------------------------------------------------------- protocols
function protocolPage(p, gap) {
  const ports = (p.default_ports ?? [])
  const portStr = ports.map((x) => `${x.transport.toUpperCase()} ${x.number}`).join(', ')
  const title = `${p.name}${portStr ? ` — ${portStr}` : ''} | showstack`
  const description = trunc(`${portStr ? `${p.name} runs on ${portStr}. ` : ''}${p.summary}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / protocols / ${esc(p.id)}</div>`
  b += `<h2>${esc(p.name)}</h2>`
  if (p.aka?.length) b += `<p class="lede">Also called ${p.aka.map(esc).join(', ')}.</p>`
  b += `<p class="lede">${esc(p.summary)}</p>`

  b += `<div class="meta">`
  b += `<span class="pill dom-${superDomain(p.category)}">${esc(p.category)}</span>`
  if (p.openness) b += `<span class="pill">${esc(p.openness)}</span>`
  if (p.steward) b += `<span class="pill">${esc(p.steward)}</span>`
  if (p.confidence) b += `<span class="pill ${esc(p.confidence)}">${esc(p.confidence)}</span>`
  if (p.status && p.status !== 'current') b += `<span class="pill">${esc(p.status)}</span>`
  b += `</div>`

  if (ports.length) {
    b += `<h3>Ports</h3>`
    for (const x of ports) {
      b += `<div class="ports"><span class="big">${x.transport}/${x.number}</span>
        ${esc(x.role ?? '')}${x.note ? `<br><span style="color:var(--dimmer);font-size:14px">${esc(x.note)}</span>` : ''}</div>`
    }
  }
  if (p.multicast?.used) {
    b += `<h3>Multicast</h3><ul>` + (p.multicast.ranges ?? []).map((r) => `<li><code>${esc(r)}</code></li>`).join('')
      + (p.multicast.note ? `<li>${esc(p.multicast.note)}</li>` : '') + `</ul>`
  }
  if (p.universe_model) b += `<h3>Addressing</h3><p style="color:var(--dim)">${esc(p.universe_model)}</p>`

  if (p.gotchas?.length) {
    b += `<h3>What goes wrong</h3>`
    for (const g of p.gotchas) b += `<div class="gotcha">${esc(g)}</div>`
  }

  if (p.spoken_by?.length) {
    // Art-Net is spoken by 80+ entries. Rendered flat that is a wall of table
    // between the reader and everything below it, so past a dozen the list
    // collapses behind a summary and the page stays readable. Under a dozen
    // it stays open, because a disclosure you have to click to see three rows
    // is just an obstacle.
    const rows = p.spoken_by.map((s) => `<tr><td><strong>${esc(s.name)}</strong>${s.vendor ? `<br><span style="font-size:13px;color:var(--dimmer)">${esc(s.vendor)}</span>` : ''}</td>
        <td>${esc(s.direction)}${s.requires_licence ? '<br><span style="font-size:12px;color:var(--accent2)">needs licence</span>' : ''}</td>
        <td>${esc(s.note ?? '')}</td></tr>`).join('')
    const head = `<tr><th>Product</th><th>Direction</th><th>Notes</th></tr>`
    b += `<h3>What speaks ${esc(p.name)} (${p.spoken_by.length})</h3>`
    if (p.spoken_by.length <= 12) {
      b += `<table>${head}${rows}</table>`
    } else {
      const kinds = { software: 0, hardware: 0 }
      for (const s of p.spoken_by) if (s.kind in kinds) kinds[s.kind]++
      const bits = []
      if (kinds.hardware) bits.push(`${kinds.hardware} hardware`)
      if (kinds.software) bits.push(`${kinds.software} software`)
      b += `<details class="speaklist"><summary><span class="speakcount">${p.spoken_by.length}</span> products${bits.length ? ` — ${bits.join(', ')}` : ''}<span class="speakhint">show all</span></summary>
        <table>${head}${rows}</table></details>`
    }
  }

  if (p.implementations?.length) {
    b += `<h3>Open source implementations</h3><ul>` + p.implementations.map((i) =>
      `<li><a href="${esc(i.url)}" rel="noopener">${esc(i.name)}</a>${i.language ? ` — ${esc(i.language)}` : ''}${i.license ? `, ${esc(i.license)}` : ''}</li>`).join('') + `</ul>`
  }
  if (p.typical_use?.length) b += `<h3>Typical use</h3><ul>` + p.typical_use.map((u) => `<li>${esc(u)}</li>`).join('') + `</ul>`

  b += sourcesBlock(p.sources)
  b += relatedLearn('protocols', p)
  b += contributeBox('protocols', p.id, gap)

  return shell({
    title, description, canonical: `${SITE}/protocols/${p.id}/`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'TechArticle',
      headline: `${p.name}${portStr ? ` (${portStr})` : ''}`,
      description: trunc(p.summary, 300),
      url: `${SITE}/protocols/${p.id}/`,
      isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      citation: (p.sources ?? []).map((s) => s.url),
      dateModified: p.updated,
    },
    body: b,
  })
}

// ------------------------------------------------------------------- ports
// "port 5568", "what uses udp 6454" — the highest-intent queries in the whole
// domain, and nothing currently answers them with a citation.
function portPage(number, entries) {
  const title = `What runs on port ${number}? | showstack`
  const names = entries.map((e) => e.p.name).join(', ')
  const description = trunc(`Port ${number} is used by ${names} in live entertainment systems. Ports, transports and what goes wrong, with sources.`)

  let b = `<div class="crumb"><a href="/">showstack</a> / <a href="/ports/">ports</a> / ${number}</div>`
  b += `<h2>Port ${number}</h2><p class="lede">In live entertainment systems, port ${number} is used by ${esc(names)}.</p>`
  for (const { p, port } of entries) {
    b += `<div class="ports"><span class="big">${port.transport}/${port.number}</span>
      <strong><a href="/protocols/${esc(p.id)}/">${esc(p.name)}</a></strong> — ${esc(port.role ?? '')}
      <div style="margin-top:8px;color:var(--dim);font-size:15px">${esc(p.summary)}</div></div>`
  }
  b += `<h3>Check it from the command line</h3><p style="color:var(--dim)"><code>npx showstack port ${number}</code></p>`
  b += `<div class="cta"><strong>Not what you were looking for?</strong>
    <p>If you know something else uses port ${number}, <a href="${GH}/issues/new?title=${encodeURIComponent(`[gap] port ${number}`)}">tell us</a>. Adding it is one file.</p></div>`

  return shell({
    title, description, canonical: `${SITE}/ports/${number}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{
      '@type': 'Question', name: `What runs on port ${number}?`,
      acceptedAnswer: { '@type': 'Answer', text: trunc(`In live entertainment systems, port ${number} is used by ${names}.`, 300) },
    }]},
    body: b,
  })
}

// ------------------------------------------------------------------- terms
function termPage(t, gap) {
  const title = `${t.en}${t.zh_hant ? ` / ${t.zh_hant}` : ''} — theatre and live events glossary | showstack`
  const description = trunc(`${t.en}${t.zh_hant ? ` (${t.zh_hant})` : ''}: ${t.definition_en}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / glossary / ${esc(t.id)}</div>`
  b += `<h2>${esc(t.en)}${t.zh_hant ? ` <span class="zh">${esc(t.zh_hant)}</span>` : ''}</h2>`
  b += `<div class="meta"><span class="pill dom-${superDomain(t.domain)}">${esc(t.domain)}</span>${t.safety_critical ? '<span class="pill safety">safety critical</span>' : ''}</div>`
  b += `<p class="lede">${esc(t.definition_en)}</p>`
  if (t.definition_zh_hant) b += `<h3>中文</h3><p style="color:var(--dim)">${esc(t.definition_zh_hant)}</p>`
  if (t.regional_variants?.length) {
    b += `<h3>Regional usage</h3><table><tr><th>Where</th><th>Term</th><th>Note</th></tr>` +
      t.regional_variants.map((r) => `<tr><td><strong>${esc(r.region)}</strong></td><td>${esc(r.term)}</td><td>${esc(r.note ?? '')}</td></tr>`).join('') + `</table>`
  }
  if (t.false_friends?.length) {
    b += `<h3>Easy to get wrong</h3>`
    for (const f of t.false_friends) b += `<div class="gotcha">${esc(f)}</div>`
  }
  b += sourcesBlock(t.sources)
  b += relatedLearn('glossary', t)
  b += contributeBox('terms', t.id, gap)

  return shell({
    title, description, canonical: `${SITE}/glossary/${t.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'DefinedTerm',
      name: t.en, alternateName: t.zh_hant, description: trunc(t.definition_en, 300),
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'showstack glossary', url: `${SITE}/glossary/` },
      url: `${SITE}/glossary/${t.id}/` },
    body: b,
  })
}

// ------------------------------------------------- software / hardware / std
function productPage(kind, e, gap) {
  // Vendor is only worth putting in the <title> when it adds information.
  // "Notch (Notch (10bit FX Limited))" and "Lightwright (Lightwright LLC)"
  // waste the ~60 characters a search result actually shows, so drop the
  // vendor when it is just the product name plus a legal suffix. Compare on
  // the vendor's leading word, before any parenthetical trading name.
  const vendorHead = (e.vendor ?? '').split('(')[0].trim()
  const redundant =
    vendorHead.toLowerCase().startsWith(e.name.toLowerCase()) ||
    e.name.toLowerCase().startsWith(vendorHead.toLowerCase())
  const byline = e.vendor && !redundant ? ` (${vendorHead})` : ''
  const title = `${e.name}${byline} — protocols and interoperability | showstack`
  const spoken = (e.speaks ?? []).map((s) => s.protocol).join(', ')
  const description = trunc(`${e.name}${spoken ? ` speaks ${spoken}. ` : ' '}${e.summary}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / ${kind} / ${esc(e.id)}</div>`
  b += `<h2>${esc(e.name)}</h2><p class="lede">${esc(e.summary)}</p>`
  b += `<div class="meta"><span class="pill dom-${superDomain(e.category)}">${esc(e.category)}</span>`
  if (e.vendor) b += `<span class="pill">${esc(e.vendor)}</span>`
  if (e.license) b += `<span class="pill">${esc(e.license)}</span>`
  if (e.price_model) b += `<span class="pill">${esc(e.price_model)}</span>`
  for (const pf of e.platforms ?? []) b += `<span class="pill">${esc(pf)}</span>`
  if (e.confidence) b += `<span class="pill ${esc(e.confidence)}">${esc(e.confidence)}</span>`
  if (e.status && e.status !== 'current') b += `<span class="pill">${esc(e.status)}</span>`
  b += `</div>`

  if (e.speaks?.length) {
    b += `<h3>Protocols it speaks</h3><table><tr><th>Protocol</th><th>Direction</th><th>Notes</th></tr>` +
      e.speaks.map((s) => `<tr><td><strong><a href="/protocols/${esc(s.protocol)}/">${esc(s.protocol)}</a></strong></td>
        <td>${esc(s.direction)}${s.requires_licence ? '<br><span style="font-size:12px;color:var(--accent2)">needs licence</span>' : ''}</td>
        <td>${esc(s.note ?? '')}</td></tr>`).join('') + `</table>`
  }
  if (e.physical_ports?.length) b += `<h3>Connectors</h3><ul>` + e.physical_ports.map((x) => `<li>${esc(x)}</li>`).join('') + `</ul>`
  if (e.gotchas?.length) { b += `<h3>What to watch for</h3>`; for (const g of e.gotchas) b += `<div class="gotcha">${esc(g)}</div>` }
  if (e.typical_use?.length) b += `<h3>Typical use</h3><ul>` + e.typical_use.map((u) => `<li>${esc(u)}</li>`).join('') + `</ul>`
  b += sourcesBlock(e.sources)
  b += relatedLearn(kind, e)
  b += contributeBox(kind, e.id, gap)

  return shell({ title, description, canonical: `${SITE}/${kind}/${e.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': kind === 'software' ? 'SoftwareApplication' : 'Product',
      name: e.name, description: trunc(e.summary, 300), url: `${SITE}/${kind}/${e.id}/`,
      ...(e.vendor ? { brand: { '@type': 'Brand', name: e.vendor } } : {}),
      ...(kind === 'software' ? { applicationCategory: e.category, operatingSystem: (e.platforms ?? []).join(', ') } : {}) },
    body: b })
}

function standardPage(s, gap) {
  const title = `${s.designation} — ${trunc(s.title, 70)} | showstack`
  const description = trunc(`${s.designation}, published by ${s.body}. ${s.scope ?? s.title}${s.free_to_read ? ' Free to read.' : ''}`)

  let b = `<div class="crumb"><a href="/">showstack</a> / standards / ${esc(s.id)}</div>`
  b += `<h2>${esc(s.designation)}</h2><p class="lede">${esc(s.title)}</p>`
  b += `<div class="meta"><span class="pill">${esc(s.body)}</span><span class="pill dom-${superDomain(s.domain)}">${esc(s.domain)}</span>`
  if (s.year) b += `<span class="pill">${s.year}</span>`
  if (s.free_to_read === true) b += `<span class="pill verified">free to read</span>`
  if (s.free_to_read === false) b += `<span class="pill">paid</span>`
  b += `<span class="pill">${esc(s.status)}</span></div>`
  if (s.scope) b += `<h3>Scope</h3><p style="color:var(--dim)">${esc(s.scope)}</p>`
  if (s.notes) b += `<h3>Notes</h3><p style="color:var(--dim)">${esc(s.notes)}</p>`
  if (s.access_url) b += `<h3>Where to get it</h3><p><a href="${esc(s.access_url.url)}" rel="noopener nofollow">${esc(s.access_url.label ?? s.access_url.url)}</a></p>`
  if (s.related_protocols?.length) b += `<h3>Related protocols</h3><ul>` + s.related_protocols.map((r) => `<li><a href="/protocols/${esc(r)}/">${esc(r)}</a></li>`).join('') + `</ul>`
  b += sourcesBlock(s.sources)
  b += relatedLearn('standards', s)
  b += contributeBox('standards', s.id, gap)

  return shell({ title, description, canonical: `${SITE}/standards/${s.id}/`,
    jsonld: { '@context': 'https://schema.org', '@type': 'TechArticle', headline: s.designation,
      description: trunc(s.scope ?? s.title, 300), url: `${SITE}/standards/${s.id}/`, dateModified: s.updated },
    body: b })
}

/**
 * A browsable index for one collection.
 *
 * Every entry already had its own page, but /protocols/ itself was a 404 —
 * so anything that trimmed a URL, or followed a search result up a level,
 * fell off the site. These are also the pages worth linking to from outside:
 * "here is every standard we index" is a far better share than a single entry.
 */
function collectionIndex(kind, entries, { title, lede, group, label, sub }) {
  const groups = new Map()
  for (const e of entries) {
    const g = group(e) || 'other'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(e)
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))

  let b = `<div class="crumb"><a href="/">showstack</a> / ${esc(kind)}</div>`
  b += `<h2>${esc(title)}</h2><p class="lede">${lede}</p>`
  b += `<p class="idxjump">` + ordered.map(([g, list]) =>
    `<a href="#g-${esc(g.replace(/[^a-z0-9]+/gi, '-'))}">${esc(g)} <b>${list.length}</b></a>`).join('') + `</p>`

  for (const [g, list] of ordered) {
    b += `<h3 id="g-${esc(g.replace(/[^a-z0-9]+/gi, '-'))}">${esc(g)} <span class="idxn">${list.length}</span></h3><div class="idxlist">`
    for (const e of [...list].sort((x, y) => String(label(x)).localeCompare(String(label(y))))) {
      b += `<a class="idxrow" href="/${esc(kind)}/${esc(e.id)}/">
        <span class="idxname">${esc(label(e))}</span>
        <span class="idxsub">${esc(sub(e) ?? '')}</span></a>`
    }
    b += `</div>`
  }
  return b
}

const INDEX_CSS = `
.idxjump{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 30px;padding:0}
.idxjump a{font-family:var(--mono);font-size:12px;color:var(--dim);border:1px solid var(--line);
background:var(--panel);border-radius:999px;padding:6px 12px}
.idxjump a:hover{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent);text-decoration:none}
.idxjump a b{color:var(--dimmer);font-weight:500;margin-left:4px}
.idxn{font-family:var(--mono);font-size:12px;color:var(--dimmer);font-weight:400;margin-left:6px}
.idxlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin-bottom:8px}
.idxrow{display:flex;flex-direction:column;gap:3px;padding:11px 14px;border:1px solid var(--line);
border-radius:var(--r-sm);background:var(--panel);transition:border-color .15s,transform .15s}
.idxrow:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));transform:translateY(-1px);text-decoration:none}
.idxname{color:var(--ink);font-size:14.5px;font-weight:600;line-height:1.3}
.idxsub{color:var(--dimmer);font-family:var(--mono);font-size:11.5px;line-height:1.4}
`

// ------------------------------------------------------------------- driver
export function buildPages(db, dist) {
  const gapOf = (col, id) => (db.gaps ?? []).find((g) => g.collection === col && g.id === id)
  const urls = [`${SITE}/`]
  const write = (dir, html) => { mkdirSync(join(dist, dir), { recursive: true }); writeFileSync(join(dist, dir, 'index.html'), html) }

  // The explainers are rendered BEFORE anything else, because the links they
  // contain are what tells every index entry which explainers discuss it.
  // Deriving the map from the rendered output rather than declaring it by hand
  // is the only version of this that cannot drift out of date.
  const learnArgs = { esc, shell, SITE, GH }
  const LEARN_PAGES = [
    ['', () => learnPage(learnArgs)],
    ['dmx', () => learnDmxPage(learnArgs)],
    ['network', () => learnNetworkPage(learnArgs)],
    ['wireless', () => learnWirelessPage(learnArgs)],
    ['sound', () => learnSoundPage(learnArgs)],
    ['light', () => learnLightPage(learnArgs)],
    ['software', () => learnSoftwarePage(learnArgs)],
    ['connectivity', () => learnConnectivityPage({ ...learnArgs, jsonForScript })],
    ['systems', () => learnSystemsPage(learnArgs)],
    ['aerial', () => learnAerialPage(learnArgs)],
    ['code', () => learnCodePage(learnArgs)],
    ['engines', () => learnEnginesPage(learnArgs)],
    ['drawings', () => learnDrawingsPage(learnArgs)],
    ['rigging', () => learnRiggingPage(learnArgs)],
    ['senses', () => learnSensesPage(learnArgs)],
    ['perception', () => learnPerceptionPage(learnArgs)],
    ['neuro', () => learnNeuroPage(learnArgs)],
    ['comms', () => learnCommsPage(learnArgs)],
    ['connectors', () => learnConnectorsPage(learnArgs)],
    ['transducers', () => learnTransducersPage(learnArgs)],
    ['bits', () => learnBitsPage(learnArgs)],
    ['colour', () => learnColourPage(learnArgs)],
    ['encoding', () => learnEncodingPage(learnArgs)],
    ['reading', () => learnReadingPage(learnArgs)],
    ['ai', () => learnAiPage(learnArgs)],
    ['devices', () => learnDevicesPage(learnArgs)],
    ['emotion', () => learnEmotionPage(learnArgs)],
    ['presence', () => learnPresencePage(learnArgs)],
    ['experience', () => learnExperiencePage(learnArgs)],
  ]
  const learnHtml = new Map()
  for (const [slug, render] of LEARN_PAGES) learnHtml.set(slug, render())
  BACKLINKS = buildBacklinks(new Map([...learnHtml].filter(([k]) => k)))

  for (const p of db.protocols) { write(`protocols/${p.id}`, protocolPage(p, gapOf('protocols', p.id))); urls.push(`${SITE}/protocols/${p.id}/`) }
  for (const t of db.terms)     { write(`glossary/${t.id}`,  termPage(t, gapOf('terms', t.id)));          urls.push(`${SITE}/glossary/${t.id}/`) }
  for (const s of db.standards) { write(`standards/${s.id}`, standardPage(s, gapOf('standards', s.id)));  urls.push(`${SITE}/standards/${s.id}/`) }
  for (const e of db.software)  { write(`software/${e.id}`,  productPage('software', e, gapOf('software', e.id))); urls.push(`${SITE}/software/${e.id}/`) }
  for (const e of db.hardware)  { write(`hardware/${e.id}`,  productPage('hardware', e, gapOf('hardware', e.id))); urls.push(`${SITE}/hardware/${e.id}/`) }

  // Comparison pages. Curated pairs, generated content: "art-net vs sacn" is
  // searched constantly and every existing answer is a forum thread.
  const protoById = Object.fromEntries(db.protocols.map((p) => [p.id, p]))
  const products = [
    ...db.software.map((e) => ({ ...e, kind: 'software' })),
    ...db.hardware.map((e) => ({ ...e, kind: 'hardware' })),
  ]
  const helpers = { esc, trunc, shell, SITE, GH, products }
  const livePairs = []
  for (const [aId, bId, ask] of PAIRS) {
    const a = protoById[aId]
    const b = protoById[bId]
    // Skip silently: the curated list may name protocols not yet written, so
    // it can be edited ahead of the data without breaking the build.
    if (!a || !b) continue
    write(`compare/${a.id}-vs-${b.id}`, comparisonPage(a, b, ask, helpers))
    urls.push(`${SITE}/compare/${a.id}-vs-${b.id}/`)
    livePairs.push([a, b, ask])
  }
  if (livePairs.length) {
    write('compare', comparisonIndex(livePairs, helpers))
    urls.push(`${SITE}/compare/`)
  }

  // The interop picker. Uses the same products list built above.
  write('interop', interopPage({ esc, shell, jsonForScript, SITE, GH, products, protocols: db.protocols }))
  urls.push(`${SITE}/interop/`)

  // The field-tool calculators. Market-validated daily utilities: DMX/DIP
  // addressing, speaker delay, timecode. Same arithmetic the test suite runs.
  write('build', buildPage({ esc, shell, SITE, GH, db }))
  urls.push(`${SITE}/build/`)

  // The front door. Generated through the same shell as everything else so
  // the header, nav rail, tokens and footer cannot drift; `${SITE}/` is
  // already the first entry in `urls`.
  write('', homePage({ esc, shell, SITE, GH, db }))
  write('tools', toolsPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/tools/`)

  // The converged-network planner: QoS queues, DSCP collisions, link fill.
  write('network', networkPage({ esc, shell, jsonForScript, SITE, GH }))
  urls.push(`${SITE}/network/`)

  // The per-country wireless mic frequency map.
  write('rf', rfPage({ esc, shell, jsonForScript, SITE, GH }))
  urls.push(`${SITE}/rf/`)

  // Signal & connector reference: a short hub page linking three category
  // pages instead of one page cramming everything together. Hand-authored
  // explainer content, not generated from the YAML dataset — see
  // signals.mjs for why.
  write('signals', signalsPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/signals/`)
  write('signals/data', signalsDataPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/signals/data/`)
  write('signals/media', signalsMediaPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/signals/media/`)
  write('signals/display', signalsDisplayPage({ esc, shell, SITE, GH }))
  urls.push(`${SITE}/signals/display/`)

  // The explainers. Reference material answers "what is it"; these answer
  // "why does it behave like that", which is the question that actually gets
  // asked at load-in.
  // Now write them, with the onward block appended inside the page wrapper so a
  // reader is never left at a dead end.
  for (const [slug, html] of learnHtml) {
    const dir = slug ? `learn/${slug}` : 'learn'
    const foot = slug
      ? learnFooter(esc, { slug, html, db, groups: LEARN_GROUPS, topics: LEARN_TOPICS, capstone: LEARN_CAPSTONE })
      : ''
    write(dir, foot ? html.replace('</div></main>', `${foot}</div></main>`) : html)
    urls.push(`${SITE}/learn/${slug ? slug + '/' : ''}`)
  }

  // Browsable index per collection. These used to 404.
  const INDEXES = [
    ['protocols', db.protocols, {
      title: 'Protocols', lede: 'Every wire protocol in the index, grouped by what it carries. Ports, addressing, gotchas and a citation on each.',
      group: (e) => e.category, label: (e) => e.name,
      sub: (e) => (e.default_ports ?? []).map((x) => `${x.transport}/${x.number}`).join(' · ') || e.openness,
    }],
    ['standards', db.standards, {
      title: 'Standards', lede: 'Technical and safety standards that govern how live entertainment systems are built and operated, grouped by publishing body. Where a document is free to read, it says so.',
      group: (e) => e.body, label: (e) => e.designation,
      sub: (e) => `${e.domain}${e.free_to_read ? ' · free to read' : ''}`,
    }],
    ['glossary', db.terms, {
      title: 'Glossary', lede: 'Bilingual EN / 繁中 vocabulary, grouped by department, with the regional variants and false friends that cause real confusion on headset.',
      group: (e) => e.domain, label: (e) => e.en,
      sub: (e) => e.zh_hant ?? '',
    }],
    ['software', db.software, {
      title: 'Software', lede: 'Control, playback, design and diagnostic software, grouped by what it does — and crucially which protocols each one speaks.',
      group: (e) => e.category, label: (e) => e.name,
      sub: (e) => [e.vendor, e.price_model].filter(Boolean).join(' · '),
    }],
    ['hardware', db.hardware, {
      title: 'Hardware', lede: 'Consoles, servers, processors, gateways, switches and the rest of the rack, grouped by category, with what each one speaks.',
      group: (e) => e.category, label: (e) => e.name,
      sub: (e) => e.vendor,
    }],
  ]
  for (const [kind, entries, opts] of INDEXES) {
    write(kind, shell({
      title: `${opts.title} — ${entries.length} indexed | showstack`,
      description: trunc(opts.lede, 300),
      canonical: `${SITE}/${kind}/`,
      jsonld: {
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: `showstack ${opts.title.toLowerCase()}`,
        description: trunc(opts.lede, 300),
        url: `${SITE}/${kind}/`,
        isPartOf: { '@type': 'Dataset', name: 'showstack', url: SITE },
        license: 'https://creativecommons.org/licenses/by/4.0/',
      },
      body: collectionIndex(kind, entries, opts),
      extraStyle: INDEX_CSS,
    }))
    urls.push(`${SITE}/${kind}/`)
  }

  // Port pages, plus an index of every port we know about.
  const byPort = new Map()
  for (const p of db.protocols) for (const port of p.default_ports ?? []) {
    if (!byPort.has(port.number)) byPort.set(port.number, [])
    byPort.get(port.number).push({ p, port })
  }
  for (const [number, entries] of byPort) { write(`ports/${number}`, portPage(number, entries)); urls.push(`${SITE}/ports/${number}/`) }

  const rows = [...byPort.entries()].sort((a, b) => a[0] - b[0]).flatMap(([n, es]) =>
    es.map((e, i) => `<tr>${i === 0 ? `<td rowspan="${es.length}"><strong><a href="/ports/${n}/">${n}</a></strong></td>` : ''}
     <td>${e.port.transport}</td><td><a href="/protocols/${esc(e.p.id)}/">${esc(e.p.name)}</a></td>
     <td>${esc(e.port.role ?? '')}${e.port.note ? `<br><span style="color:var(--dimmer);font-size:12.5px">${esc(e.port.note)}</span>` : ''}</td></tr>`)).join('')
  write('ports', shell({
    title: 'Port numbers used in live entertainment systems | showstack',
    description: 'Every UDP and TCP port used by lighting, audio, video, tracking and show control protocols, with sources.',
    canonical: `${SITE}/ports/`,
    body: `<div class="crumb"><a href="/">showstack</a> / ports</div><h2>Ports</h2>
      <p class="lede">Every port number indexed so far, and what listens on it. ${byPort.size} ports across ${db.protocols.length} protocols.</p>
      <table><tr><th>Port</th><th>Transport</th><th>Used by</th><th>What it does</th></tr>${rows}</table>
      <div class="cta"><strong>Missing one?</strong><p>Ports we could not source are deliberately left blank rather than guessed.
      <a href="${GH}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22">Open gaps are here.</a></p></div>`,
  }))
  urls.push(`${SITE}/ports/`)

  writeFileSync(join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') + `\n</urlset>\n`)

  writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

  // llms.txt — an emerging convention for telling AI crawlers what a site is
  // and where the machine-readable version lives. Costs nothing, and being the
  // cited source inside an assistant is real distribution for a dataset.
  writeFileSync(join(dist, 'llms.txt'),
`# showstack

> An open, machine-readable index of live entertainment technology: control
> protocols, published standards, software and hardware interoperability, and a
> bilingual English / Traditional Chinese glossary. Every factual field carries a
> source citation. Fields that could not be sourced are left empty on purpose.

Licence: data CC BY 4.0, code MIT. Attribute to "showstack contributors".

## Machine-readable

- [Full dataset](${SITE}/showstack.json)
- [Protocols](${SITE}/api/v1/protocols.json) — ports, multicast, addressing, gotchas
- [Software](${SITE}/api/v1/software.json) — including which protocols each speaks
- [Hardware](${SITE}/api/v1/hardware.json)
- [Standards](${SITE}/api/v1/standards.json) — ANSI E1.x, SMPTE, AES, IEC
- [Glossary](${SITE}/api/v1/terms.json) — EN / 繁中 with regional variants
- [Known gaps](${SITE}/api/v1/gaps.json)

## Notes for assistants

- Every entry has a \`confidence\` field: \`verified\` means checked against the
  primary standard or real hardware, \`reported\` means a credible secondary
  source, \`unverified\` means community knowledge. Please carry it through.
- Entries link to primary documents in \`sources\`. Cite those, not just this.
- Rigging, electrical, machinery, laser and pyrotechnic entries point at the
  governing standard and never paraphrase a requirement. Do not present an
  entry as a substitute for the standard.
- Corrections: ${GH}/issues
`)

  return { pages: urls.length, ports: byPort.size }
}
