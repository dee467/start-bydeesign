/* ByDeesign post maker.
   Draws carousels (up to 10 slides), single posts and story covers on a canvas
   in the brand's fonts, colours and marks. The words come from Dee ("Use my
   words as they are") or from Deia (POST /api/studio/carousel on Deia, Dee's
   login only), which can also read a live sales page first. */
(function () {
  const { A, $, el, toast, saveBlob, PHOTOS, STICKERS } = window.BYD
  const params = new URLSearchParams(location.search)
  const DEIA = params.get('deia') || 'https://deia.bydeesign.com'
  const API = DEIA.replace(/\/$/, '') + '/api/studio/carousel'

  const COL = { cream: '#F4F0EA', orange: '#D95E28', lime: '#E3E8A9', peri: '#B5C5EE', olive: '#65623B', black: '#0C0C0C', navy: '#272832', periD: '#94AAD5', limeD: '#B5C15B', white: '#FFFFFF' }
  const NAMES = { cream: 'Cream', orange: 'Orange', lime: 'Light lime', peri: 'Light periwinkle', olive: 'Olive', black: 'Black', navy: 'Navy (photos)', periD: 'Periwinkle', limeD: 'Lime' }
  // Per background: text colour, accent choices per highlight style, BD letters and asterisk.
  const BGS = {
    cream: { fg: 'black', block: ['lime', 'peri'], colour: ['orange', 'olive'], pill: ['peri', 'lime'], bdL: 'black', star: 'peri' },
    orange: { fg: 'cream', block: ['black', 'lime'], colour: ['lime', 'peri'], pill: ['peri', 'lime'], bdL: 'black', star: 'peri' },
    lime: { fg: 'black', block: ['peri', 'cream'], colour: ['orange', 'olive'], pill: ['lime', 'peri'], bdL: 'black', star: 'peri' },
    peri: { fg: 'black', block: ['lime', 'cream'], colour: ['lime', 'cream'], pill: ['lime', 'peri'], bdL: 'black', star: 'lime' },
    olive: { fg: 'cream', block: ['lime', 'peri'], colour: ['lime', 'peri'], pill: ['lime', 'peri'], bdL: 'cream', star: 'lime' },
    black: { fg: 'cream', block: ['peri', 'lime'], colour: ['peri', 'lime'], pill: ['lime', 'peri'], bdL: 'cream', star: 'peri' },
    navy: { fg: 'cream', block: ['peri', 'lime'], colour: ['peri', 'lime'], pill: ['lime', 'peri'], bdL: 'cream', star: 'peri' },
  }
  const LAYOUTS = [
    ['statement', 'Serif statement'], ['statement-centre', 'Serif, centred'], ['caps', 'Caps statement'], ['caps-centre', 'Caps, centred'],
    ['photo-side', 'Photo beside the headline'], ['cutout', 'Cut-out of Dee'], ['photo-overlay', 'Photo behind, caps on top'], ['photo-top', 'Photo on top, headline below'],
    ['shot', 'Screenshot below the headline'], ['phone', 'Phone mock-up'], ['doodle', 'Black doodle'], ['cta', 'Call to action'],
  ]
  const PHOTO_LAYOUTS = ['photo-side', 'cutout', 'photo-overlay', 'photo-top']
  const BG_FOR = {
    'photo-side': ['navy', 'black', 'orange', 'olive'], 'photo-overlay': ['navy'], doodle: ['black'], 'photo-top': ['cream', 'lime', 'peri'], shot: ['cream', 'lime', 'peri'],
  }
  const ALL_BG = ['cream', 'orange', 'lime', 'peri', 'olive', 'black']
  const WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN']
  const SIZES = { '4:5': [1080, 1350], '1:1': [1080, 1080], '9:16': [1080, 1920] }
  const F = { serif: '"BYD Serif", "Instrument Serif", serif', caps: '"BYD Caps", "League Spartan", sans-serif', body: '"BYD Body", Montserrat, sans-serif', script: '"BYD Script", cursive', round: '"BYD Round", cursive' }

  let st = load() || { format: 'carousel', size: '4:5', count: '', text: '', url: '', photos: ['dee-04', 'dee-06', 'dee-08', 'dee-16'], slides: [], cur: 0, read: null }

  /* ---------- images ---------- */
  const IMG = {}
  let redrawTimer = 0
  function img(src) {
    if (!src) return null
    let e = IMG[src]
    if (!e) {
      e = IMG[src] = new Image()
      e.onload = () => { clearTimeout(redrawTimer); redrawTimer = setTimeout(redrawAll, 30) }
      e.src = src
    }
    return e.complete && e.naturalWidth ? e : null
  }
  const tintCache = {}
  function tint(im, hex) {
    const k = im.src + hex
    if (!tintCache[k]) { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = hex; x.fillRect(0, 0, c.width, c.height); tintCache[k] = c }
    return tintCache[k]
  }
  ;['logos/bd-letters-black.png', 'logos/bd-asterisk-mask.png', 'logos/cat.png'].forEach(p => img(A + p))
  STICKERS.forEach(([k]) => img(stickerSrc(k)))
  function stickerSrc(k) { return k === 'cat' ? A + 'logos/cat.png' : A + 'stickers/' + k + '.png' }
  const photoById = id => PHOTOS.find(p => p.id === id)

  /* ---------- text engine ---------- */
  function tokens(text, upper) {
    const out = []
    let prevSpace = true
    String(text || '').split('*').forEach((seg, i) => {
      const hl = i % 2 === 1
      seg.split('\n').forEach((line, li) => {
        if (li > 0) out.push({ br: true })
        const glueFirst = li === 0 && i > 0 && /^\S/.test(line) && out.length && !out[out.length - 1].br && !prevSpace
        line.split(/\s+/).filter(Boolean).forEach((w, wi) => out.push({ w: upper ? w.toUpperCase() : w, hl, glue: wi === 0 && glueFirst }))
        prevSpace = /\s$/.test(line)
      })
    })
    return out
  }
  function setFont(ctx, fam, size, weight = 400, ls = 0) { ctx.font = `${weight} ${size}px ${fam}`; if ('letterSpacing' in ctx) ctx.letterSpacing = ls ? (ls * size) + 'px' : '0px' }
  function layoutLines(ctx, toks, maxW) {
    const sp = ctx.measureText(' ').width
    const lines = []; let line = [], w = 0
    for (const t of toks) {
      if (t.br) { lines.push(line); line = []; w = 0; continue }
      const tw = ctx.measureText(t.w).width
      if (line.length && !t.glue && w + sp + tw > maxW) { lines.push(line); line = []; w = 0 }
      line.push({ ...t, tw }); w += (line.length > 1 && !t.glue ? sp : 0) + tw
    }
    if (line.length) lines.push(line)
    return { lines, sp }
  }
  // Largest size (≤ maxS) where every word fits the width and the block fits maxH.
  function fit(ctx, toks, fam, weight, ls, maxW, maxH, lh, minS, maxS) {
    let best = null
    for (let s = Math.round(maxS); s >= minS; s -= 2) {
      setFont(ctx, fam, s, weight, ls)
      if (toks.some(t => !t.br && ctx.measureText(t.w).width > maxW)) continue
      const L = layoutLines(ctx, toks, maxW)
      if (L.lines.length * s * lh <= maxH || s <= minS + 1) { best = { size: s, ...L }; break }
    }
    if (!best) { setFont(ctx, fam, minS, weight, ls); best = { size: minS, ...layoutLines(ctx, toks, maxW) } }
    best.h = best.lines.length * best.size * lh
    return best
  }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
  const lumHex = h => { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] }
  const onCol = hex => lumHex(hex) > .3 ? COL.black : COL.cream

  // Draws a fitted headline block. o: {x, y (top), w, align, fam, weight, ls, lh, fg, hlStyle, accent, bg, size}
  function drawHead(ctx, F_, o) {
    const { lines, size, sp } = F_
    const lh = size * o.lh, asc = size * (o.asc || .8)
    setFont(ctx, o.fam, size, o.weight, o.ls)
    const acc = COL[o.accent] || COL.lime
    const xs = lines.map(line => {
      const lw = line.reduce((a, t, i) => a + t.tw + (i && !t.glue ? sp : 0), 0)
      return o.align === 'centre' ? o.x + (o.w - lw) / 2 : o.x
    })
    // highlight shapes first
    if (o.hlStyle !== 'colour') {
      lines.forEach((line, li) => {
        let x = xs[li], run = null
        const runs = []
        line.forEach((t, i) => {
          if (i && !t.glue) x += sp
          if (t.hl) { if (!run) run = { x1: x }; run.x2 = x + t.tw } else if (run) { runs.push(run); run = null }
          x += t.tw
        })
        if (run) runs.push(run)
        runs.forEach((r, ri) => {
          const pad = size * .1, top = o.y + li * lh + asc - size * .74, h = size * .9
          const bgHex = o.hlStyle === 'pill' ? (o.bg === 'black' || o.bg === 'navy' ? COL.cream : COL.black) : acc
          ctx.save(); ctx.translate((r.x1 + r.x2) / 2, top + h / 2); ctx.rotate(((li + ri) % 2 ? .7 : -1.3) * Math.PI / 180)
          ctx.fillStyle = bgHex; rr(ctx, -(r.x2 - r.x1) / 2 - pad, -h / 2, r.x2 - r.x1 + pad * 2, h, size * .16); ctx.fill(); ctx.restore()
        })
      })
    }
    lines.forEach((line, li) => {
      let x = xs[li]; const y = o.y + li * lh + asc
      line.forEach((t, i) => {
        if (i && !t.glue) x += sp
        let c = o.fg
        if (t.hl) {
          if (o.hlStyle === 'colour') c = acc
          else if (o.hlStyle === 'pill') { const pb = o.bg === 'black' || o.bg === 'navy' ? COL.cream : COL.black; c = lumHex(acc) > .3 && pb === COL.black ? acc : onCol(pb) }
          else c = onCol(acc)
        }
        ctx.fillStyle = c; ctx.fillText(t.w, x, y); x += t.tw
      })
    })
    return F_.h
  }
  // Small Montserrat paragraph; returns height.
  function para(ctx, text, o, measureOnly) {
    if (!text) return 0
    setFont(ctx, F.body, o.size, o.weight || 700, o.ls || 0)
    const clean = String(text).replace(/\*/g, '')
    const { lines } = layoutLines(ctx, tokens(o.upper ? clean.toUpperCase() : clean), o.w)
    const lh = o.size * (o.lh || 1.2)
    if (!measureOnly) {
      ctx.fillStyle = o.fg
      lines.forEach((line, li) => {
        const txt = line.map(t => t.w).join(' ')
        const lw = ctx.measureText(txt).width
        const x = o.align === 'centre' ? o.x + (o.w - lw) / 2 : o.x
        ctx.fillText(txt, x, o.y + li * lh + o.size * .82)
      })
    }
    return lines.length * lh
  }
  function pill(ctx, text, x, y, o) {
    if (!text) return 0
    const size = o.size || 26
    setFont(ctx, F.body, size, 700, .01)
    const t = text.toUpperCase(), tw = ctx.measureText(t).width, ph = size * 1.6, pw = tw + size * 1.2
    const px = o.align === 'centre' ? x - pw / 2 : x
    ctx.fillStyle = o.bgHex; rr(ctx, px, y, pw, ph, ph / 2); ctx.fill()
    ctx.fillStyle = o.fgHex; ctx.fillText(t, px + size * .6, y + ph / 2 + size * .36)
    return ph
  }
  function pillColours(bg, onPhoto) {
    if (onPhoto) return { bgHex: COL.cream, fgHex: COL.black }
    if (bg === 'black' || bg === 'navy' || bg === 'olive') return { bgHex: COL.lime, fgHex: COL.black }
    if (bg === 'orange') return { bgHex: COL.black, fgHex: COL.lime }
    return { bgHex: COL.black, fgHex: COL.cream }
  }

  /* ---------- pieces ---------- */
  function bd(ctx, s, W, H, pos, onPhoto) {
    if (!s.bd) return
    const L = img(A + 'logos/bd-letters-black.png'), S = img(A + 'logos/bd-asterisk-mask.png')
    if (!L || !S) return
    const b = BGS[s.bg] || BGS.cream
    const letters = onPhoto ? COL.cream : COL[b.bdL]
    let star = onPhoto ? COL.peri : COL[b.star]
    if (star === COL[s.bg]) star = COL.peri
    const h = W * .094, w = h * L.width / L.height
    const bottom = H - footGap(W, H) + h * .2
    const x = pos === 'centre' ? (W - w) / 2 : pos === 'left' ? W * .1 : W - W * .083 - w
    ctx.drawImage(tint(L, letters), x, bottom - h, w, h)
    ctx.drawImage(tint(S, star), x, bottom - h, w, h)
  }
  const footGap = (W, H) => H > 1600 ? 320 : 100
  function handle(ctx, s, W, H, fg, align) {
    if (!s.handle) return
    setFont(ctx, F.body, 26, 400)
    ctx.fillStyle = fg
    const t = '@deewoodward', y = H - footGap(W, H) + 10
    if (align === 'centre') ctx.fillText(t, (W - ctx.measureText(t).width) / 2, y)
    else ctx.fillText(t, W * .137, y)
  }
  function number(ctx, s, i, W, H, fg) {
    if (!s.num) return
    setFont(ctx, F.body, 28, 700, .02)
    ctx.fillStyle = fg
    const t = WORDS[i] || String(i + 1)
    ctx.fillText(t, W - W * .1 - ctx.measureText(t).width, H > 1600 ? 250 : 130)
  }
  function arrow(ctx, x, y, col, kind, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
    ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (kind === 'line') {
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(52, 0); ctx.stroke()
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(56, 0); ctx.lineTo(42, -7); ctx.lineTo(42, 7); ctx.closePath(); ctx.fill()
    } else {
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(14, 24, 36, 28, 50, 16)
      ctx.bezierCurveTo(62, 6, 57, -8, 47, -4); ctx.bezierCurveTo(35, 1, 40, 24, 62, 24); ctx.bezierCurveTo(82, 24, 100, 16, 120, 8); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(104, -2); ctx.lineTo(121, 8); ctx.lineTo(107, 22); ctx.stroke()
    }
    ctx.restore()
  }
  function sticker(ctx, k, cx, cy, size, rot = 0) {
    const im = img(stickerSrc(k)); if (!im) return
    const s = size / Math.max(im.width, im.height)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * Math.PI / 180)
    if (k === 'cat') { // the cat has no white edge of its own
      for (let a = 0; a < 16; a++) ctx.drawImage(tint(im, '#FFFFFF'), -im.width * s / 2 + Math.cos(a / 16 * 6.283) * 8, -im.height * s / 2 + Math.sin(a / 16 * 6.283) * 8, im.width * s, im.height * s)
    }
    ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s)
    ctx.restore()
  }
  function cover(ctx, im, x, y, w, h, ax = .5, ay = .5) {
    const s = Math.max(w / im.width, h / im.height), iw = im.width * s, ih = im.height * s
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
    ctx.drawImage(im, x + (w - iw) * ax, y + (h - ih) * ay, iw, ih); ctx.restore()
  }
  function photoFor(s, cut) {
    if (s.upload) return { im: img(s.upload), cut: false }
    const p = photoById(s.photo) || photoById(st.photos[0]) || PHOTOS[0]
    if (cut && p.cutout) return { im: img(p.cutout), cut: true }
    return { im: img(p.src), cut: false }
  }
  function placeholder(ctx, x, y, w, h, msg) {
    ctx.fillStyle = 'rgba(12,12,12,.08)'; ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = 'rgba(12,12,12,.3)'; ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeRect(x + 20, y + 20, w - 40, h - 40); ctx.setLineDash([])
    setFont(ctx, F.body, 30, 700); ctx.fillStyle = 'rgba(12,12,12,.55)'; const tw = ctx.measureText(msg).width; ctx.fillText(msg, x + (w - tw) / 2, y + h / 2)
  }

  /* ---------- the slide renderer ---------- */
  function render(cv, s, i, n) {
    const [W, H] = SIZES[st.size] || SIZES['4:5']
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
    const ctx = cv.getContext('2d')
    ctx.textBaseline = 'alphabetic'; ctx.imageSmoothingQuality = 'high'
    const b = BGS[s.bg] || BGS.cream
    const fg = COL[b.fg], k = (s.size || 100) / 100
    const tall = H > 1600, sq = H === W
    const top = tall ? 260 : sq ? 110 : 150, bottom = H - (tall ? 360 : sq ? 150 : 190)
    const acc = s.accent && COL[s.accent] ? s.accent : b[s.hlStyle || 'block'][0]
    const head = (fam, extra = {}) => ({ fam, weight: fam === F.caps ? 800 : 400, ls: fam === F.serif ? -.035 : fam === F.caps ? -.01 : 0, lh: fam === F.serif ? .86 : fam === F.caps ? .9 : 1, asc: fam === F.caps ? .82 : .8, fg, hlStyle: s.hlStyle || 'block', accent: acc, bg: s.bg, ...extra })
    const upper = fam => fam === F.caps
    ctx.fillStyle = COL[s.bg] || COL.cream; ctx.fillRect(0, 0, W, H)
    const L = s.layout
    const sub = (y, x, w, align, col = fg, size = 32) => para(ctx, s.sub, { x, y, w, align, fg: col, size })
    const subH = (w, size = 32) => para(ctx, s.sub, { w, size }, true)
    const leadH = (w, size = 34) => para(ctx, s.lead, { w, size }, true)
    const lead = (y, x, w, align, col = fg, size = 34) => para(ctx, s.lead, { x, y, w, align, fg: col, size })

    // Generic stacked text: label, lead, headline, sub, arrow. Returns nothing.
    function stack(o) {
      const { x, w, align = 'left', fam = F.serif, yTop = top, yBot = bottom, maxS = 130, minS = 46, vAlign = .45, subW = Math.min(w, W * .5), onPhoto = false, col = fg } = o
      const toks = tokens(s.headline, upper(fam))
      const pc = pillColours(s.bg, onPhoto)
      const pH = s.label ? 26 * 1.6 + 30 : 0
      const lH = s.lead ? leadH(w) + 26 : 0
      const sH = s.sub ? subH(subW) + 34 : 0
      const aH = s.arrow ? 70 : 0
      const room = yBot - yTop - pH - lH - sH - aH
      const ctxH = head(fam, { fg: col })
      const Fh = fit(ctx, toks, fam, ctxH.weight, ctxH.ls, w, room, ctxH.lh, minS * k, maxS * k)
      const total = pH + lH + Fh.h + sH + aH
      let y = yTop + Math.max(0, (yBot - yTop - total) * vAlign)
      const cx = align === 'centre' ? x + w / 2 : x
      if (s.label) { pill(ctx, s.label, cx, y, { ...pc, align }); y += pH }
      if (s.lead) { lead(y, x, w, align, col); y += lH }
      drawHead(ctx, Fh, { ...ctxH, x, y, w, align })
      y += Fh.h
      if (s.sub) { y += 30; sub(y, align === 'centre' ? x + (w - subW) / 2 : x, subW, align, col); y += sH - 30 }
      if (s.arrow) arrow(ctx, align === 'centre' ? x + w / 2 - (o.arrowKind === 'line' ? 28 : 60) : x, y + 38, col, o.arrowKind || 'curl')
      return { y }
    }

    if (L === 'statement' || L === 'caps') {
      const fam = L === 'caps' ? F.caps : F.serif
      const centre = s.align === 'centre'
      const w = centre ? W * .76 : W * (fam === F.caps ? .72 : .64)
      const x = centre ? (W - w) / 2 : W * .13
      stack({ x, w, align: centre ? 'centre' : 'left', fam, maxS: fam === F.caps ? 116 : 128, arrowKind: s.bg === 'cream' ? 'line' : 'curl', subW: centre ? W * .6 : W * .46 })
      if (s.sticker) sticker(ctx, s.sticker, W * .8, H * .5, W * .26, 6)
      handle(ctx, s, W, H, fg); bd(ctx, s, W, H, 'right')
    } else if (L === 'statement-centre' || L === 'caps-centre') {
      const fam = L === 'caps-centre' ? F.caps : F.serif
      const w = W * (fam === F.caps ? .7 : .78), x = (W - w) / 2
      let yTop = top
      if (s.sticker) { sticker(ctx, s.sticker, W / 2, top + W * .12, W * .22); yTop = top + W * .25 }
      stack({ x, w, align: 'centre', fam, yTop, maxS: fam === F.caps ? 120 : 130, vAlign: s.sticker ? .3 : .5, subW: W * .5 })
      if (fam === F.caps) { bd(ctx, s, W, H, 'centre') } else { handle(ctx, s, W, H, fg); bd(ctx, s, W, H, 'right') }
    } else if (L === 'photo-side') {
      const { im } = photoFor(s)
      const px = W * .36
      if (im) {
        cover(ctx, im, px, 0, W - px, H, .5, .3)
        const g = ctx.createLinearGradient(px, 0, px + W * .2, 0); g.addColorStop(0, COL[s.bg]); g.addColorStop(1, COL[s.bg] + '00')
        ctx.fillStyle = g; ctx.fillRect(px - 1, 0, W * .2 + 1, H)
      }
      stack({ x: W * .088, w: W * .42, fam: F.serif, maxS: 150, subW: W * .4 })
      handle(ctx, s, W, H, fg); bd(ctx, s, W, H, 'right', true)
    } else if (L === 'cutout') {
      const { im, cut } = photoFor(s, true)
      const left = s.photoSide === 'left'
      if (im) {
        const h = H * (tall ? .5 : .64), w = h * im.width / im.height
        const x = left ? -w * .08 : W - w * .92, y = H - h
        if (cut) for (let a = 0; a < 24; a++) ctx.drawImage(tint(im, '#FFFFFF'), x + Math.cos(a / 24 * 6.283) * 12, y + Math.sin(a / 24 * 6.283) * 12, w, h)
        else { ctx.fillStyle = '#fff'; ctx.fillRect(x - 14, y - 14, w + 28, h + 28) }
        ctx.drawImage(im, x, y, w, h)
      }
      stack({ x: left ? W * .3 : W * .12, w: W * (left ? .6 : .56), align: left ? 'centre' : 'left', fam: F.serif, yBot: H * (tall ? .62 : .7), maxS: 130, vAlign: .35, subW: W * .44 })
      if (!left) handle(ctx, s, W, H, fg)
    } else if (L === 'photo-overlay') {
      const { im } = photoFor(s)
      if (im) cover(ctx, im, 0, 0, W, H, .5, .25)
      ctx.fillStyle = 'rgba(14,14,20,.5)'; ctx.fillRect(0, 0, W, H)
      const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(14,14,20,0)'); g.addColorStop(1, 'rgba(14,14,20,.45)'); ctx.fillStyle = g; ctx.fillRect(0, H * .45, W, H * .55)
      const centre = s.align === 'centre'
      const w = W * .78, x = centre ? (W - w) / 2 : W * .1
      stack({ x, w, align: centre ? 'centre' : 'left', fam: F.caps, yTop: H * (centre ? .3 : .42), yBot: H - (tall ? 380 : 230), maxS: 104, vAlign: centre ? .5 : 1, subW: centre ? W * .62 : W * .5, onPhoto: true, col: COL.cream })
      number(ctx, s, i, W, H, 'rgba(244,240,234,.85)'); bd(ctx, s, W, H, 'right', true)
    } else if (L === 'photo-top') {
      const ph = H * .5, { im } = photoFor(s)
      if (im) cover(ctx, im, 0, 0, W, ph, .5, .3); else placeholder(ctx, 0, 0, W, ph, 'Choose a photo')
      stack({ x: W * .085, w: W * .66, fam: F.serif, yTop: ph + 60, yBot: H - (tall ? 380 : 170), maxS: 120, vAlign: .2, subW: W * .5 })
      bd(ctx, s, W, H, 'right')
    } else if (L === 'shot') {
      const split = H * .5
      const r = stack({ x: W * .105, w: W * .7, fam: F.serif, yTop: tall ? 260 : 110, yBot: split - 50, maxS: 112, vAlign: .5, subW: W * .55 })
      const im = s.shot ? img(s.shot) : null
      if (im) cover(ctx, im, 0, split, W, H - split, .5, 0); else placeholder(ctx, 0, split, W, H - split, 'Upload a screenshot')
    } else if (L === 'phone') {
      stack({ x: W * .1, w: W * .48, fam: F.serif, maxS: 130, subW: W * .44 })
      const im = s.shot ? img(s.shot) : null
      const pw = W * .5, ph = pw * 2.05
      ctx.save(); ctx.translate(W * .84, H * .56); ctx.rotate(-11 * Math.PI / 180)
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18
      ctx.fillStyle = '#111'; rr(ctx, -pw / 2, -ph / 2, pw, ph, 78); ctx.fill(); ctx.shadowColor = 'transparent'
      ctx.fillStyle = '#F2F2F2'; rr(ctx, -pw / 2 + 16, -ph / 2 + 16, pw - 32, ph - 32, 62); ctx.fill()
      if (im) { ctx.save(); rr(ctx, -pw / 2 + 16, -ph / 2 + 16, pw - 32, ph - 32, 62); ctx.clip(); const sc = (pw - 32) / im.width; ctx.drawImage(im, -pw / 2 + 16, -ph / 2 + 16, pw - 32, im.height * sc); ctx.restore() }
      else { setFont(ctx, F.body, 26, 700); ctx.fillStyle = 'rgba(12,12,12,.5)'; const t = 'Upload a screenshot'; ctx.fillText(t, -ctx.measureText(t).width / 2, 0) }
      ctx.fillStyle = '#111'; rr(ctx, -pw * .2, -ph / 2 + 34, pw * .4, 46, 23); ctx.fill()
      ctx.restore()
      bd(ctx, s, W, H, 'left')
    } else if (L === 'doodle') {
      // wavy stripes bottom left, olive corner, stickers
      ctx.save(); ctx.translate(-40, H - (tall ? 520 : 330))
      for (let r = 0; r < 3; r++) {
        ctx.beginPath(); const off = r * 70
        ctx.moveTo(0, off); for (let x = 0; x <= 460; x += 10) ctx.lineTo(x, off + Math.sin(x / 70) * 34 + x * .45)
        ctx.strokeStyle = COL.cream; ctx.lineWidth = 46; ctx.stroke()
        ctx.setLineDash([10, 9]); ctx.strokeStyle = 'rgba(12,12,12,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([])
      }
      ctx.restore()
      ctx.fillStyle = COL.olive; ctx.beginPath(); ctx.ellipse(W + 40, H + 60, W * .36, H * .2, -.3, 0, 7); ctx.fill()
      stack({ x: W * .14, w: W * .72, align: 'centre', fam: F.round, maxS: 128, minS: 50, vAlign: .5, subW: W * .5 })
      if (s.sticker) sticker(ctx, s.sticker, W * .76, top + 40, W * .2, 8)
      const extra = s.sticker === 'hand' ? 'eye' : 'hand'
      sticker(ctx, extra, W * .8, H - (tall ? 470 : 230), W * .15, -6)
      handle(ctx, s, W, H, COL.cream, 'centre')
    } else if (L === 'cta') {
      const { im } = s.photo || s.upload ? photoFor(s) : { im: null }
      const onPhoto = !!im
      if (im) { cover(ctx, im, 0, 0, W, H, .5, .25); ctx.fillStyle = 'rgba(14,14,20,.55)'; ctx.fillRect(0, 0, W, H) }
      const col = onPhoto ? COL.cream : fg
      const w = W * .82, x = (W - w) / 2
      // headline, then pill, then sub
      const toks = tokens(s.headline, true)
      const hc = head(F.caps, { fg: col })
      const pH = s.label ? 26 * 1.6 : 0, sH = s.sub ? para(ctx, s.sub, { w: W * .62, size: 30 }, true) : 0
      const Fh = fit(ctx, toks, F.caps, 800, -.01, w, bottom - top - pH - sH - 120, .9, 46 * k, 118 * k)
      let y = top + (bottom - top - (Fh.h + pH + sH + 100)) / 2
      if (s.lead) { lead(y - 70, x, w, 'centre', col) }
      drawHead(ctx, Fh, { ...hc, x, y, w, align: 'centre' }); y += Fh.h + 40
      if (s.label) { pill(ctx, s.label, W / 2, y, { ...pillColours(s.bg, onPhoto), align: 'centre' }); y += pH + 40 }
      if (s.sub) para(ctx, s.sub, { x: W * .19, y, w: W * .62, align: 'centre', fg: col, size: 30 })
      number(ctx, s, i, W, H, onPhoto ? 'rgba(244,240,234,.85)' : fg)
      bd(ctx, s, W, H, 'right', onPhoto)
    }
    return cv
  }

  /* ---------- state helpers ---------- */
  function defaults(s, i, n) {
    const bg = s.bg && BGS[s.bg] ? s.bg : 'cream'
    const out = {
      layout: 'statement', bg, lead: '', headline: '', sub: '', label: '', hlStyle: 'block', accent: '', sticker: '', photo: '', upload: '', shot: '', align: 'left', size: 100, photoSide: 'right',
      bd: true, handle: false, num: false, arrow: false, ...s,
    }
    if (!s.hasOwnProperty('handle')) out.handle = ['statement', 'statement-centre', 'caps', 'cutout', 'doodle'].includes(out.layout) && i > 0
    if (!s.hasOwnProperty('num')) out.num = out.layout === 'photo-overlay' && n > 1
    if (!s.hasOwnProperty('arrow')) out.arrow = n > 1 && i === 0 && !['phone', 'shot', 'photo-top', 'doodle', 'cta', 'caps-centre'].includes(out.layout)
    if (BG_FOR[out.layout] && !BG_FOR[out.layout].includes(out.bg)) out.bg = BG_FOR[out.layout][0]
    if (out.hlStyle === 'pill' && !['orange', 'cream', 'lime', 'peri'].includes(out.bg)) out.hlStyle = 'colour'
    if (out.hlStyle === 'block' && ['olive', 'black', 'navy'].includes(out.bg)) out.hlStyle = 'colour'
    if (PHOTO_LAYOUTS.includes(out.layout) && !out.photo && !out.upload) out.photo = st.photos[i % Math.max(1, st.photos.length)] || 'dee-06'
    if (out.layout === 'cutout' && out.photo && !(photoById(out.photo) || {}).cut) out.photo = (PHOTOS.find(p => p.cut && st.photos.includes(p.id)) || PHOTOS.find(p => p.cut)).id
    return out
  }
  // Dee's own words: "Slide 1: ..." blocks, or one paragraph per slide.
  function parseManual(text, count) {
    let chunks = text.split(/^\s*slide\s*\d+\s*[:.)\-–]\s*/im)
    if (chunks.length > 1) chunks = chunks.slice(1); else chunks = text.split(/\n\s*\n/)
    chunks = chunks.map(c => c.trim()).filter(Boolean).slice(0, 10)
    const seq = [['statement', 'cream', 'block'], ['statement-centre', 'orange', 'colour'], ['photo-overlay', 'navy', 'colour'], ['statement', 'lime', 'block'], ['caps', 'peri', 'colour'], ['photo-overlay', 'navy', 'colour'], ['statement', 'cream', 'block'], ['caps-centre', 'olive', 'colour'], ['statement-centre', 'orange', 'pill']]
    return chunks.map((c, i) => {
      const s = {}
      const lines = c.split('\n').map(l => l.trim()).filter(Boolean)
      const rest = []
      lines.forEach(l => {
        const m = l.match(/^(lead|above|sub|under|label|pill|layout|bg|background)\s*:\s*(.*)$/i)
        if (m) { const key = m[1].toLowerCase(); const v = m[2].trim(); if (key === 'lead' || key === 'above') s.lead = v; else if (key === 'sub' || key === 'under') s.sub = v; else if (key === 'label' || key === 'pill') s.label = v; else if (key === 'layout') s.layout = v; else s.bg = v.toLowerCase() }
        else rest.push(l)
      })
      s.headline = rest[0] || ''
      if (!s.sub && rest.length > 1) s.sub = rest.slice(1).join(' ')
      const last = i === chunks.length - 1 && chunks.length > 2
      const [lay, bg, hl] = last ? ['cta', 'black', 'colour'] : seq[i % seq.length]
      if (!s.layout || !LAYOUTS.some(([k]) => k === s.layout)) s.layout = lay
      if (!s.bg || !BGS[s.bg]) s.bg = bg
      s.hlStyle = s.layout === lay ? hl : (['cream', 'lime'].includes(s.bg) ? 'block' : 'colour')
      if (!st.photos.length && PHOTO_LAYOUTS.includes(s.layout)) { s.layout = 'statement'; s.bg = i % 2 ? 'orange' : 'cream'; s.hlStyle = i % 2 ? 'colour' : 'block' }
      return s
    })
  }

  function setSlides(arr) {
    const n = arr.length
    st.slides = arr.map((s, i) => defaults(s, i, n))
    st.cur = 0
    save(); buildStrip(); openEditor()
  }

  /* ---------- brief form ---------- */
  function seg(box, opts, get, set) {
    box.innerHTML = ''
    opts.forEach(([v, label]) => box.append(el('button', { type: 'button', class: get() === v ? 'on' : '', onclick: () => { set(v); seg(box, opts, get, set) } }, label)))
  }
  function sizeNote() {
    $('#sizeNote').textContent = st.size === '9:16' ? 'Story and reel cover: text is kept clear of the top and bottom, where Instagram puts its buttons.' : st.size === '1:1' ? 'Square. Feed only.' : 'Feed portrait, 1080 by 1350. Best for carousels.'
  }
  seg($('#fFormat'), [['carousel', 'Carousel'], ['single', 'Single post'], ['story', 'Story / reel cover']], () => st.format, v => {
    st.format = v
    if (v === 'story') st.size = '9:16'; else if (st.size === '9:16') st.size = '4:5'
    seg($('#fSize'), SIZE_OPTS, () => st.size, setSize)
    $('#countField').hidden = v !== 'carousel'; sizeNote(); save()
  })
  const SIZE_OPTS = [['4:5', '4:5 post'], ['1:1', '1:1 square'], ['9:16', '9:16 story']]
  function setSize(v) { st.size = v; sizeNote(); save(); redrawAll() }
  seg($('#fSize'), SIZE_OPTS, () => st.size, setSize)
  $('#countField').hidden = st.format !== 'carousel'; sizeNote()
  for (let i = 2; i <= 10; i++) $('#fCount').append(el('option', { value: i }, i + ' slides'))
  $('#fCount').value = st.count || ''
  $('#fCount').onchange = e => { st.count = e.target.value; save() }
  $('#fText').value = st.text || ''; $('#fText').oninput = e => { st.text = e.target.value; save() }
  $('#fUrl').value = st.url || ''; $('#fUrl').oninput = e => { st.url = e.target.value.trim(); save() }
  function photoPick() {
    const box = $('#fPhotos'); box.innerHTML = ''
    PHOTOS.forEach(p => box.append(el('button', { type: 'button', class: st.photos.includes(p.id) ? 'on' : '', title: p.desc, 'aria-pressed': st.photos.includes(p.id), onclick: () => { st.photos = st.photos.includes(p.id) ? st.photos.filter(x => x !== p.id) : [...st.photos, p.id]; save(); photoPick() } }, el('img', { src: p.thumb, alt: p.desc, loading: 'lazy' }))))
  }
  photoPick()

  $('#goManual').onclick = () => {
    if (!st.text.trim()) { toast('Write what the slides should say first'); $('#fText').focus(); return }
    let arr = parseManual(st.text)
    if (st.format !== 'carousel') arr = arr.slice(0, 1)
    $('#readBox').hidden = true; st.read = null
    setSlides(arr)
    toast(arr.length + (arr.length === 1 ? ' slide' : ' slides') + ' made')
  }
  $('#goBlank').onclick = () => setSlides([{ layout: 'statement', bg: 'cream', headline: 'your headline, with *the point* highlighted', sub: 'A line underneath.' }])

  // Deia
  let deiaOk = false
  function status(kind, html) { const s = $('#aiStatus'); s.className = 'status ' + kind; s.innerHTML = '<i></i><span>' + html + '</span>' }
  async function checkDeia() {
    try {
      const r = await fetch(API, { credentials: 'include' })
      if (r.ok) { deiaOk = true; status('ok', 'Signed in to Deia. Writing and page reading are on.') }
      else if (r.status === 401) status('no', `Sign in to Deia to have her write the slides: <a href="${DEIA}/auth/login" target="_blank" rel="noopener">open Deia</a>, sign in, then come back and press the button again.`)
      else status('no', 'Signed in to Deia, but not as Dee. Writing is for Dee only.')
    } catch (e) {
      status('no', "Couldn't reach Deia's writer yet (it switches on once the Deia update is live). Your own words still work.")
    }
  }
  checkDeia()
  $('#goAI').onclick = async () => {
    if (!st.text.trim() && !st.url) { toast('Write a brief or add a link first'); $('#fText').focus(); return }
    if (!deiaOk) { await checkDeia(); if (!deiaOk) { toast('Sign in to Deia first'); return } }
    const btn = $('#goAI'); btn.disabled = true
    const words = ['Reading the brief…', st.url ? 'Reading the page…' : 'Finding the hook…', 'Writing the slides…', 'Picking layouts…']
    let w = 0; btn.textContent = words[0]; const t = setInterval(() => { w = (w + 1) % words.length; btn.textContent = words[w] }, 2600)
    try {
      const r = await fetch(API, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: st.text, url: st.url, count: st.format === 'carousel' && st.count ? Number(st.count) : null, format: st.format, size: st.size, photos: st.photos.map(id => ({ id, desc: (photoById(id) || {}).desc || '' })) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { toast(data.error === 'SIGN_IN' ? 'Sign in to Deia first' : (data.error || 'Something went wrong')); if (r.status === 401) { deiaOk = false; checkDeia() } return }
      st.read = { offer: data.offer, caption: data.caption, notes: data.notes, pageRead: data.pageRead, pageError: data.pageError, pageColours: data.pageColours || [], pageTitle: data.pageTitle || '', url: st.url }
      showRead()
      setSlides(data.slides || [])
      toast('Slides written. Change anything you like.')
    } catch (e) {
      toast("Couldn't reach Deia. Try again.")
    } finally { clearInterval(t); btn.disabled = false; btn.textContent = 'Write my slides with Deia' }
  }
  function showRead() {
    const r = st.read, box = $('#readBox')
    if (!r || (!r.offer && !r.caption && !r.notes && !r.pageError)) { box.hidden = true; return }
    box.hidden = false; box.innerHTML = ''
    if (r.pageError) box.append(el('p', {}, el('b', {}, "Couldn't read the page: "), r.pageError, ' The slides use your brief only.'))
    if (r.offer) {
      const o = r.offer
      const dots = el('span', { class: 'dots' }, ...(r.pageColours || []).slice(0, 8).map(h => el('i', { style: 'background:' + h, title: h })))
      box.append(el('h4', {}, 'What Deia read from the page'), el('p', {}, [o.name, o.price].filter(Boolean).join(' · ') || r.pageTitle, r.pageColours.length ? dots : ''))
      if (o.cta) box.append(el('p', {}, 'Call to action: ', o.cta, o.keyword ? ` (comment ${o.keyword})` : ''))
      if (o.points && o.points.length) box.append(el('ul', {}, ...o.points.map(p => el('li', {}, p))))
    }
    if (r.notes) box.append(el('p', { style: 'margin-top:8px' }, el('b', {}, 'Check: '), r.notes))
    if (r.caption) box.append(el('h4', { style: 'margin-top:14px' }, 'Caption'), el('div', { class: 'cap' }, r.caption), el('button', { class: 'btn sm ghost', type: 'button', style: 'margin-top:10px', onclick: () => window.BYD.copy(r.caption, 'the caption') }, 'Copy caption'))
  }

  /* ---------- strip + editor ---------- */
  const scratch = document.createElement('canvas')
  function thumb(i) {
    const btn = $('#strip').children[i]; if (!btn) return
    const c = btn.querySelector('canvas')
    render(scratch, st.slides[i], i, st.slides.length)
    c.width = 224; c.height = Math.round(224 * scratch.height / scratch.width)
    c.getContext('2d').drawImage(scratch, 0, 0, c.width, c.height)
  }
  function buildStrip() {
    const s = $('#strip'); s.innerHTML = ''
    const has = st.slides.length > 0
    s.hidden = !has; $('#editor').hidden = !has; $('#emptyState').hidden = has
    st.slides.forEach((_, i) => s.append(el('button', { type: 'button', class: 'th' + (i === st.cur ? ' on' : ''), 'aria-label': 'Slide ' + (i + 1), onclick: () => { st.cur = i; buildStrip(); openEditor() } }, el('canvas'), el('span', {}, i + 1))))
    if (has && st.slides.length < 10) s.append(el('button', { type: 'button', class: 'add', onclick: () => { const c = st.slides[st.cur]; st.slides.splice(st.cur + 1, 0, defaults({ layout: 'statement', bg: c.bg === 'cream' ? 'orange' : 'cream', headline: 'a new slide with *a point*' }, st.cur + 1, st.slides.length + 1)); st.cur++; save(); buildStrip(); openEditor() } }, '+ Add slide'))
    st.slides.forEach((_, i) => thumb(i))
  }
  function cur() { return st.slides[st.cur] }
  function draw() { if (!cur()) return; render($('#cv'), cur(), st.cur, st.slides.length); thumb(st.cur); save() }
  function redrawAll() { if (!st.slides.length) return; st.slides.forEach((_, i) => thumb(i)); render($('#cv'), cur(), st.cur, st.slides.length) }

  LAYOUTS.forEach(([k, n]) => $('#eLayout').append(el('option', { value: k }, n)))
  function chips(box, keys, get, set) {
    box.innerHTML = ''
    keys.forEach(k => box.append(el('button', { type: 'button', class: 'chip-btn' + (get() === k ? ' on' : ''), style: 'background:' + COL[k], title: NAMES[k] || k, 'aria-label': NAMES[k] || k, onclick: () => { set(k); chips(box, keys, get, set); draw() } })))
  }
  function openEditor() {
    const s = cur(); if (!s) return
    $('#eLayout').value = s.layout
    const bgs = BG_FOR[s.layout] || ALL_BG
    if (!bgs.includes(s.bg)) s.bg = bgs[0]
    chips($('#eBg'), s.layout === 'cta' || s.layout === 'phone' ? ALL_BG : bgs, () => s.bg, v => { s.bg = v; s.accent = ''; fixHl(s); openEditor() })
    $('#eHead').value = s.headline; $('#eLead').value = s.lead; $('#eSub').value = s.sub; $('#eLabel').value = s.label
    $('#eSize').value = s.size || 100
    seg($('#eHl'), [['block', 'Block'], ['colour', 'Coloured words'], ['pill', 'Black pill']], () => s.hlStyle, v => { s.hlStyle = v; s.accent = ''; openEditor() })
    const b = BGS[s.bg] || BGS.cream
    chips($('#eAcc'), b[s.hlStyle] || b.block, () => s.accent || (b[s.hlStyle] || b.block)[0], v => s.accent = v)
    seg($('#eAlign'), [['left', 'Left'], ['centre', 'Centre']], () => s.align, v => { s.align = v; draw() })
    const needsPhoto = PHOTO_LAYOUTS.includes(s.layout) || s.layout === 'cta'
    $('#ePhotoField').hidden = !needsPhoto
    $('#eShotField').hidden = !['shot', 'phone'].includes(s.layout)
    $('#shotName').textContent = s.shot ? 'Screenshot added' : ''
    const box = $('#ePhoto'); box.innerHTML = ''
    if (needsPhoto) {
      if (s.layout === 'cta') box.append(el('button', { type: 'button', class: !s.photo && !s.upload ? 'on' : '', onclick: () => { s.photo = ''; s.upload = ''; openEditor(); draw() } }, el('span', { class: 'none' }, 'NO PHOTO')))
      PHOTOS.filter(p => s.layout !== 'cutout' || p.cut).forEach(p => box.append(el('button', { type: 'button', class: s.photo === p.id && !s.upload ? 'on' : '', title: p.desc, onclick: () => { s.photo = p.id; s.upload = ''; openEditor(); draw() } }, el('img', { src: p.thumb, alt: p.desc, loading: 'lazy' }))))
      $('#photoSide').innerHTML = ''
      if (s.layout === 'cutout') $('#photoSide').append(el('div', { class: 'seg' }, ...[['right', 'Dee on the right'], ['left', 'Dee on the left']].map(([v, l]) => el('button', { type: 'button', class: s.photoSide === v ? 'on' : '', onclick: () => { s.photoSide = v; openEditor(); draw() } }, l))))
    }
    const sb = $('#eSticker'); sb.innerHTML = ''
    sb.append(el('button', { type: 'button', class: !s.sticker ? 'on' : '', onclick: () => { s.sticker = ''; openEditor(); draw() } }, el('span', { class: 'none' }, 'NONE')))
    STICKERS.forEach(([k, n]) => sb.append(el('button', { type: 'button', class: s.sticker === k ? 'on' : '', title: n, onclick: () => { s.sticker = k; openEditor(); draw() } }, el('img', { src: stickerSrc(k), alt: n }))))
    $('#tBd').checked = s.bd; $('#tHandle').checked = s.handle; $('#tNum').checked = s.num; $('#tArrow').checked = s.arrow
    draw()
  }
  function fixHl(s) {
    if (s.hlStyle === 'pill' && !['orange', 'cream', 'lime', 'peri'].includes(s.bg)) s.hlStyle = 'colour'
    if (s.hlStyle === 'block' && ['olive', 'black', 'navy'].includes(s.bg)) s.hlStyle = 'colour'
  }
  $('#eLayout').onchange = e => { const s = cur(); s.layout = e.target.value; const bgs = BG_FOR[s.layout]; if (bgs && !bgs.includes(s.bg)) s.bg = bgs[0]; if (PHOTO_LAYOUTS.includes(s.layout) && !s.photo && !s.upload) s.photo = st.photos[0] || 'dee-06'; if (s.layout === 'cutout' && !(photoById(s.photo) || {}).cut) s.photo = (PHOTOS.find(p => p.cut && st.photos.includes(p.id)) || PHOTOS.find(p => p.cut)).id; fixHl(s); s.accent = ''; openEditor() }
  $('#eHead').oninput = e => { cur().headline = e.target.value; draw() }
  $('#eLead').oninput = e => { cur().lead = e.target.value; draw() }
  $('#eSub').oninput = e => { cur().sub = e.target.value; draw() }
  $('#eLabel').oninput = e => { cur().label = e.target.value; draw() }
  $('#eSize').oninput = e => { cur().size = Number(e.target.value); draw() }
  ;[['tBd', 'bd'], ['tHandle', 'handle'], ['tNum', 'num'], ['tArrow', 'arrow']].forEach(([id, key]) => $('#' + id).onchange = e => { cur()[key] = e.target.checked; draw() })
  function readFile(input, cb) { const f = input.files && input.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { cb(r.result); input.value = '' }; r.readAsDataURL(f) }
  $('#eUp').onchange = e => readFile(e.target, d => { cur().upload = d; img(d); openEditor(); toast('Photo added. Uploaded photos aren\'t cut out, so cut-out slides frame them instead.') })
  $('#eShot').onchange = e => readFile(e.target, d => { cur().shot = d; img(d); openEditor() })
  $('#shuffle').onclick = () => {
    const s = cur(), bgs = BG_FOR[s.layout] || ALL_BG
    s.bg = bgs[(bgs.indexOf(s.bg) + 1) % bgs.length]; s.accent = ''; fixHl(s); openEditor()
  }
  $('#mvL').onclick = () => move(-1); $('#mvR').onclick = () => move(1)
  function move(d) { const i = st.cur, j = i + d; if (j < 0 || j >= st.slides.length) return; [st.slides[i], st.slides[j]] = [st.slides[j], st.slides[i]]; st.cur = j; save(); buildStrip(); openEditor() }
  $('#dup').onclick = () => { if (st.slides.length >= 10) { toast('Ten slides is the most a carousel takes'); return } st.slides.splice(st.cur + 1, 0, JSON.parse(JSON.stringify(cur()))); st.cur++; save(); buildStrip(); openEditor() }
  $('#del').onclick = () => { st.slides.splice(st.cur, 1); st.cur = Math.max(0, st.cur - 1); save(); buildStrip(); if (st.slides.length) openEditor() }

  /* ---------- downloads ---------- */
  const stamp = () => new Date().toISOString().slice(0, 10)
  const fname = i => `bydeesign-${stamp()}-${st.format === 'carousel' ? 'slide-' + String(i + 1).padStart(2, '0') : st.format}-${st.size.replace(':', 'x')}.png`
  const toBlob = c => new Promise(r => c.toBlob(r, 'image/png'))
  $('#dlOne').onclick = async () => { const c = document.createElement('canvas'); render(c, cur(), st.cur, st.slides.length); saveBlob(await toBlob(c), fname(st.cur)) }
  $('#dlAll').onclick = async () => {
    const files = []
    for (let i = 0; i < st.slides.length; i++) { const c = document.createElement('canvas'); render(c, st.slides[i], i, st.slides.length); files.push([fname(i), new Uint8Array(await (await toBlob(c)).arrayBuffer())]) }
    saveBlob(zip(files), `bydeesign-${stamp()}-${st.format}.zip`)
  }
  // Minimal ZIP (stored, no compression; PNGs are already compressed).
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
  const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }
  function zip(files) {
    const parts = [], central = []; let off = 0
    const enc = new TextEncoder()
    for (const [name, data] of files) {
      const nm = enc.encode(name), crc = crc32(data)
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true)
      parts.push(new Uint8Array(h.buffer), nm, data)
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true)
      central.push(new Uint8Array(c.buffer), nm)
      off += 30 + nm.length + data.length
    }
    const size = central.reduce((a, p) => a + p.length, 0)
    const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true)
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' })
  }

  /* ---------- saving (this browser only) ---------- */
  function save() { try { localStorage.setItem('byd-maker', JSON.stringify({ ...st, slides: st.slides.map(s => ({ ...s, upload: s.upload && s.upload.length < 300000 ? s.upload : '', shot: s.shot && s.shot.length < 600000 ? s.shot : '' })) })) } catch (e) { } }
  function load() { try { return JSON.parse(localStorage.getItem('byd-maker')) } catch (e) { return null } }

  /* ---------- go ---------- */
  const fontLoads = ['400 80px "BYD Serif"', '800 80px "BYD Caps"', '700 30px "BYD Body"', '400 30px "BYD Body"', '400 40px "BYD Round"'].map(f => document.fonts.load(f, 'Aa').catch(() => { }))
  Promise.all(fontLoads).then(() => { if (st.slides.length) { buildStrip(); openEditor(); showRead() } })
  window.BYD.render = render
})()
