#!/usr/bin/env node
/**
 * showstack CLI.
 *
 * Designed to answer a question in one line while you are standing at a rack
 * with a laptop balanced on a road case. No config, no network, no login.
 */
import ss from './index.js'

const [, , cmd, ...rest] = process.argv
const arg = rest.join(' ')

const c = process.stdout.isTTY
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[36m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, g: (s) => s, y: (s) => s }

function usage() {
  console.log(`
${c.b('showstack')} ${c.dim('— the open index of live entertainment technology')}

  ${c.g('showstack port')} <number>        what protocol runs on this port
  ${c.g('showstack speaks')} <protocol>    what sends or receives this protocol
  ${c.g('showstack proto')} <id>           full detail on a protocol
  ${c.g('showstack term')} <word>          glossary lookup, EN or 中文
  ${c.g('showstack interop')} <a> <b>      how these two products can talk
  ${c.g('showstack search')} <query>       search everything
  ${c.g('showstack gaps')} [collection]    what the index is missing
  ${c.g('showstack stats')}                what is in the index

${c.dim(`${ss.meta.total} entries, built ${ss.meta.generated}. Data CC BY 4.0.`)}
${c.dim('Something wrong or missing? github.com/deliseph/showstack')}
`)
}

function showProtocol(p) {
  console.log(`\n${c.b(p.name)} ${c.dim(`(${p.id})`)}  ${c.y(p.confidence ?? '')}`)
  console.log(`${p.summary}\n`)
  for (const port of p.default_ports ?? []) {
    console.log(`  ${c.g(`${port.transport}/${port.number}`)}  ${port.role ?? ''}`)
  }
  if (p.multicast?.used) for (const r of p.multicast.ranges ?? []) console.log(`  ${c.g('multicast')}  ${r}`)
  if (p.universe_model) console.log(`  ${c.dim('addressing')}  ${p.universe_model}`)
  if (p.openness) console.log(`  ${c.dim('openness')}    ${p.openness}`)
  if (p.gotchas?.length) {
    console.log(`\n  ${c.y('Gotchas')}`)
    for (const g of p.gotchas) console.log(`  - ${g}`)
  }
  if (p.spoken_by?.length) console.log(`\n  ${c.dim(`Spoken by ${p.spoken_by.length} indexed products. Run: showstack speaks ${p.id}`)}`)
  for (const s of p.sources ?? []) console.log(`\n  ${c.dim('source')} ${s.url}`)
  console.log()
}

switch (cmd) {
  case 'port': {
    const hits = ss.byPort(arg)
    if (!hits.length) {
      console.log(`\nNothing indexed on port ${arg}.`)
      console.log(c.dim(`If you know what uses it, that is a five minute pull request: github.com/deliseph/showstack\n`))
      process.exit(1)
    }
    for (const p of hits) showProtocol(p)
    break
  }
  case 'proto': {
    const p = ss.get('protocols', arg)
    if (!p) { console.log(`\nNo protocol "${arg}". Try: showstack search ${arg}\n`); process.exit(1) }
    showProtocol(p)
    break
  }
  case 'speaks': {
    const hits = ss.whoSpeaks(arg)
    if (!hits.length) { console.log(`\nNothing indexed speaks "${arg}", or the protocol id is different. Try: showstack search ${arg}\n`); process.exit(1) }
    console.log(`\n${c.b(hits.length + ' products speak ' + arg)}\n`)
    for (const s of hits) {
      console.log(`  ${c.g(s.direction.padEnd(14))} ${c.b(s.name)} ${c.dim(`(${s.kind}${s.vendor ? ', ' + s.vendor : ''})`)}${s.requires_licence ? c.y('  [licensed]') : ''}`)
      if (s.note) console.log(`  ${' '.repeat(14)} ${c.dim(s.note)}`)
    }
    console.log()
    break
  }
  case 'term': {
    const hits = ss.term(arg).concat(ss.search(arg, { collection: 'terms', limit: 5 }))
    const seen = new Set()
    const uniq = hits.filter((t) => !seen.has(t.id) && seen.add(t.id))
    if (!uniq.length) { console.log(`\nNo glossary entry for "${arg}".\n`); process.exit(1) }
    for (const t of uniq) {
      console.log(`\n${c.b(t.en)}  ${t.zh_hant ?? ''}${t.safety_critical ? c.y('   [safety critical]') : ''}`)
      console.log(`${t.definition_en}`)
      if (t.definition_zh_hant) console.log(c.dim(t.definition_zh_hant))
      for (const r of t.regional_variants ?? []) console.log(`  ${c.g(r.region.padEnd(8))} ${r.term}${r.note ? c.dim('  ' + r.note) : ''}`)
      if (t.false_friends?.length) {
        console.log(`  ${c.y('Careful')}`)
        for (const f of t.false_friends) console.log(`  - ${f}`)
      }
    }
    console.log()
    break
  }
  case 'interop': {
    const [a, b] = rest
    const paths = ss.interop(a, b)
    if (!paths.length) { console.log(`\nNo shared protocol indexed between "${a}" and "${b}". That may be a gap rather than a fact.\n`); process.exit(1) }
    console.log()
    for (const p of paths) console.log(`  ${c.b(p.from)} ${c.g('->')} ${c.b(p.to)}   via ${c.y(p.protocol)}`)
    console.log()
    break
  }
  case 'search': {
    const hits = ss.search(arg)
    if (!hits.length) { console.log(`\nNothing matches "${arg}". That is probably worth an issue.\n`); process.exit(1) }
    console.log()
    for (const h of hits) console.log(`  ${c.dim((h.collection + '/').padEnd(11))}${c.b(h.name ?? h.en ?? h.designation)} ${c.dim(h.id)}`)
    console.log()
    break
  }
  case 'gaps': {
    const g = ss.missing(arg || undefined)
    console.log(`\n${c.b(g.length + ' entries have missing fields')}\n`)
    for (const x of g.slice(0, 60)) console.log(`  ${c.dim((x.collection + '/').padEnd(11))}${c.b(x.id.padEnd(24))} ${c.y(x.missing.join(', '))}`)
    console.log(`\n${c.dim('Each one is a five minute pull request: github.com/deliseph/showstack')}\n`)
    break
  }
  case 'stats': {
    console.log(`\n${c.b('showstack')} built ${ss.meta.generated}`)
    for (const [k, v] of Object.entries(ss.meta.counts)) console.log(`  ${String(v).padStart(4)}  ${k}`)
    console.log(`  ${String(ss.meta.total).padStart(4)}  total`)
    console.log(`\n  ${ss.contributors.length} contributors credited in the data\n`)
    break
  }
  default:
    usage()
}
