/**
 * Where wireless microphones are legal, by country.
 *
 * This is regulatory data, so the rules are the product and the sources are
 * the point. Every region cites its regulator (or a dated professional
 * compilation), every band carries its licence condition, and regions we
 * could not source are listed as open gaps rather than guessed at - a wrong
 * frequency map gets equipment seized at customs or shows shut down.
 *
 * The worldwide constant: the 700 MHz band (694/698-806) has been sold to
 * mobile carriers almost everywhere. Gear bought for a band your country
 * cleared is scrap, which is why this table exists.
 *
 * use values: 'unlicensed' (exempt / class licence, power limited),
 * 'licensed' (individual licence), 'coordinated' (licence plus operational
 * coordination), 'prohibited' (explicitly banned).
 */
export const RFDATA = {
  regions: {
    us: {
      name: 'United States',
      bands: [
        { from: 54, to: 72, use: 'unlicensed', label: 'VHF TV band (unused channels)' },
        { from: 76, to: 88, use: 'unlicensed', label: 'VHF TV band (unused channels)' },
        { from: 174, to: 216, use: 'unlicensed', label: 'VHF TV band (unused channels)' },
        { from: 470, to: 608, use: 'unlicensed', label: 'UHF TV band (unused channels); Part 74 licence available for pro users at higher power' },
        { from: 614, to: 616, use: 'unlicensed', label: '600 MHz guard band, 20 mW' },
        { from: 653, to: 657, use: 'licensed', label: '600 MHz duplex gap, Part 74 licensees only' },
        { from: 657, to: 663, use: 'unlicensed', label: '600 MHz duplex gap, 20 mW' },
        { from: 941.5, to: 960, use: 'licensed', label: 'Part 74 segments (941.5-944, 944-952, 952.85-956.25, 956.45-959.85)' },
        { from: 1435, to: 1525, use: 'coordinated', label: 'Aeronautical telemetry band: licensed, per-event coordination' },
        { from: 6875, to: 7125, use: 'licensed', label: 'Part 74 segments 6875-6900 / 7100-7125' },
      ],
      note: 'TV-band operation means the locally unused channels: run a scan. The old 600 MHz core (614-653 except the slices above) and 700 MHz are mobile now.',
      sources: [
        { title: '47 CFR 15.236 (unlicensed wireless microphones)', url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15/subpart-C/subject-group-ECFR2f2e5828339709e/section-15.236' },
        { title: 'FCC wireless microphones rulemaking (2024)', url: 'https://www.federalregister.gov/documents/2024/10/18/2024-23959/wireless-microphones-in-the-tv-bands-600-mhz-guard-band-600-mhz-duplex-gap-and-the-9415-944-mhz' },
      ],
    },
    ca: {
      name: 'Canada',
      bands: [
        { from: 54, to: 72, use: 'unlicensed', label: 'TV band (unused channels)' },
        { from: 76, to: 88, use: 'unlicensed', label: 'TV band (unused channels)' },
        { from: 150, to: 174, use: 'licensed', label: 'Land-mobile VHF, max 50 mW' },
        { from: 174, to: 216, use: 'unlicensed', label: 'TV band (unused channels)' },
        { from: 470, to: 608, use: 'unlicensed', label: 'UHF TV band (unused channels)' },
      ],
      note: 'Mirrors the US TV-band picture: 600/700 MHz are mobile.',
      sources: [
        { title: 'APWPT wireless microphone frequency handout (2024)', url: 'https://apwpt.org/wp-content/uploads/2024/01/Handout_Version-2024_1.pdf' },
      ],
    },
    uk: {
      name: 'United Kingdom',
      bands: [
        { from: 173.7, to: 175.1, use: 'unlicensed', label: 'VHF licence-exempt' },
        { from: 175.25, to: 209.8, use: 'licensed', label: '15 VHF spot frequencies, shared PMSE licence' },
        { from: 470, to: 694, use: 'coordinated', label: 'Interleaved UHF TV channels, coordinated PMSE licence per site' },
        { from: 606.5, to: 613.5, use: 'licensed', label: 'Channel 38, UK-wide shared PMSE licence (10 mW handheld / 50 mW bodyworn)' },
        { from: 863.1, to: 864.9, use: 'unlicensed', label: 'Channel 70 licence-exempt (10 mW handheld / 50 mW bodyworn)' },
      ],
      note: 'Ch 70 is where cheap systems fight each other; anything serious books coordinated UHF through Ofcom PMSE.',
      sources: [
        { title: 'Ofcom shared PMSE licence', url: 'https://www.ofcom.org.uk/spectrum/radio-equipment/shared' },
        { title: 'Ofcom PMSE licence information', url: 'https://www.ofcom.org.uk/spectrum/radio-equipment/pmse-licence-info' },
      ],
    },
    eu: {
      name: 'EU (harmonised)',
      bands: [
        { from: 823, to: 832, use: 'unlicensed', label: '800 MHz duplex gap: 13 dBm handheld / 20 dBm bodyworn in 823-826, 20 dBm in 826-832' },
        { from: 1785, to: 1805, use: 'unlicensed', label: '1800 MHz duplex gap, sub-band power limits' },
      ],
      note: 'Decision 2014/641/EU harmonises these two gaps EU-wide and obliges members to find at least 30 MHz more in 470-790 TV white space; the white-space detail is national, so check the local regulator too.',
      sources: [
        { title: 'Commission Implementing Decision 2014/641/EU', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32014D0641' },
      ],
    },
    de: {
      name: 'Germany',
      bands: [
        { from: 174, to: 230, use: 'unlicensed', label: 'VHF general assignment, 50 mW' },
        { from: 470, to: 608, use: 'unlicensed', label: 'UHF TV white space, general assignment' },
        { from: 614, to: 698, use: 'unlicensed', label: 'UHF TV white space, general assignment' },
        { from: 823, to: 832, use: 'unlicensed', label: 'EU duplex gap' },
        { from: 1785, to: 1805, use: 'unlicensed', label: 'EU duplex gap' },
      ],
      note: 'BNetzA general assignments (Allgemeinzuteilungen); individual licences exist beyond these.',
      sources: [
        { title: 'APWPT wireless microphone frequency handout (2024)', url: 'https://apwpt.org/wp-content/uploads/2024/01/Handout_Version-2024_1.pdf' },
      ],
    },
    jp: {
      name: 'Japan',
      bands: [
        { from: 470, to: 710, use: 'coordinated', label: '特定ラジオマイク (A-type): DTT white space, licence + 特ラ機構 coordination' },
        { from: 710, to: 714, use: 'coordinated', label: 'Dedicated specified-radio-mic band, licence + coordination' },
        { from: 806, to: 810, use: 'unlicensed', label: 'B-type (小電力): licence-free' },
        { from: 1240, to: 1260, use: 'coordinated', label: '1.2 GHz specified-radio-mic band, licence + coordination' },
      ],
      note: 'The old A band 770-806 closed in 2019. A-type quality systems are licensed AND schedule-coordinated through the 特定ラジオマイク運用調整機構.',
      sources: [
        { title: '特定ラジオマイク運用調整機構 Q&A', url: 'https://radiomic.org/qa/index.html' },
        { title: 'Shure Japan: 特定ラジオマイクの周波数帯移行', url: 'https://www.shure.com/ja-JP/support/frequencies' },
      ],
    },
    kr: {
      name: 'South Korea',
      bands: [
        { from: 72.61, to: 73.91, use: 'unlicensed', label: 'Licence-exempt, 10 mW' },
        { from: 74.0, to: 74.8, use: 'unlicensed', label: 'Licence-exempt, 10 mW' },
        { from: 470, to: 698, use: 'licensed', label: 'Broadcast band, licensed, max 50 mW' },
      ],
      sources: [
        { title: 'APWPT wireless microphone frequency handout (2024)', url: 'https://apwpt.org/wp-content/uploads/2024/01/Handout_Version-2024_1.pdf' },
      ],
    },
    hk: {
      name: 'Hong Kong',
      bands: [
        { from: 33, to: 47.5, use: 'unlicensed', label: 'General-purpose mics, exempt (10-100 mW depending on segment)' },
        { from: 174, to: 184, use: 'licensed', label: 'Corporate use via Private Mobile Radio System Licence, 20 mW' },
      ],
      gapNote: 'OFCA documents the exempt low bands and the 174/184 MHz licensed route; the band plan professional UHF systems run under in HK venues was not verifiable from public OFCA pages at research time. If you hold an OFCA assignment, cite it and open a PR.',
      sources: [
        { title: 'OFCA: wireless microphones (consumer guide)', url: 'https://www.ofca.gov.hk/en/consumer_focus/guide/help_for_consumers/information_on_radio_applications/wireless_microphones/index.html' },
      ],
    },
    tw: {
      name: 'Taiwan',
      bands: [],
      gapNote: 'Wireless mics fall under the NCC 低功率射頻器材技術規範; the current band tables were not verifiable online at research time. Local crews: cite the current LP0002 revision and open a PR.',
      sources: [
        { title: 'NCC 低功率射頻器材技術規範 (LP0002)', url: 'https://www.ncc.gov.tw/chinese/news_detail.aspx?site_content_sn=8&is_history=1&pages=6&sn_f=32162' },
      ],
    },
    cn: {
      name: 'China (mainland)',
      bands: [],
      gapNote: 'MIIT governs radio microphone allocations; no primary table could be verified at research time. This row is deliberately empty rather than guessed - if you can cite the current MIIT provisions, open a PR.',
      sources: [],
    },
    sg: {
      name: 'Singapore',
      bands: [
        { from: 470, to: 694, use: 'unlicensed', label: 'Exempt at up to 10 mW ERP (TV band)' },
      ],
      note: '703-803 MHz went to mobile with the 2017 700 MHz allocation, stranding pre-2018 systems tuned there.',
      sources: [
        { title: 'Wireless microphone bandwidth shrinking in Singapore (IMDA changes)', url: 'https://www.loudtechnologiesasia.com/news/item/wireless-microphone-bandwidth-shrinking-in-singapore-updated' },
      ],
    },
    au: {
      name: 'Australia',
      bands: [
        { from: 88, to: 108, use: 'unlicensed', label: 'FM band: audio transmitters and auditory assistance only' },
        { from: 174, to: 230, use: 'unlicensed', label: 'VHF: many regional areas, check Channel Finder' },
        { from: 520, to: 694, use: 'unlicensed', label: 'UHF TV white space under the LIPD class licence; 520-526 available nationwide' },
        { from: 694, to: 820, use: 'prohibited', label: 'Cleared to mobile in 2015: wireless mics banned' },
        { from: 915, to: 928, use: 'unlicensed', label: '915-928 (not on exactly 915)' },
        { from: 1785, to: 1800, use: 'unlicensed', label: 'Dedicated wireless-audio band, available everywhere' },
      ],
      sources: [
        { title: 'ACMA: wireless microphones', url: 'https://www.acma.gov.au/wireless-microphones' },
      ],
    },
  },
}

/** The bands for one region, or null if the region is unknown. */
export function rfBands(data, regionId) {
  const r = data.regions[regionId]
  return r ? (r.bands ?? []) : null
}

/**
 * Is this frequency inside any listed band for the region?
 * Returns the matching bands so the caller can show WHY, including an
 * explicit prohibited match, which outranks any overlapping permission.
 */
export function rfCheck(data, regionId, mhz) {
  const r = data.regions[regionId]
  const f = Number(mhz)
  if (!r || !Number.isFinite(f) || f <= 0) return null
  const hits = (r.bands ?? []).filter((b) => f >= b.from && f <= b.to)
  const banned = hits.some((b) => b.use === 'prohibited')
  return { legal: hits.length > 0 && !banned, banned, hits }
}
