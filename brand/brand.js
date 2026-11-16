/* ByDeesign brand guide: swatches, logo switchers and the asset grids.
   The post maker is in maker.js and reads window.BYD from here. */
(function () {
  const $ = (s, r = document) => r.querySelector(s)
  const el = (t, a = {}, ...kids) => {
    const n = document.createElement(t)
    for (const [k, v] of Object.entries(a)) {
      if (k === 'class') n.className = v
      else if (k === 'style') n.style.cssText = v
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
      else n.setAttribute(k, v)
    }
    kids.flat().forEach(k => n.append(k && k.nodeType ? k : document.createTextNode(k ?? '')))
    return n
  }
  const A = '/brand/assets/'

  // Colours. Hex codes from the Brand Quick Guide.
  const C = {
    black: { name: 'Black', hex: '#0C0C0C', role: 'Text on light colours, pills and the dark slides.' },
    cream: { name: 'Cream', hex: '#F4F0EA', role: 'The everyday background, and text on orange, olive and black.' },
    orange: { name: 'Orange', hex: '#D95E28', role: 'The loud one. Whole-slide backgrounds, never small text.' },
    lime: { name: 'Light lime', hex: '#E3E8A9', role: 'Highlight blocks on cream, coloured words on orange and olive, label pills on black.' },
    peri: { name: 'Light periwinkle', hex: '#B5C5EE', role: 'Highlight blocks on cream, coloured words on black, the BD asterisk.' },
    periD: { name: 'Periwinkle', hex: '#94AAD5', role: 'A deeper periwinkle for doodles, arrows and Deia details.' },
    olive: { name: 'Olive', hex: '#65623B', role: 'The eye in the logo, stickers, and the odd caps slide.' },
    limeD: { name: 'Lime', hex: '#B5C15B', role: 'Mira, and the eye on dark backgrounds.' },
  }
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16))
  const cmyk = h => { const [r, g, b] = rgb(h).map(v => v / 255); const k = 1 - Math.max(r, g, b); if (k >= 1) return [0, 0, 0, 100]; return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(v => Math.round(v * 100)) }
  const lum = h => { const c = rgb(h).map(v => v / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] }
  const ink = h => lum(h) > .3 ? C.black.hex : C.cream.hex

  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800) }
  async function copy(txt, label) { try { await navigator.clipboard.writeText(txt); toast('Copied ' + (label || txt)) } catch (e) { toast(txt) } }
  function saveBlob(blob, name) { const u = URL.createObjectURL(blob); const a = el('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Downloading ' + name) }
  window.BYD = { C, A, $, el, toast, copy, saveBlob, ink }

  // Swatches
  const sw = $('#swatches')
  for (const id in C) {
    const c = C[id], [r, g, b] = rgb(c.hex), cm = cmyk(c.hex)
    sw.append(el('div', { class: 'swt' },
      el('button', { class: 'swchip', type: 'button', style: `background:${c.hex};color:${ink(c.hex)}`, onclick: () => copy(c.hex, c.name + ' ' + c.hex), 'aria-label': `Copy ${c.name} ${c.hex}` }, el('em', {}, 'Tap to copy'), c.name),
      el('dl', {},
        el('dt', {}, 'HEX'), el('dd', { onclick: () => copy(c.hex) }, c.hex),
        el('dt', {}, 'RGB'), el('dd', { onclick: () => copy(`${r}, ${g}, ${b}`) }, `${r} ${g} ${b}`),
        el('dt', {}, 'CMYK'), el('dd', { onclick: () => copy(cm.join(', ')) }, cm.join(' '))),
      el('p', { class: 'role' }, c.role)))
  }

  // Pairings seen on the grid
  const pairs = [
    ['orange', 'cream', 'lime', 'colour', 'Now every idea goes straight into my ideas bank, and I come back to shape it when *I\'ve actually got the time.*', 'Orange, cream text, lime words'],
    ['cream', 'black', 'lime', 'block', 'whichever face your brand wears, you *decide how* much of your life goes on show.', 'Cream, black text, lime block'],
    ['cream', 'black', 'peri', 'block', 'your *invisible* price', 'Cream, black text, periwinkle block'],
    ['orange', 'cream', 'peri', 'pill', 'You keep the parts of your weird and wonderful that make the right people *feel seen.*', 'Orange, black pill, periwinkle words'],
    ['lime', 'black', 'peri', 'block', 'What would they say *about your brand* in a room you\'re not in?', 'Light lime, black text, periwinkle block'],
    ['peri', 'black', 'lime', 'colour', 'Your competitor can get the *same look from the same tool* before lunch.', 'Periwinkle, black text, lime words'],
    ['olive', 'cream', 'lime', 'colour', 'Most business problems are *identity problems in a different costume.*', 'Olive, cream text, lime words'],
    ['black', 'cream', 'peri', 'colour', 'If AI could rebuild your brand in ten minutes, *it was only ever a look.*', 'Black, cream text, periwinkle words'],
  ]
  const pg = $('#pairs')
  pairs.forEach(([bg, fg, ac, how, txt, cap]) => {
    const h = el('div', { class: 'h' })
    txt.split(/(\*[^*]+\*)/).forEach(part => {
      if (part.startsWith('*')) {
        const s = el('span', {}, part.slice(1, -1))
        if (how === 'block') s.style.background = C[ac].hex
        else if (how === 'colour') s.style.color = C[ac].hex
        else { s.style.background = C.black.hex; s.style.color = C[ac].hex }
        h.append(s)
      } else h.append(part)
    })
    const caps = bg === 'peri' || bg === 'olive' || bg === 'black'
    if (caps) { h.style.fontFamily = '"BYD Caps"'; h.style.fontWeight = 800; h.style.textTransform = 'uppercase'; h.style.fontSize = 'clamp(22px,2.2vw,30px)'; h.style.letterSpacing = '-.01em' }
    pg.append(el('div', {}, el('div', { class: 'pair', style: `background:${C[bg].hex};color:${C[fg].hex}` }, h), el('p', { class: 'pair-cap' }, cap)))
  })

  // Main logo stage
  const stages = [['cream', false], ['black', true], ['orange', false], ['lime', false], ['peri', false], ['olive', true]]
  function flipMain(id, dark) {
    $('#mainStage').style.background = C[id].hex
    $('#mainLogo').src = A + 'logos/bydeesign-logo' + (dark ? '-reversed' : '') + '.png'
    $('#mainFlips').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id))
  }
  stages.forEach(([id, dark]) => $('#mainFlips').append(el('button', { type: 'button', class: 'chip-btn' + (id === 'cream' ? ' on' : ''), 'data-id': id, style: `background:${C[id].hex}`, 'aria-label': 'Show on ' + C[id].name, onclick: () => flipMain(id, dark) })))

  // BD icon picker
  const bd = { letters: 'black', star: 'periwinkle', bg: 'cream' }
  const starHex = { lime: C.lime.hex, periwinkle: C.peri.hex, orange: C.orange.hex, olive: C.olive.hex, cream: C.cream.hex }
  function drawBd() {
    $('#bdImg').src = `${A}logos/bd-${bd.letters}-${bd.star}.png`
    $('#bdArt').style.background = bd.letters === 'black' ? (bd.star === 'periwinkle' ? C.orange.hex : C.cream.hex) : (bd.star === 'lime' ? C.olive.hex : C.black.hex)
    $('#bdLetters').innerHTML = ''; $('#bdStar').innerHTML = ''
    ;[['black', C.black.hex], ['cream', C.cream.hex]].forEach(([k, hex]) => $('#bdLetters').append(el('button', { type: 'button', class: 'chip-btn' + (bd.letters === k ? ' on' : ''), style: `background:${hex}`, 'aria-label': k + ' letters', onclick: () => { bd.letters = k; if (bd.star === k) bd.star = 'periwinkle'; drawBd() } })))
    Object.entries(starHex).forEach(([k, hex]) => { if (k === bd.letters) return; $('#bdStar').append(el('button', { type: 'button', class: 'chip-btn' + (bd.star === k ? ' on' : ''), style: `background:${hex}`, 'aria-label': k + ' asterisk', onclick: () => { bd.star = k; drawBd() } })) })
  }
  drawBd()
  $('#bdDl').onclick = () => { const a = el('a', { href: `${A}logos/bd-${bd.letters}-${bd.star}.png`, download: `bd-icon-${bd.letters}-${bd.star}.png` }); document.body.append(a); a.click(); a.remove() }

  // Stickers
  const STK = [['coffee-cup', 'Coffee cup'], ['bd-eye', 'BD + eye'], ['big-ideas', 'Big ideas'], ['mug', 'Mug'], ['hand', 'Snap'], ['books', 'Decode, Design, Direct'], ['eye', 'Eye'], ['headphones', 'Headphones'], ['laptop', 'Laptop'], ['lightbulb', 'Lightbulb'], ['notepad', 'Notepad'], ['phone', 'Phone'], ['plant', 'Plant'], ['cursor', 'Cursor'], ['swipe-arrow', 'Swipe arrow']]
  STK.forEach(([k, n]) => $('#stickerGrid').append(el('a', { class: 'stk', href: `${A}stickers/${k}.png`, download: `bydeesign-${k}.png`, title: 'Download ' + n }, el('img', { src: `${A}stickers/${k}.png`, alt: n, loading: 'lazy' }), el('span', {}, n))))
  $('#stickerGrid').append(el('a', { class: 'stk', href: `${A}logos/cat.png`, download: 'bydeesign-cat.png', style: 'background:var(--k)' }, el('img', { src: `${A}logos/cat.png`, alt: 'Cat', loading: 'lazy' }), el('span', { style: 'color:#ccc' }, 'Cat')))
  window.BYD.STICKERS = STK.filter(([k]) => k !== 'swipe-arrow').concat([['cat', 'Cat']])

  // Photos. desc is what Deia is told about each one.
  const PH = [
    ['dee-01', 'selfie, cream tee, holding laptop, golden light, green wall', 1],
    ['dee-02', 'from behind at the desk and monitor, orange hoodie, no face', 0],
    ['dee-03', 'selfie, cream tee, holding laptop, green wall, daylight', 1],
    ['dee-04', 'selfie, black Meat Loaf band tee, holding laptop', 1],
    ['dee-05', 'holding a laptop showing the Mira website, blue tee', 0],
    ['dee-06', 'standing, hands in pockets, blue tee, living room', 1],
    ['dee-07', 'standing, rust tee, golden light, living room', 1],
    ['dee-08', 'cream tee, hugging a closed laptop, smiling, hallway', 1],
    ['dee-09', 'white vest, leaning on the desk, green wall, olive tree', 1],
    ['dee-10', 'standing, black tee, golden light, living room', 1],
    ['dee-11', 'standing, rust tee, living room, daylight', 1],
    ['dee-12', 'cream tee, holding laptop, looking up to the side, hallway', 1],
    ['dee-13', 'yellow tee, leaning on the desk, green wall', 0],
    ['dee-14', 'selfie, cream tee, holding laptop (second take)', 1],
    ['dee-15', 'overhead, laptop, striped mug, notebook, cat on lap, no face', 0],
    ['dee-16', 'landscape, blue tee, chin on hand looking sideways, sofa (website photo)', 1],
    ['dee-17', 'standing, black tee with the cat logo, golden light', 1],
  ]
  window.BYD.PHOTOS = PH.map(([id, desc, cut]) => ({ id, desc, cut: !!cut, src: `${A}photos/${id}.jpg`, thumb: `${A}photos/thumbs/${id}.jpg`, cutout: cut ? `${A}cutouts/${id}.webp` : '' }))
  window.BYD.PHOTOS.forEach(p => $('#photoGrid').append(el('a', { class: 'ph', href: p.src, download: `bydeesign-${p.id}.jpg`, title: p.desc }, el('img', { src: p.thumb, alt: 'Dee: ' + p.desc, loading: 'lazy' }), p.cut ? el('i', {}, 'cut-out') : '')))

  // In use
  for (let i = 1; i <= 39; i++) {
    const n = String(i).padStart(2, '0')
    $('#postGrid').append(el('img', { src: `${A}posts/post-${n}.webp`, alt: 'ByDeesign Instagram post ' + i, loading: 'lazy' }))
  }
})()
