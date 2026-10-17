/*
 * LED4YOU Studio: "Text" and "My LEDs" editors.
 * Shared by the LED4YOU app (Bluetooth) and the /studio page on the lights (Wi-Fi).
 * The page supplies a transport object:
 *   send(obj)                          -> Promise   send a WLED JSON state command
 *   upload(name, bytes, action, prog)  -> Promise<boolean>   store a file on the lights
 *                                         (action 2 = load the My LEDs table and start the effect)
 *   info()                             -> { leds, mw, mh, mfx }   LED count, matrix size, My LEDs effect id
 *   loadTable()                        -> Promise<Uint8Array|null> current /myleds.bin (optional)
 *   status()                           -> Promise<{x, p}>  LED4YOU Extras status and saved presets [[id, name]]
 *   cfg(obj)                           -> Promise   change settings (same format as /json/cfg), the lights restart
 */
(function () {
	const MODES = [
		{ id: 0, name: 'Fixed' },
		{ id: 1, name: 'Blink' },
		{ id: 2, name: 'Breathe' },
		{ id: 3, name: 'Twinkle' },
		{ id: 4, name: 'Rainbow' }
	];
	const TEXT_FX = 122;      // WLED "Scrolling Text" effect
	const MAX_LEDS = 1024;    // matches the firmware table limit

	const h = (tag, attrs, ...kids) => {
		const e = document.createElement(tag);
		for (const k in attrs || {}) {
			if (k === 'class') e.className = attrs[k];
			else if (k.startsWith('on')) e[k] = attrs[k];
			else e.setAttribute(k, attrs[k]);
		}
		kids.flat().forEach(c => e.append(c && c.nodeType ? c : document.createTextNode(c ?? '')));
		return e;
	};
	// range sliders: --p drives the filled part of the track in both pages
	const track = el => { const f = () => el.style.setProperty('--p', (100 * (el.value - el.min) / (el.max - el.min)) + '%'); el.addEventListener('input', f); f(); return el; };
	const hexToRgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
	const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

	// ---------- Text ----------
	// a tiny 3x5 font, only used to draw the preview of the message in the page
	const F35 = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
		G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101',
		N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
		U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
		0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110',
		6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110', ' ': '000000000000000', '!': '010010010000010',
		'?': '110001010000010', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000', '-': '000000111000000', "'": '010010000000000',
		'+': '000010111010000', '/': '001001010100100', '#': '101111101111101', '♥': '000101111111010', '*': '101010101000000' };
	// accented letters and emoji: drawn by the LED4YOU text fonts (l4yf0..4.wbf, from the LED4YOU site), sent as Private Use Area characters
	const TXT_ACC = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';
	const TXT_EMO = [["❤", "6cffffff7e3c1800"], ["⭐", "101038fe7c386c44"], ["🎃", "107cfeaafeaa7c00"], ["👻", "3c7edbffffffb500"], ["💀", "7eff9999ff662a3c"], ["🦇", "0099dbffff5a0800"], ["🕷", "995a3cbd7ebd4281"], ["🌙", "3860c0c0c0603800"], ["🎄", "103810387cfe1038"], ["❄", "925438fe38549200"], ["⛄", "3828387c82827c00"], ["🎁", "6c10fe92fe92fe00"], ["🔔", "10387c7c7cfe1000"], ["🌟", "925438ee38549200"], ["😀", "7c82aa82aa927c00"], ["😉", "7c82ae82aa927c00"], ["😢", "7c82aaa292aa7c00"], ["🎂", "545400feaafefe00"], ["🎉", "89522074f8f2e000"], ["🐰", "48484878b4fc7800"], ["🥚", "3078fca8fcfc7800"], ["🍀", "6cfe7cfe6c101000"], ["🎵", "3c2424246cee4400"], ["⚡", "1c3870fc18304000"], ["🔥", "1032767effe7663c"], ["🍬", "01ba7c7c7c5d8000"], ["☀", "924438ba38449200"], ["♪", "1814101070f06000"], ["✓", "0002048850200000"]];
	const FONT_URL = 'https://coristinaa.github.io/led4you/fonts/';
	const toLights = m => {
		let out = '', special = false;
		for (const ch of m.replace(/\uFE0F/g, '').replace(/♥/g, '❤')) {
			let i = TXT_ACC.indexOf(ch);
			if (i < 0) { i = TXT_EMO.findIndex(e => e[0] === ch); if (i >= 0) i += TXT_ACC.length; }
			if (i >= 0) { out += String.fromCharCode(0xE000 + i); special = true; } else out += ch;
		}
		return { out, special };
	};
	// WLED's built-in fonts for Scrolling Text (custom2 0..255 picks font 0..4)
	const FONTS = [['Mini', 4, 6, 0], ['Small', 5, 8, 64], ['Normal', 6, 8, 128], ['Retro', 7, 9, 192], ['Tall', 5, 12, 255]];
	const DIRS = [['←', 'Left'], ['→', 'Right'], ['↑', 'Up'], ['↓', 'Down']];
	const CSTYLES = ['One colour', 'Two-colour fade', 'Rainbow', 'Rainbow letters'];

	const PVwh = hue => { hue = ((hue % 1) + 1) % 1 * 6; const i = Math.floor(hue), f = hue - i, q = 255 * (1 - f), u = 255 * f;
		return [[255, u, 0], [q, 255, 0], [0, 255, u], [0, q, 255], [u, 0, 255], [255, 0, q]][i]; };
	function textCard(t, toast) {
		const inf = t.info();
		const MW = inf.mw && inf.mh ? inf.mw : 32, MH = inf.mw && inf.mh ? inf.mh : 8;
		let o = { dir: 0, font: 2, cs: 0 };
		try { Object.assign(o, JSON.parse(localStorage.getItem('l4yText') || '{}')); } catch (e) {}
		const txt = h('input', { class: 'search', id: 'stText', type: 'text', maxlength: '60', placeholder: 'HAPPY HALLOWEEN' });
		if (o.msg) txt.value = o.msg;
		const col = h('input', { id: 'stTextCol', type: 'color', value: o.c1 || '#ff7a00', class: 'colbtn', 'aria-label': 'Text color' });
		const col2 = h('input', { id: 'stTextCol2', type: 'color', value: o.c2 || '#8b5cff', class: 'colbtn', 'aria-label': 'Second color' });
		const spd = track(h('input', { id: 'stTextSpd', type: 'range', min: '0', max: '255', value: String(o.sx ?? 128), 'aria-label': 'Speed' }));
		const trail = track(h('input', { id: 'stTextTrail', type: 'range', min: '0', max: '255', value: String(o.tr ?? 0), 'aria-label': 'Trail' }));
		const warn = h('div', { class: 'note warnline' }, 'Text needs a matrix. Set the matrix size in LED setup first.');
		warn.hidden = !!(inf.mw && inf.mh);
		let shown = false, again = 0;
		const segBtns = (list, key, label) => {
			const bs = list.map((x, i) => h('button', { type: 'button', class: 'seg' + (o[key] === i ? ' sel' : ''), onclick: () => { o[key] = i; bs.forEach((b, j) => b.classList.toggle('sel', j === i)); changed(); } }, label(x)));
			return h('div', { class: 'segs' }, bs);
		};
		const dirRow = segBtns(DIRS, 'dir', d => [d[0] + ' ', h('span', {}, d[1])]);
		const fontRow = segBtns(FONTS, 'font', f => f[0]);
		const csRow = segBtns(CSTYLES, 'cs', c => c);
		const col2Wrap = h('span', {}, col2);
		const seg = conv => {
			const v = o.dir >= 2, c1 = hexToRgb(col.value), c2 = hexToRgb(col2.value);
			const s = { fx: TEXT_FX, n: conv.out, sx: +spd.value, ix: 128, c1: +trail.value, c2: FONTS[o.font][3],
				// up and down: the text runs along the matrix turned on its side, with the letters turned back upright
				c3: v ? 8 : 16, tp: v, o3: o.dir === 1 || o.dir === 3, o2: conv.special,
				o1: o.cs === 1 || o.cs === 3, pal: o.cs >= 2 ? 11 : o.cs === 1 ? 0 : 2, col: [c1, [0, 0, 0], c2] };
			return s;
		};
		const remember = () => { try { localStorage.setItem('l4yText', JSON.stringify(Object.assign(o, { msg: txt.value, c1: col.value, c2: col2.value, sx: +spd.value, tr: +trail.value }))); } catch (e) {} };
		// the LED4YOU text fonts (with accents and emoji) go onto the lights the first time they are needed
		let fontsOk = false;
		const ensureFonts = async () => {
			if (fontsOk) return true;
			try { const st = await t.status(); if ((st.f | 0) >= 5) return (fontsOk = true); } catch (e) {}
			toast('Putting the emoji letters on the lights (only the first time)…');
			try {
				for (let i = 0; i < 5; i++) {
					const r = await fetch(FONT_URL + 'l4yf' + i + '.wbf', { cache: 'no-cache' });
					if (!r.ok) throw new Error('net');
					if (!await t.upload('l4yf' + i + '.wbf', new Uint8Array(await r.arrayBuffer()), 0)) throw new Error('up');
				}
				return (fontsOk = true);
			} catch (e) {
				toast(e.message === 'net' || e instanceof TypeError ? 'No internet: the emoji letters could not be downloaded.' : 'The lights did not take the emoji letters. Update the lights to the newest LED4YOU.');
				return false;
			}
		};
		const send = async quiet => {
			const s = txt.value.trim();
			if (!s) { quiet || toast('Type a message first.'); return; }
			remember();
			const conv = toLights(s);
			if (new TextEncoder().encode(conv.out).length > 64) { toast('Message too long for the lights. Use fewer emoji or accents.'); return; }
			if (conv.special && !await ensureFonts()) return;
			t.send({ on: true, seg: seg(conv), l4y: { cd: { on: false }, txv: o.dir >= 2 } })
				.then(() => { shown = true; quiet || toast('Showing your text.'); }).catch(() => quiet || toast('Could not send the text.'));
		};
		const insert = ch => {
			const a = txt.selectionStart ?? txt.value.length, b = txt.selectionEnd ?? a;
			txt.value = txt.value.slice(0, a) + ch + txt.value.slice(b);
			const p = a + ch.length; try { txt.setSelectionRange(p, p); } catch (e) {}
			changed();
		};
		const emoRow = h('div', { class: 'emos', 'data-notr': '' }, TXT_EMO.map(e => h('button', { type: 'button', class: 'emo', title: e[0], onclick: () => insert(e[0]) }, e[0])));
		// after the text is on, every change goes to the lights straight away
		const changed = () => { col2Wrap.hidden = o.cs !== 1; if (shown) { clearTimeout(again); again = setTimeout(() => send(true), 350); } };
		[col, col2, spd, trail].forEach(e => e.addEventListener('input', changed));
		txt.addEventListener('change', changed);

		// preview: the message moving over a matrix of the same size
		const cv = h('canvas', { class: 'txtpv', 'aria-hidden': 'true' });
		const pv = () => {
			if (!cv.isConnected && pv.seen) return;   // the card was closed: stop
			requestAnimationFrame(pv);
			if (!cv.isConnected || !cv.clientWidth) return;
			pv.seen = true;
			const now = performance.now();
			if (now - (pv.last || 0) < 50) return; pv.last = now;
			const w = cv.clientWidth || 320, cell = Math.max(3, Math.min(14, Math.floor(w / MW))), W = cell * MW, H = cell * MH;
			if (cv.width !== W * 2) { cv.width = W * 2; cv.height = H * 2; cv.style.height = H + 'px'; }
			const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
			const [, fw, fh] = FONTS[o.font], vert = o.dir >= 2;
			// glyphs of the message: letters from the tiny preview font, emoji from their own 8x8 pictures
			const gl = Array.from((txt.value.trim() || txt.placeholder).replace(/\uFE0F/g, '')).map(ch => {
				const e = TXT_EMO.find(x => x[0] === ch);
				if (e) { const n = Math.min(8, fh); return { w: n, px: (gx, gy) => (parseInt(e[1].substr(Math.floor((gy + (fh - n) / -2) * 8 / n) * 2, 2), 16) >> (7 - Math.floor(gx * 8 / n))) & 1, oy: Math.floor((fh - n) / 2) }; }
				const b = F35[ch.toUpperCase().normalize('NFD').charAt(0)] || F35['?'];
				return { w: fw - 1, px: (gx, gy) => b[Math.floor(gy * 5 / fh) * 3 + Math.floor(gx * 3 / (fw - 1))] === '1', oy: 0 };
			});
			const runLen = vert ? MH : MW, cross = vert ? MW : MH;   // along the movement / across it
			const size = g1 => vert ? fh : g1.w;
			const total = gl.reduce((a, g1) => a + size(g1) + 1, 0);
			const sp = 4 + (+spd.value) / 18, pos = Math.floor(now / 1000 * sp) % (total + runLen);
			const c1 = hexToRgb(col.value), c2 = hexToRgb(col2.value), hue = now / 4000;
			const lit = new Map(), fwd = o.dir === 0 || o.dir === 2;   // left / up: text comes in from the far side
			let at = fwd ? runLen - pos : pos - total;
			for (const g1 of gl) {
				const gh = vert ? g1.w : fh;
				const isE = g1.oy || g1.w !== fw - 1;
				for (let gy = 0; gy < fh; gy++) for (let gx = 0; gx < g1.w; gx++) {
					if (isE ? (gy < g1.oy || gy >= g1.oy + g1.w || !g1.px(gx, gy - g1.oy + (fh - g1.w) / 2)) : !g1.px(gx, gy)) continue;
					const along = at + (vert ? gy : gx), acr = Math.floor((cross - gh) / 2) + (vert ? gx : gy);
					const x = vert ? acr : along, y = vert ? along : acr;
					if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
					const f = gy / Math.max(1, fh - 1);
					lit.set(y * MW + x, o.cs === 0 ? c1 : o.cs === 1 ? [c1[0] + (c2[0] - c1[0]) * f, c1[1] + (c2[1] - c1[1]) * f, c1[2] + (c2[2] - c1[2]) * f]
						: o.cs === 2 ? PVwh(hue) : PVwh(hue + f * .6));
				}
				at += size(g1) + 1;
			}
			for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
				const c = lit.get(y * MW + x);
				g.fillStyle = c ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : '#151823';
				g.beginPath(); g.arc(x * cell + cell / 2, y * cell + cell / 2, cell * .4, 0, 6.283); g.fill();
			}
		};
		requestAnimationFrame(pv);
		col2Wrap.hidden = o.cs !== 1;
		return h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Text'),
			warn,
			h('label', { for: 'stText', class: 'lab' }, 'Message'),
			txt,
			h('details', { class: 'more emobox' }, h('summary', {}, 'Emoji'), emoRow,
				h('div', { class: 'note' }, 'Tap one to add it to the message. Letters with accents (á, ã, ç…) work too. The lights draw them in one colour, like the letters.')),
			h('div', { class: 'gridwrap' }, cv),
			h('div', { class: 'lab sp' }, 'Movement'), dirRow,
			h('div', { class: 'lab sp' }, 'Letters'), fontRow,
			h('div', { class: 'lab sp' }, 'Colours'), csRow,
			h('div', { class: 'rowc' }, col, col2Wrap, h('div', { class: 'grow' },
				h('div', { class: 'lbl' }, h('span', {}, 'Speed')), spd,
				h('div', { class: 'lbl' }, h('span', {}, 'Trail')), trail)),
			h('button', { class: 'btn primary', type: 'button', onclick: () => send(false) }, 'Show text'));
	}

	// ---------- My LEDs ----------
	function myLedsCards(t, toast) {
		const inf = t.info();
		const isMatrix = !!(inf.mw && inf.mh);
		const count = Math.max(1, Math.min(MAX_LEDS, isMatrix ? inf.mw * inf.mh : (inf.leds || 30)));
		const cols = isMatrix ? inf.mw : Math.min(10, count);
		const KEY = 'l4yMyLeds' + count;
		// one entry per LED: [r, g, b, mode, speed, phase]
		let leds = Array.from({ length: count }, () => [0, 0, 0, 0, 128, 0]);
		try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(s) && s.length === count) leds = s; } catch (e) {}
		const sel = new Set();
		const save = () => { try { localStorage.setItem(KEY, JSON.stringify(leds)); } catch (e) {} };

		const grid = h('div', { class: 'ledgrid', role: 'grid', 'aria-label': 'LEDs' });
		grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
		const cells = leds.map((l, i) => {
			const b = h('button', { type: 'button', class: 'led', title: 'LED ' + (i + 1), 'aria-label': 'LED ' + (i + 1) });
			b.dataset.i = i;
			if (!isMatrix) b.textContent = i + 1;
			b.onclick = () => { if (tool !== 'select') return; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('on', sel.has(i)); updSel(); };
			grid.append(b); return b;
		});
		const selInfo = h('span', {}, 'No LEDs selected');
		const edTitle = h('div', { class: 'ct' }, 'Selected LEDs');
		let selRow;
		const updSel = () => {
			selInfo.textContent = sel.size ? sel.size + ' selected' : 'No LEDs selected';
			applyBtn.disabled = !sel.size;
			// one LED selected: show its current settings in the editor
			if (sel.size === 1) { const l = leds[[...sel][0]]; col.value = rgbToHex(l[0], l[1], l[2]); setMode(l[3]); spd.value = l[4]; spd.dispatchEvent(new Event('input')); }
		};
		const selectAll = () => { cells.forEach((c, i) => { sel.add(i); c.classList.add('on'); }); updSel(); };
		const selectNone = () => { sel.clear(); cells.forEach(c => c.classList.remove('on')); updSel(); };
		selRow = h('div', { class: 'row' },
			h('button', { class: 'btn', type: 'button', onclick: selectAll }, 'Select all'),
			h('button', { class: 'btn', type: 'button', onclick: selectNone }, 'Clear selection'),
			selInfo);

		// editor for the selected LEDs
		const col = h('input', { id: 'stLedCol', type: 'color', value: '#ff2e93', class: 'colbtn', 'aria-label': 'LED color' });
		let mode = 0;
		const setMode = id => { mode = id; modeBtns.forEach((b, j) => b.classList.toggle('sel', j === id)); };
		const modeBtns = MODES.map(m => h('button', { type: 'button', class: 'seg' + (m.id === 0 ? ' sel' : ''), onclick: () => setMode(m.id) }, m.name));
		const spd = track(h('input', { id: 'stLedSpd', type: 'range', min: '0', max: '255', value: '128', 'aria-label': 'Speed' }));
		const wave = h('input', { id: 'stWave', type: 'checkbox' });
		const applyBtn = h('button', { class: 'btn primary', type: 'button', disabled: '' }, 'Apply to selected');
		applyBtn.onclick = () => {
			const c = hexToRgb(col.value), idx = [...sel].sort((a, b) => a - b);
			idx.forEach((i, k) => { leds[i] = [c[0], c[1], c[2], mode, +spd.value, wave.checked ? Math.round(k * 256 / idx.length) & 255 : 0]; });
			save(); selectNone();   // start the next selection from scratch
			toast('Applied to ' + idx.length + (idx.length === 1 ? ' LED' : ' LEDs') + '. Select others or tap "Send to lights".');
		};

		// ---- drawing: drag over the grid to paint with the colour and behaviour chosen below ----
		let tool = 'select', brush = 1, drawing = false, liveReady = false, flushTimer = 0;
		const pending = new Map();
		const hex = l => l.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('');
		const flush = () => {
			flushTimer = 0;
			if (!pending.size) return;
			let pairs = [];
			if (!liveReady) { liveReady = true; leds.forEach((l, i) => pairs.push(i, hex(l))); pending.clear(); }   // first stroke: show the whole design
			else { pending.forEach((v, i) => pairs.push(i, v)); pending.clear(); }
			// small messages: they also travel over Bluetooth
			for (let k = 0; k < pairs.length; k += 120) t.send({ on: true, seg: { i: pairs.slice(k, k + 120) } }).catch(() => {});
		};
		const paintOne = i => {
			if (i < 0 || i >= count) return;
			const c = hexToRgb(col.value);
			const v = tool === 'erase' ? [0, 0, 0, 0, 128, 0] : [c[0], c[1], c[2], mode, +spd.value, 0];
			if (leds[i].every((x, k) => x === v[k])) return;
			leds[i] = v; pending.set(i, hex(v));
		};
		// fast swipes skip cells between two touch events: walk the line between them
		let lastPt = null;
		const paintAt = e => {
			const pt = { x: e.clientX, y: e.clientY };
			if (lastPt) {
				const d = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y), stepPx = Math.max(4, (cells[0].offsetWidth || 20) / 2);
				for (let k = 1, n = Math.floor(d / stepPx); k < n; k++) paintPoint(lastPt.x + (pt.x - lastPt.x) * k / n, lastPt.y + (pt.y - lastPt.y) * k / n);
			}
			lastPt = pt;
			paintPoint(pt.x, pt.y);
			if (!flushTimer) flushTimer = setTimeout(flush, 120);
		};
		const paintPoint = (cx, cy) => {
			const el = document.elementFromPoint(cx, cy);
			if (!el || !el.dataset || el.dataset.i === undefined || !grid.contains(el)) return;
			const i = +el.dataset.i;
			if (!isMatrix || brush === 1) paintOne(i);
			else {
				const x0 = i % cols - (brush >> 1), y0 = Math.floor(i / cols) - (brush >> 1), rows = Math.ceil(count / cols);
				for (let y = y0; y < y0 + brush; y++) for (let x = x0; x < x0 + brush; x++) if (x >= 0 && x < cols && y >= 0 && y < rows) paintOne(y * cols + x);
			}
		};
		grid.addEventListener('pointerdown', e => {
			if (tool === 'select') return;
			e.preventDefault(); drawing = true; lastPt = null;
			try { grid.setPointerCapture(e.pointerId); } catch (er) {}
			paintAt(e);
		});
		grid.addEventListener('pointermove', e => { if (drawing) paintAt(e); });
		// after a stroke, store the design on the lights by itself, so blink, breathe, twinkle and rainbow run there too
		let autoTimer = 0;
		const stopDraw = () => {
			if (!drawing) return;
			drawing = false; save(); clearTimeout(flushTimer); flush();
			clearTimeout(autoTimer);
			autoTimer = setTimeout(() => sendTable(true), 1200);
		};
		grid.addEventListener('pointerup', stopDraw);
		grid.addEventListener('pointercancel', stopDraw);
		const toolBtns = [['select', 'Select'], ['draw', 'Draw'], ['erase', 'Erase']].map(([id, name]) => h('button', { type: 'button', class: 'seg' + (id === 'select' ? ' sel' : ''), onclick: () => setTool(id) }, name));
		const brushBtns = [1, 2, 3].map(n => h('button', { type: 'button', class: 'seg' + (n === 1 ? ' sel' : ''), onclick: () => { brush = n; brushBtns.forEach((b, j) => b.classList.toggle('sel', j + 1 === n)); } }, n + '×' + n));
		const brushRow = h('div', { class: 'row' }, h('span', { class: 'note' }, 'Brush'), h('div', { class: 'segs' }, brushBtns));
		brushRow.hidden = true;
		const hint = h('div', { class: 'note' }, 'Tap LEDs to select them, then pick a color and how they behave.');
		const setTool = id => {
			tool = id;
			toolBtns.forEach(b => b.classList.toggle('sel', b.textContent.toLowerCase() === id));
			grid.classList.toggle('drawing', id !== 'select');
			brushRow.hidden = !isMatrix || id === 'select';
			selRow.hidden = id !== 'select';
			applyBtn.hidden = id !== 'select';
			edTitle.textContent = id === 'select' ? 'Selected LEDs' : id === 'draw' ? 'Paint with' : 'Eraser';
			hint.textContent = id === 'select' ? 'Tap LEDs to select them, then pick a color and how they behave.'
				: id === 'draw' ? 'Drag your finger over the LEDs to paint. The lights follow as you draw.'
				: 'Drag over LEDs to switch them off.';
			if (id !== 'select') selectNone();
		};

		// live preview: same maths as the firmware effect
		const fade = (c, a) => c.map(v => Math.round(v * a / 255));
		const sin8 = p => Math.round(128 + 127 * Math.sin((p / 256) * 2 * Math.PI));
		const hsv = p => { const s = p / 256 * 6, i = Math.floor(s), f = s - i, q = 255 * (1 - f), u = 255 * f; return [[255, u, 0], [q, 255, 0], [0, 255, u], [0, q, 255], [u, 0, 255], [255, 0, q]][i % 6].map(Math.round); };
		const hash = x => { x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16; return x >>> 0; };
		let raf = 0;
		const frame = now => {
			leds.forEach((l, i) => {
				let c = [l[0], l[1], l[2]];
				let period = Math.max(60, 3000 - l[4] * 11);
				const tt = now + l[5] * period / 256, pos = Math.floor((tt % period) * 256 / period);
				if (l[3] === 1) { if (pos >= 128) c = [0, 0, 0]; }
				else if (l[3] === 2) c = fade(c, 16 + (sin8((pos - 64) & 255) * 239 >> 8));
				else if (l[3] === 3) c = (hash(i * 7919 + Math.floor(tt / period)) & 1) ? fade(c, 70 + ((185 * (pos < 128 ? pos * 2 : (255 - pos) * 2)) >> 8)) : fade(c, 70);
				else if (l[3] === 4) c = hsv((pos + l[5]) & 255);
				cells[i].style.background = 'rgb(' + c.join(',') + ')';
			});
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);

		const toBin = () => {
			const b = new Uint8Array(6 + count * 6);
			b.set([76, 52, 89, 1, count & 255, count >> 8]);
			leds.forEach((l, i) => b.set(l, 6 + i * 6));
			return b;
		};
		const prog = h('div', { class: 'note' });
		const sendBtn = h('button', { class: 'btn primary', type: 'button' }, 'Send to lights');
		let sending = false;
		const sendTable = async quiet => {
			if (sending) return;
			sending = true; sendBtn.disabled = true; prog.textContent = 'Sending…';
			try {
				const ok = await t.upload('myleds.bin', toBin(), 2, p => { prog.textContent = 'Sending… ' + Math.round(p * 100) + '%'; });
				prog.textContent = ok ? (quiet ? 'Saved on the lights. Keep drawing or pick another behaviour.' : 'Done. Your design is playing and stays saved on the lights.') : 'The lights did not accept the design. Try again.';
				liveReady = false;
			} catch (e) { prog.textContent = 'Could not send. Move closer and try again.'; }
			sending = false; sendBtn.disabled = false;
		};
		sendBtn.onclick = () => sendTable(false);
		const clearAll = () => { leds = leds.map(() => [0, 0, 0, 0, 128, 0]); save(); liveReady = false; toast('All LEDs set to off. Tap "Send to lights" to keep it.'); };

		// start from the design stored on the lights when the page can read it (Wi-Fi)
		if (t.loadTable) t.loadTable().then(b => {
			if (!b || b.length < 6 || b[0] !== 76 || b[1] !== 52 || b[2] !== 89) return;
			const n = Math.min(count, b[4] | (b[5] << 8));
			for (let i = 0; i < n; i++) leds[i] = Array.from(b.slice(6 + i * 6, 12 + i * 6));
		}).catch(() => {});

		return [
			h('section', { class: 'card' },
				h('div', { class: 'ct' }, 'My LEDs ', h('span', {}, count + (isMatrix ? ' (' + inf.mw + '×' + inf.mh + ')' : ' LEDs'))),
				h('div', { class: 'segs tools' }, toolBtns),
				hint,
				brushRow,
				h('div', { class: 'gridwrap' }, grid),
				selRow),
			h('section', { class: 'card' },
				edTitle,
				h('div', { class: 'rowc' }, col, h('div', { class: 'segs' }, modeBtns)),
				h('div', { class: 'lbl' }, h('span', {}, 'Speed'), h('span', {}, 'slow → fast')), spd,
				h('label', { class: 'chk' }, wave, ' Wave: stagger the timing along the selection'),
				applyBtn),
			h('section', { class: 'card' },
				h('div', { class: 'row' }, sendBtn, h('button', { class: 'btn', type: 'button', onclick: clearAll }, 'Turn all off')),
				prog)
		];
	}

	// ---------- Mini previews: a small animated strip that imitates what an effect looks like ----------
	const PV = (() => {
		const hsh = x => { x = (x | 0) ^ 0x9e3779b9; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
		let curPal = null;   // colour stops of the palette picked in the app: colourful effects then use it, like on the lights
		const palAt = (st, x) => { x = ((x % 1) + 1) % 1 * 255; for (let i = 4; i < st.length; i += 4) if (x <= st[i]) { const a = i - 4, k = (x - st[a]) / Math.max(1, st[i] - st[a]);
			return [st[a + 1] + (st[i + 1] - st[a + 1]) * k, st[a + 2] + (st[i + 2] - st[a + 2]) * k, st[a + 3] + (st[i + 3] - st[a + 3]) * k]; } return [st[st.length - 3], st[st.length - 2], st[st.length - 1]]; };
		const wh = hue => curPal ? palAt(curPal, hue) : wh0(hue);
		const wh0 = hue => { hue = ((hue % 1) + 1) % 1 * 6; const i = Math.floor(hue), f = hue - i, q = 255 * (1 - f), u = 255 * f;
			return [[255, u, 0], [q, 255, 0], [0, 255, u], [0, q, 255], [u, 0, 255], [255, 0, q]][i]; };
		const sc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
		const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
		const add = (a, b) => [Math.min(255, a[0] + b[0]), Math.min(255, a[1] + b[1]), Math.min(255, a[2] + b[2])];
		const W = [255, 255, 255], K = [0, 0, 0];
		const heat = v => v < .33 ? [v * 3 * 255, 0, 0] : v < .66 ? [255, (v - .33) * 3 * 200, 0] : [255, 200, (v - .66) * 3 * 200];
		const sn = (x, t) => .5 + .5 * Math.sin(x + t);
		const noise = (x, t) => (sn(x * .9, t * 1.3) + sn(x * .37, -t * .7) + sn(x * 1.7, t * .4)) / 3;
		const tw = (i, t, rate, dur) => { const b = Math.floor(t * rate + hsh(i * 31) * 9), p = t * rate + hsh(i * 31) * 9 - b; return hsh(i * 7 + b * 131) < dur ? Math.sin(p * Math.PI) : 0; };
		const bounce = (t, n) => { const p = (t % 2) / 2, x = p < .5 ? p * 2 : 2 - p * 2; return x * (n - 1); };
		const dot = (i, x, w) => Math.max(0, 1 - Math.abs(i - x) / w);
		// each sim returns the colour of LED i (0..n-1) at time t (seconds); C = [primary, background, third]
		const S = {
			solid: (i, n, t, C) => C[0],
			blink: (i, n, t, C) => (t * 2 % 1) < .5 ? C[0] : C[1],
			breathe: (i, n, t, C) => mix(C[1], C[0], .15 + .85 * sn(0, t * 2.2) ** 2),
			wipe: (i, n, t, C) => { const p = t * .6 % 2, a = p < 1; return i / n < (p % 1) ? (a ? C[0] : C[1]) : (a ? C[1] : C[0]); },
			sweep: (i, n, t, C) => { const p = t * .6 % 2, x = p < 1 ? p : 2 - p; return i / n < x ? C[0] : C[1]; },
			randcol: (i, n, t) => wh(hsh(Math.floor(t * .7))),
			dynamic: (i, n, t) => wh(hsh(i * 13 + Math.floor(t * 1.5))),
			colorloop: (i, n, t) => wh(t * .15),
			rainbow: (i, n, t) => wh(i / n - t * .25),
			scan: (i, n, t, C) => mix(C[1], C[0], dot(i, bounce(t * .8, n), 1.2)),
			scan2: (i, n, t, C) => { const x = bounce(t * .8, n); return mix(C[1], C[0], Math.max(dot(i, x, 1.2), dot(i, n - 1 - x, 1.2))); },
			larson: (i, n, t, C) => { const p = t * .7 % 2, x = (p < 1 ? p : 2 - p) * (n - 1), back = p < 1 ? i < x : i > x; return mix(C[1], C[0], Math.max(dot(i, x, 1), back ? Math.max(0, 1 - Math.abs(i - x) / 5) * .6 : 0)); },
			fade: (i, n, t, C) => mix(C[1], C[0], sn(0, t * 1.5)),
			theater: (i, n, t, C) => (i + Math.floor(t * 6)) % 3 === 0 ? C[0] : C[1],
			theaterRb: (i, n, t) => (i + Math.floor(t * 6)) % 3 === 0 ? wh(i / n + t * .1) : K,
			running: (i, n, t, C) => mix(C[1], C[0], sn(i * .9, -t * 5) ** 2),
			saw: (i, n, t, C) => mix(C[1], C[0], ((i - t * 6) / 5 % 1 + 1) % 1),
			twinkle: (i, n, t, C) => mix(C[1], C[0], tw(i, t, 1.2, .45)),
			dissolve: (i, n, t, C) => { const ph = Math.floor(t / 2), k = (t % 2) / 2; return hsh(i * 17 + ph) < k ? (ph & 1 ? C[1] : C[0]) : (ph & 1 ? C[0] : C[1]); },
			sparkle: (i, n, t, C) => hsh(i * 11 + Math.floor(t * 18)) < .06 ? W : C[1],
			sparkleDark: (i, n, t, C) => hsh(i * 11 + Math.floor(t * 18)) < .08 ? K : C[0],
			sparklePlus: (i, n, t, C) => hsh(i * 11 + Math.floor(t * 18)) < .15 ? W : C[0],
			strobe: (i, n, t, C) => (t * 3 % 1) < .12 ? C[0] : C[1],
			strobeRb: (i, n, t) => (t * 3 % 1) < .12 ? wh(t * .2) : K,
			chase: (i, n, t, C) => { const x = (t * 8) % (n + 6); return i > x - 6 && i <= x ? C[0] : C[1]; },
			chaseRb: (i, n, t) => { const x = (t * 8) % (n + 6); return i > x - 6 && i <= x ? wh(i / n) : sc(wh(i / n + .5), .25); },
			chaseFlash: (i, n, t, C) => { const x = Math.floor(t * 10) % n; return Math.abs(i - x) < 2 ? W : C[0]; },
			comet: (i, n, t, C) => { const x = (t * 9) % (n + 8), d = x - i; return d >= 0 && d < 8 ? sc(C[0], 1 - d / 8) : C[1]; },
			multiComet: (i, n, t, C) => { let v = 0; for (let k = 0; k < 3; k++) { const d = ((t * (6 + k * 2) + k * 9) % (n + 6)) - i; if (d >= 0 && d < 5) v = Math.max(v, 1 - d / 5); } return mix(C[1], C[0], v); },
			fireworks: (i, n, t, C) => { let c = C[1]; for (let k = 0; k < 2; k++) { const b = Math.floor(t * 1.4 + k * .5), p = t * 1.4 + k * .5 - b, x = hsh(b * 7 + k) * n, r = p * 5;
				const v = Math.max(0, 1 - Math.abs(Math.abs(i - x) - r) / 1.3) * (1 - p); c = add(c, sc(wh(hsh(b * 3 + k)), v)); } return c; },
			rain: (i, n, t, C) => { let v = 0; for (let k = 0; k < 3; k++) { const d = ((t * 7 + k * n / 3) % (n + 4)) - i; if (d >= 0 && d < 4) v = Math.max(v, 1 - d / 4); } return mix(C[1], C[0], v); },
			fire: (i, n, t) => { const y = i / n; return heat(Math.max(0, Math.min(1, (1 - y) * 1.15 * (.55 + .6 * noise(i * 1.6, t * 7)) - .05))); },
			flicker: (i, n, t, C) => sc(C[0], .45 + .55 * noise(i * 2.3 + Math.floor(t * 12) * 5.1, t * 3)),
			candle: (i, n, t, C) => sc(C[0], .5 + .5 * noise(hsh(i) * 40, t * 9)),
			gradient: (i, n, t, C) => mix(C[0], C[1].every(v => v < 10) ? sc(C[0], .1) : C[1], sn(i * .5, -t * 2)),
			loading: (i, n, t, C) => i / n < (t * .4 % 1) ? C[0] : sc(C[0], .08),
			balls: (i, n, t) => { let c = K; for (let k = 0; k < 3; k++) { const p = (t * (.7 + k * .17) + k * .3) % 1, h = 1 - (2 * p - 1) ** 2; c = add(c, sc(wh(k / 3), dot(i, h * (n - 1), 1.3))); } return c; },
			lightning: (i, n, t, C) => { const b = Math.floor(t * 2.5), p = t * 2.5 - b; if (hsh(b) > .55) return C[1]; const a = hsh(b * 3) * n, l = 3 + hsh(b * 5) * n * .6; return i >= a && i < a + l && (p < .1 || (p > .2 && p < .26)) ? W : C[1]; },
			meteor: (i, n, t, C) => { const x = (t * 10) % (n + 10), d = x - i; return d >= 0 && d < 10 ? sc(C[0], d < 1 ? 1 : (1 - d / 10) * (.3 + .7 * hsh(i * 5 + Math.floor(t * 8)))) : C[1]; },
			ripple: (i, n, t) => { let c = K; for (let k = 0; k < 2; k++) { const b = Math.floor(t * .9 + k * .5), p = t * .9 + k * .5 - b, x = hsh(b * 9 + k) * n; c = add(c, sc(wh(hsh(b + k * 7)), Math.max(0, 1 - Math.abs(Math.abs(i - x) - p * n * .5)) * (1 - p))); } return c; },
			twinklefox: (i, n, t, C) => { const v = tw(i, t, .5, .6); const pal = C.filter(c => c.some(x => x > 10)); return sc(pal.length > 1 ? pal[Math.floor(hsh(i * 3) * pal.length)] : wh(hsh(i * 3)), v); },
			colortwinkle: (i, n, t) => sc(wh(hsh(i * 3 + Math.floor(t * .5 + hsh(i) * 4))), tw(i, t, .7, .55)),
			eyes: (i, n, t, C) => { const b = Math.floor(t * .6), p = t * .6 - b, x = Math.floor(hsh(b) * (n - 4)); const blink = p > .45 && p < .52; return !blink && p < .85 && (i === x || i === x + 3) ? C[0] : C[1]; },
			pattern: (i, n, t, C) => (i % 4) < 2 ? C[0] : C[1],
			patternTri: (i, n, t, C) => C[i % 3].some(v => v > 0) ? C[i % 3] : [0, 0, 255],
			spots: (i, n, t, C) => mix(C[1], C[0], Math.max(0, Math.sin(i * 1.3 - t * 2))),
			glitter: (i, n, t) => hsh(i * 11 + Math.floor(t * 14)) < .1 ? W : wh(i / n - t * .2),
			sinelon: (i, n, t, C) => { const x = (n - 1) * sn(0, t * 2.5); return mix(C[1], C[0], Math.max(0, 1 - Math.abs(i - x) / 3)); },
			juggle: (i, n, t) => { let c = K; for (let k = 0; k < 4; k++) c = add(c, sc(wh(k / 4), Math.max(0, 1 - Math.abs(i - (n - 1) * sn(0, t * (1.2 + k * .4))) / 2.5))); return c; },
			popcorn: (i, n, t, C) => { let v = 0; for (let k = 0; k < 3; k++) { const p = (t * .9 + k * .33) % 1, h = (1 - (2 * p - 1) ** 2) * (n - 1) * (.4 + .6 * hsh(Math.floor(t * .9 + k * .33) * 3 + k)); v = Math.max(v, dot(i, h, 1)); } return mix(C[1], C[0], v); },
			drip: (i, n, t, C) => { const p = t * .8 % 1, x = (n - 1) * (1 - p * p); return mix(C[1], C[0], Math.max(dot(i, x, 1), i > n - 3 ? .5 * (1 - p) : 0)); },
			plasma: (i, n, t) => wh(noise(i * .6, t * 1.5) * 1.6 + t * .05),
			noise: (i, n, t) => wh(noise(i * .35, t * .9) * 1.3),
			pride: (i, n, t) => sc(wh(i / n * .8 + t * .08), .4 + .6 * sn(i * .7, t * 3)),
			pacifica: (i, n, t) => { const v = noise(i * .5, t * 1.2); return add([0, 25 + 60 * v, 70 + 120 * v], v > .8 ? sc(W, (v - .8) * 3) : K); },
			lake: (i, n, t, C) => mix(sc(C[0], .25), C[0], noise(i * .4, t)),
			aurora: (i, n, t) => mix([0, 60, 30], [40, 255, 150], noise(i * .3, t * .8) ** 2),
			percent: (i, n, t, C) => i / n < .3 + .4 * sn(0, t) ? C[0] : C[1],
			heartbeat: (i, n, t, C) => { const p = t * 1.1 % 1; return sc(C[0], Math.max(Math.exp(-(((p - .05) * 22) ** 2)), .7 * Math.exp(-(((p - .25) * 22) ** 2)), .08)); },
			sunrise: (i, n, t) => { const p = t * .15 % 1; return heat(Math.min(1, p * 1.3)); },
			sine: (i, n, t, C) => mix(C[1], C[0], sn(i * .6, t * 3)),
			flow: (i, n, t) => wh(i / n * .5 + t * .2 + (i > n / 2 ? .5 : 0)),
			chunchun: (i, n, t, C) => { let v = 0; for (let k = 0; k < 4; k++) v = Math.max(v, dot(i, (n - 1) * sn(k * 1.3, t * (1.6 + k * .1)), 1)); return mix(C[1], C[0], v); },
			shadows: (i, n, t) => sc(wh(t * .05 + i / n * .3), Math.max(sn(i * .5, t * 1.7), sn(i * .3, -t * 2.3)) ** 3),
			washing: (i, n, t, C) => mix(C[1], C[0], sn(i * .8, Math.sin(t * 1.3) * 12) ** 2),
			blends: (i, n, t) => wh(noise(i * .2, t * .5) + t * .05),
			tv: (i, n, t) => { const b = Math.floor(t * 3); return sc(mix([60, 80, 200], [255, 220, 180], hsh(b)), .4 + .6 * hsh(b * 5 + (i > n / 2 ? 1 : 0))); },
			traffic: (i, n, t) => [[255, 0, 0], [255, 160, 0], [0, 200, 0]][Math.floor(t * .8) % 3].map(v => ((i + Math.floor(t * .8)) % 3 === 0 ? v : v * .06)),
			railway: (i, n, t, C) => { const k = sn(0, t * 3); return (i & 1) ? mix(C[0], C[1], k) : mix(C[1], C[0], k); },
			bees: (i, n, t) => { let c = K; for (let k = 0; k < 3; k++) c = add(c, sc(wh(k * .3), dot(i, (n - 1) * noise(k * 4, t * 1.7), 1))); return c; },
			ghost: (i, n, t, C) => { const x = (n - 1) * sn(0, t * 1.5), d = Math.abs(i - x); return sc(wh(t * .1 + d * .05), Math.max(0, 1 - d / 6)); },
			text: (i, n, t, C) => (hsh(Math.floor(i + t * 7) * 3) < .5 && ((i + Math.floor(t * 7)) % 6) < 4) ? C[0] : C[1],
			audio: (i, n, t, C) => { const lvl = .25 + .75 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1)); return i / n < lvl ? wh(.33 - i / n * .33) : K; },
			candycane: (i, n, t, C) => ((i + t * 3) % 6) < 3 ? C[0] : C[1],
			snowfall: (i, n, t, C) => { const v = tw(i, t, .9, .35); return mix(C[1], C[0], v); },
			haunted: (i, n, t, C) => { const b = Math.floor(t * 1.5), dark = hsh(b) < .15, v = .5 + .5 * noise(i * 1.7, t * 8); return dark ? (hsh(i + b) < .2 ? [90, 0, 140] : sc(C[0], .05)) : sc(C[0], v); },
			retrotree: (i, n, t) => sc([[255, 20, 0], [0, 200, 40], [0, 60, 255], [255, 140, 0], [200, 0, 160]][i % 5], .75 + .25 * sn(i * 2, t * 1.2)),
			myleds: (i, n, t) => sc(wh(hsh(i * 3) * .2 + Math.floor(i / 4) * .15), .7 + .3 * sn(i, t * 2)),
			confetti: (i, n, t) => sc(wh(hsh(i * 7 + Math.floor(t * 3 + hsh(i) * 5))), tw(i, t, 1.5, .5)),
			image: (i, n, t) => sc(wh(Math.floor(i / 3) * .13 + Math.floor(t) * .3), .9)
		};
		// 2D (matrix) effects: drawn on a small grid; most WLED 2D effects are moving colour fields
		const S2 = {
			field: (x, y, t, k) => wh(noise(x * .5 + k * 3, t * (1 + k)) + noise(y * .7 - k, t * .8) * .8 + k),
			matrix: (x, y, t) => { const p = ((t * (3 + hsh(x) * 3) + hsh(x * 7) * 9) % 8) - y; return p >= 0 && p < 4 ? [0, 255 * (1 - p / 4), p < 1 ? 120 : 0] : K; },
			geq: (x, y, t) => { const lvl = (.3 + .7 * Math.abs(Math.sin(t * (3 + x * .7) + x))) * 6; return 5 - y < lvl ? wh(.33 - (5 - y) / 18) : K; },
			life: (x, y, t) => hsh(x * 13 + y * 7 + Math.floor(t * 2) * 97) < .3 ? [80, 255, 120] : K,
			text: (x, y, t) => { const c = Math.floor(x + t * 6); return y > 0 && y < 5 && hsh(c * 5 + y) < .45 && c % 5 ? [255, 60, 60] : K; },
			fire: (x, y, t) => heat(Math.max(0, Math.min(1, (y / 5) * 1.2 * (.5 + .7 * noise(x * 1.4 + y * .5, t * 6)) - .05)))
		};
		const TABLE = [
			[/^solid$/, 'solid'], [/^blink rainbow/, 'strobeRb'], [/^blink/, 'blink'], [/breathe/, 'breathe'], [/tri wipe|^wipe|sweep random/, 'wipe'], [/^sweep/, 'sweep'],
			[/random colors/, 'randcol'], [/dynamic/, 'dynamic'], [/colorloop|tri fade/, 'colorloop'], [/rainbow runner|^rainbow$|^palette$|colorful|flow stripe/, 'rainbow'],
			[/scan dual|scanner dual|two dots/, 'scan2'], [/^scan$/, 'scan'], [/scanner|lighthouse|^icu|android|cylon/, 'larson'], [/fade/, 'fade'],
			[/theater rainbow/, 'theaterRb'], [/theater|chase 3|chase 2/, 'theater'], [/running|stream|oscillate/, 'running'], [/^saw/, 'saw'],
			[/colortwinkles/, 'colortwinkle'], [/twinklefox|twinklecat|fairytwinkle/, 'twinklefox'], [/twinkle|fairy/, 'twinkle'], [/dissolve/, 'dissolve'],
			[/sparkle dark/, 'sparkleDark'], [/sparkle\+/, 'sparklePlus'], [/sparkle|ps sparkler/, 'sparkle'], [/strobe rainbow|strobe mega/, 'strobeRb'], [/strobe/, 'strobe'],
			[/chase flash/, 'chaseFlash'], [/chase rainbow|chase random/, 'chaseRb'], [/chase|ps chase/, 'chase'], [/multi comet/, 'multiComet'], [/comet/, 'comet'],
			[/traffic/, 'traffic'], [/aurora|polar/, 'aurora'], [/starburst|firework|ps impact|colored bursts/, 'fireworks'], [/rain$|^rain|ps dripdrop/, 'rain'], [/drip/, 'drip'],
			[/fire flicker/, 'flicker'], [/candle/, 'candle'], [/fire|volcano|noisefire/, 'fire'], [/gradient/, 'gradient'], [/loading/, 'loading'],
			[/bouncing|rolling balls|ballpit|pinball|ps 1d balance|springy/, 'balls'], [/lightning/, 'lightning'], [/meteor/, 'meteor'], [/ripple/, 'ripple'],
			[/halloween eyes/, 'eyes'], [/solid pattern tri/, 'patternTri'], [/solid pattern/, 'pattern'], [/spots/, 'spots'], [/glitter/, 'glitter'],
			[/sinelon/, 'sinelon'], [/juggle$|bpm/, 'juggle'], [/popcorn/, 'popcorn'], [/pride|phased|sine$|wavesins/, 'pride'], [/pacifica|lake/, 'pacifica'],
			[/percent/, 'percent'], [/heartbeat/, 'heartbeat'], [/sunrise/, 'sunrise'], [/^sine$/, 'sine'], [/^flow$/, 'flow'], [/chunchun|crazy bees|spaceships/, 'bees'],
			[/dancing shadows/, 'shadows'], [/washing/, 'washing'], [/blends|color clouds|slow transition/, 'blends'], [/tv simulator/, 'tv'], [/railway/, 'railway'],
			[/ghost rider/, 'ghost'], [/scrolling text/, 'text'], [/tetrix/, 'rain'], [/noise|plasma|colorwaves|lissajous|metaballs|^soap|blobs/, 'plasma'], [/^image$/, 'image'],
			[/candy cane/, 'candycane'], [/snowfall/, 'snowfall'], [/haunted/, 'haunted'], [/retro tree/, 'retrotree'], [/my leds/, 'myleds']
		];
		const AUDIO = /gravi|gravc|gravf|juggles|waterfall|pixelwave|ripple peak|midnoise|noisemeter|plasmoid|puddle|freq|^geq|noisemove|dj light|funky|blurz|rocktaves|waverly|matripix|^pixels|ps geq|sonic|akemi/;
		const of = (name, d2) => {
			const n = String(name || '').toLowerCase();
			if (d2) { if (/^matrix$/.test(n)) return { g: 'matrix' }; if (/geq|freq|funky|waterfall/.test(n)) return { g: 'geq' }; if (/game of life/.test(n)) return { g: 'life' };
				if (/text/.test(n)) return { g: 'text' }; if (/fire|volcano/.test(n)) return { g: 'fire' }; if (!AUDIO.test(n) || /2d|geq|freqmatrix|matripix/.test(n)) return { g: 'field', k: hsh(n.length * 31 + n.charCodeAt(0)) }; }
			if (AUDIO.test(n)) return { s: 'audio' };
			for (const [re, s] of TABLE) if (re.test(n)) return { s };
			return { s: 'plasma' };
		};
		// one shared animation loop; only canvases on screen are drawn
		const live = new Set();
		const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => es.forEach(e => { e.target._pvOn = e.isIntersecting; }), { rootMargin: '40px' }) : null;
		let raf = 0, last = 0;
		const tick = now => {
			raf = requestAnimationFrame(tick);
			if (now - last < 45) return; last = now;
			const t = now / 1000;
			live.forEach(cv => { if (!cv.isConnected) { live.delete(cv); io && io.unobserve(cv); return; } if (cv._pvOn !== false && !document.hidden) draw(cv, t); });
		};
		const draw = (cv, t) => {
			const o = cv._pv, g = cv.getContext('2d'), w = cv.width, hgt = cv.height;
			curPal = o.P || null;
			g.fillStyle = '#06070c'; g.fillRect(0, 0, w, hgt);
			const pix = (x, y, cell, c) => {
				const r = Math.round(c[0]), gg = Math.round(c[1]), b = Math.round(c[2]), m = Math.max(r, gg, b);
				if (m < 8) { g.fillStyle = '#14161f'; g.beginPath(); g.arc(x, y, cell * .3, 0, 6.283); g.fill(); return; }
				g.fillStyle = 'rgba(' + r + ',' + gg + ',' + b + ',.28)'; g.beginPath(); g.arc(x, y, cell * .55, 0, 6.283); g.fill();
				g.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')'; g.beginPath(); g.arc(x, y, cell * .32, 0, 6.283); g.fill();
			};
			if (o.frames) {   // a real recording from the lights
				const f = o.frames[Math.floor(t * 6.5) % o.frames.length], n = f.length, cell = Math.min(hgt, w / n);
				for (let i = 0; i < n; i++) pix((w - cell * n) / 2 + cell * (i + .5), hgt / 2, cell, f[i]);
			} else if (o.g) {
				const cols = 26, rows = 4, cell = Math.min(w / cols, hgt / rows), f = S2[o.g];
				for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) pix((w - cell * cols) / 2 + cell * (x + .5), cell * (y + .5) + (hgt - cell * rows) / 2, cell, f(x, y * 5 / 3, t * o.v, o.k || 0));
			} else {
				const n = o.n, cell = Math.min(hgt, w / n), f = S[o.s] || S.plasma;
				for (let i = 0; i < n; i++) pix((w - cell * n) / 2 + cell * (i + .5), hgt / 2, cell, f(i, n, t * o.v, o.C));
			}
		};
		const DEF = [[255, 150, 40], [0, 0, 0], [0, 0, 0]];
		// spec: { name, d2, sim, col:[[r,g,b]..], speed (0-255), frames:[[[r,g,b]..]..], n, w, h, cls }
		const mini = spec => {
			const W2 = (spec.w || 120) * 2, H2 = (spec.h || 14) * 2;
			const cv = h('canvas', { class: 'pv ' + (spec.cls || ''), width: String(W2), height: String(H2), 'aria-hidden': 'true' });
			const k = spec.sim ? { s: spec.sim } : of(spec.name, spec.d2);
			const C = [0, 1, 2].map(i => { const c = spec.col && spec.col[i]; return c && c.length >= 3 ? c.slice(0, 3) : DEF[i]; });
			cv._pv = Object.assign(k, { C, P: spec.pal || null, n: spec.n || (k.g ? 0 : 20), v: spec.speed == null ? 1 : .35 + spec.speed / 160, frames: spec.frames && spec.frames.length ? spec.frames : null });
			cv._pvOn = true; live.add(cv); io && io.observe(cv);
			if (!raf) raf = requestAnimationFrame(tick);
			return cv;
		};
		const set = (cv, spec) => { const nw = mini(spec); live.delete(nw); cv._pv = nw._pv; };
		return { mini, set, of, palAt };
	})();

	// ---------- Snapshots of what each house scene really looks like (kept on this phone / computer) ----------
	const snapKey = (t, id) => 'l4yScn:' + ((t.info && t.info().key) || 'x') + ':' + id;
	const snapLoad = (t, id) => { try { const s = localStorage.getItem(snapKey(t, id)); return s ? s.split('|').map(f => f.match(/.{6}/g).map(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)])) : null; } catch (e) { return null; } };
	const snapSave = (t, id, frames) => {
		try {
			const enc = frames.filter(f => f && f.length).map(f => { const n = Math.min(24, f.length), out = [];
				for (let i = 0; i < n; i++) { const c = f[Math.floor(i * f.length / n)]; out.push(c.map(v => (v | 0).toString(16).padStart(2, '0')).join('')); } return out.join(''); });
			if (enc.length) localStorage.setItem(snapKey(t, id), enc.join('|'));
		} catch (e) {}
	};
	const record = async (t, ms) => { if (!t.peek) return null; try { return await t.peek(ms || 1400); } catch (e) { return null; } };
	// how each scene looks before it is saved on a light
	const SCENE_LOOK = {
		241: { sim: 'haunted', col: [[255, 90, 0]] }, 242: { sim: 'retrotree' }, 243: { sim: 'twinklefox', col: [[255, 170, 200], [170, 230, 255], [255, 240, 140]] },
		244: { sim: 'fireworks', col: [[0, 0, 0], [0, 0, 0]] }, 245: { sim: 'breathe', col: [[255, 20, 90], [40, 0, 10]] }, 246: { sim: 'confetti' },
		247: { sim: 'solid', col: [[255, 170, 90]] }, 248: { sim: 'juggle' }
	};

	// ---------- Extras: timer, schedule, seasons, countdown, preset loop, sound, motion, group, power ----------
	const pad = n => String(n).padStart(2, '0');
	const hhmm = m => m < 0 ? '--:--' : pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
	const toMin = v => { const [a, b] = (v || '0:0').split(':'); return (+a) * 60 + (+b); };
	const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	// built-in WLED effects used by the themes and the sound list (ids from WLED FX.h)
	const FX = { candle: 88, eyes: 82, lightning: 57, colortwinkle: 74, twinklefox: 80, fire: 66, scroll: 122 };
	// house scenes: every light keeps its own look for each scene in these preset slots (hidden from the 1-10 grid)
	const SCENES = [[241, '🎃', 'Halloween'], [242, '🎄', 'Christmas'], [243, '🐣', 'Easter'], [244, '🎆', 'New Year'],
		[245, '❤️', "Valentine's Day"], [246, '🎂', 'Birthday'], [247, '🌙', 'Every day'], [248, '🎉', 'Party']];
	const SOUND_FX = [['GEQ (matrix)', 139], ['Gravimeter', 132], ['Juggles', 130], ['Waterfall', 140], ['Pixelwave', 129], ['Ripple Peak', 148], ['Midnoise', 135], ['Puddles', 134], ['Noisemeter', 136], ['Plasmoid', 133]];

	function extrasCards(t, toast) {
		let st = { x: {}, p: [] };
		const presetSelect = (id, withNone) => {
			const s = h('select', { id });
			const fill = (cur) => {
				s.innerHTML = '';
				if (withNone) s.append(h('option', { value: '0' }, withNone));
				for (let i = 1; i <= 10; i++) {
					const f = st.p.find(p => p[0] === i);
					s.append(h('option', { value: String(i) }, i + (f ? ' · ' + f[1] : ' · (empty)')));
				}
				SCENES.forEach(([id, ic, name]) => { if (st.p.find(p => p[0] === id)) s.append(h('option', { value: String(id) }, ic + ' ' + name)); });
				s.value = String(cur || 0);
			};
			s.fill = fill; fill(0); return s;
		};
		const segBtns = (items, onPick) => {
			const btns = items.map(([v, label]) => h('button', { type: 'button', class: 'seg', onclick: () => { set(v); onPick && onPick(v); } }, label));
			const wrap = h('div', { class: 'segs' }, btns);
			const set = v => { wrap.value = v; btns.forEach((b, j) => b.classList.toggle('sel', items[j][0] === v)); };
			wrap.set = set; set(items[0][0]); return wrap;
		};
		const ok = m => () => toast(m);
		const fail = m => () => toast(m || 'Could not reach the lights.');
		const field = (label, el) => h('label', { class: 'fld' }, h('span', {}, label), el);

		// ---- sleep timer (WLED nightlight: fades out and switches off) ----
		const nlInfo = h('span', {}, '');
		const sleep = min => t.send(min ? { on: true, nl: { on: true, dur: min, mode: 1, tbri: 0 } } : { nl: { on: false } })
			.then(ok(min ? 'Lights switch off in ' + (min >= 60 ? min / 60 + ' h' : min + ' min') + '.' : 'Sleep timer off.')).catch(fail());
		const cSleep = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Sleep timer ', nlInfo),
			h('div', { class: 'note' }, 'Fade out and switch off after:'),
			h('div', { class: 'segs' }, [[15, '15 min'], [30, '30 min'], [60, '1 h'], [120, '2 h'], [240, '4 h']].map(([m, l]) => h('button', { type: 'button', class: 'seg', onclick: () => sleep(m) }, l)),
				h('button', { type: 'button', class: 'seg', onclick: () => sleep(0) }, 'Off')));

		// ---- schedule ----
		const onMode = segBtns([[0, 'Off'], [1, 'At a time'], [2, 'At sunset']], () => updSch());
		const offMode = segBtns([[0, 'Off'], [1, 'At a time'], [2, 'At sunrise']], () => updSch());
		const onTime = h('input', { type: 'time', value: '18:00' }), offTime = h('input', { type: 'time', value: '23:30' });
		const onOff = h('input', { type: 'number', min: '-120', max: '120', step: '5', value: '0' }), offOff = h('input', { type: 'number', min: '-120', max: '120', step: '5', value: '0' });
		const onPs = presetSelect('xOnPs', 'Just switch on');
		const onTimeF = field('Time', onTime), onOffF = field('Minutes after sunset (−before)', onOff);
		const offTimeF = field('Time', offTime), offOffF = field('Minutes after sunrise (−before)', offOff);
		const onPsF = field('Show', onPs);
		let days = 0x7F;
		const dayBtns = DAYS.map((d, i) => h('button', { type: 'button', class: 'seg day', title: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i], onclick: () => { days ^= 1 << i; updDays(); } }, d));
		const updDays = () => dayBtns.forEach((b, i) => b.classList.toggle('sel', !!(days & (1 << i))));
		const sunInfo = h('div', { class: 'note' }, '');
		const schHouse = h('input', { type: 'checkbox' });
		const updSch = () => {
			onTimeF.hidden = onMode.value !== 1; onOffF.hidden = onMode.value !== 2; onPsF.hidden = onMode.value === 0;
			offTimeF.hidden = offMode.value !== 1; offOffF.hidden = offMode.value !== 2;
		};
		const geoBtn = h('button', { class: 'btn', type: 'button' }, 'Use my location for sunset');
		geoBtn.onclick = () => {
			if (!navigator.geolocation) { toast('This browser cannot share the location.'); return; }
			navigator.geolocation.getCurrentPosition(p => {
				t.send({ time: Math.floor(Date.now() / 1000), l4y: { tz: -new Date().getTimezoneOffset() * 60, geo: [+p.coords.latitude.toFixed(3), +p.coords.longitude.toFixed(3)] } })
					.then(() => { toast('Location saved. Sunset times are ready.'); setTimeout(refresh, 800); }).catch(fail());
			}, () => toast('Location was not allowed.'), { timeout: 15000 });
		};
		const saveSch = () => {
			const sch = { om: onMode.value, ot: onMode.value === 1 ? toMin(onTime.value) : +onOff.value, ops: +onPs.value,
				fm: offMode.value, ft: offMode.value === 1 ? toMin(offTime.value) : +offOff.value, d: days, h: schHouse.checked };
			t.send({ time: Math.floor(Date.now() / 1000), l4y: { tz: -new Date().getTimezoneOffset() * 60, sch } }).then(ok('Schedule saved on the lights.')).catch(fail());
		};
		const cSched = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Schedule'),
			h('div', { class: 'lab' }, 'Switch on'), onMode, onTimeF, onOffF, onPsF,
			h('div', { class: 'lab sp' }, 'Switch off'), offMode, offTimeF, offOffF,
			h('div', { class: 'lab sp' }, 'Days'), h('div', { class: 'segs' }, dayBtns),
			h('label', { class: 'chk' }, schHouse, ' Whole house: switch every LED4YOU light (scene with the same preset number)'),
			sunInfo,
			h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: saveSch }, 'Save schedule'), geoBtn));

		// ---- seasonal themes ----
		const xfx = i => (st.x.xfx || [])[i];
		const THEMES = [
			['Halloween', [
				['Pumpkin glow', 'candle', () => ({ fx: FX.candle, sx: 96, ix: 224, pal: 0, col: [[255, 90, 0], [0, 0, 0]] })],
				['Haunted', 'haunted', () => ({ fx: xfx(2), sx: 160, ix: 96, col: [[255, 106, 16]] })],
				['Spooky eyes', 'eyes', () => ({ fx: FX.eyes, sx: 128, ix: 128, pal: 0, col: [[255, 0, 0], [0, 0, 0]] })],
				['Storm', 'lightning', () => ({ fx: FX.lightning, sx: 128, ix: 128, pal: 0, col: [[200, 220, 255], [0, 0, 20]] })],
				['Witch brew', 'twinklefox', () => ({ fx: FX.colortwinkle, sx: 128, ix: 128, pal: 5, col: [[120, 0, 255], [40, 255, 0], [255, 80, 0]] })]]],
			['Christmas', [
				['Retro tree', 'retrotree', () => ({ fx: xfx(3), sx: 96, ix: 128 })],
				['Candy cane', 'candycane', () => ({ fx: xfx(0), sx: 64, ix: 48, col: [[255, 0, 0], [255, 255, 255]] })],
				['Snowfall', 'snowfall', () => ({ fx: xfx(1), sx: 128, ix: 96, col: [[255, 255, 255], [0, 0, 24]] })],
				['Merry twinkle', 'twinklefox', () => ({ fx: FX.twinklefox, sx: 128, ix: 128, pal: 5, col: [[255, 0, 0], [0, 200, 30], [255, 180, 60]] })],
				['Fireplace', 'fire', () => ({ fx: FX.fire, sx: 64, ix: 160, pal: 35 })]]]
		];
		const cSeasons = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Seasons'),
			THEMES.flatMap(([group, list]) => [h('div', { class: 'lab sp' }, group), h('div', { class: 'themes' }, list.map(([name, sim, f]) => h('button', {
				type: 'button', class: 'theme ' + group.toLowerCase(), onclick: () => {
					const seg = f();
					if (seg.fx === undefined || seg.fx === 255) { toast('Update the lights to the newest LED4YOU for this theme.'); return; }
					t.send({ on: true, seg, l4y: { cd: { on: false } } }).then(ok(name + ' is on. Save it as a preset to keep it.')).catch(fail());
				}
			}, h('span', {}, name), (() => { const sg = f(); return PV.mini({ sim, col: sg.col, speed: sg.sx, w: 104, h: 12 }); })())))]));

		// ---- countdown on a matrix (Scrolling Text) ----
		const cdName = h('input', { class: 'search', type: 'text', maxlength: '16', placeholder: 'XMAS', value: 'XMAS' });
		const cdWhen = h('input', { type: 'datetime-local' });
		const y = new Date().getFullYear(), xmas = new Date(y, 11, 25) < new Date() ? y + 1 : y;
		cdWhen.value = xmas + '-12-25T00:00';
		const cdCol = h('input', { type: 'color', value: '#ff2e2e', class: 'colbtn', 'aria-label': 'Countdown color' });
		const cdState = h('span', {}, '');
		const startCd = () => {
			const d = new Date(cdWhen.value);
			if (isNaN(d)) { toast('Pick a date and time.'); return; }
			const local = Math.floor(d.getTime() / 1000) - d.getTimezoneOffset() * 60;   // the lights count in local time
			t.send({ on: true, time: Math.floor(Date.now() / 1000), seg: { fx: FX.scroll, col: [hexToRgb(cdCol.value)], tp: false, c3: 16, o3: false },
				l4y: { tz: -new Date().getTimezoneOffset() * 60, cd: { on: true, t: local, n: cdName.value.trim() } } })
				.then(ok('Countdown started.')).catch(fail());
		};
		const inf = t.info();
		const cCount = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Countdown ', cdState),
			inf.mw && inf.mh ? '' : h('div', { class: 'note warnline' }, 'Needs a matrix: the countdown scrolls as text.'),
			field('Label', cdName), field('Count down to', cdWhen),
			h('div', { class: 'row' }, cdCol, h('button', { class: 'btn primary', type: 'button', onclick: startCd }, 'Start countdown'),
				h('button', { class: 'btn', type: 'button', onclick: () => t.send({ l4y: { cd: { on: false } } }).then(ok('Countdown stopped.')).catch(fail()) }, 'Stop')));

		// ---- house scenes: one tap changes every LED4YOU; each light keeps its own look per scene ----
		const sceneBox = h('div', { class: 'scenes' });
		const hsJoin = h('input', { type: 'checkbox', checked: '' });
		const hsId = h('select', {}, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => h('option', { value: String(n) }, 'House ' + n)));
		const saveHs = () => t.send({ l4y: { hs: { j: hsJoin.checked, id: +hsId.value } } }).then(ok('Saved.')).catch(fail());
		hsJoin.onchange = saveHs; hsId.onchange = saveHs;
		const play = (n, label) => t.send({ l4y: { scene: n } }).then(ok(n ? label + ' on the whole house.' : 'Whole house off.')).catch(fail());
		const saveScene = (id, name) => {
			const rec = record(t, 1400);   // a short recording of the lights becomes the scene's picture
			t.send({ psave: id, n: 'Scene: ' + name, ib: true, sb: true })
				.then(async () => { toast('Saved: this light now has its ' + name + ' look.'); st.p = st.p.filter(p => p[0] !== id).concat([[id, 'Scene: ' + name]]);
					const fr = await rec; if (fr && fr.length) snapSave(t, id, fr); renderScenes(); setTimeout(refresh, 1500); }).catch(fail());
		};
		const renderScenes = () => {
			sceneBox.replaceChildren(...SCENES.map(([id, ic, name]) => {
				const has = !!st.p.find(p => p[0] === id);
				const snap = has ? snapLoad(t, id) : null;
				return h('div', { class: 'scene' + (has ? ' has' : '') },
					h('button', { type: 'button', class: 'sc-play', onclick: () => play(id, name) },
						h('span', { class: 'sc-ic' }, ic), h('span', { class: 'sc-name' }, name),
						h('span', { class: 'sc-pv' }, PV.mini(snap ? { frames: snap, w: 130, h: 12 } : Object.assign({ w: 130, h: 12 }, SCENE_LOOK[id])),
							h('small', {}, snap ? 'Your look' : 'Example')),
						h('span', { class: 'sc-st' }, has ? '✓ Ready on this light' : 'Not saved on this light')),
					h('button', { type: 'button', class: 'sc-save', onclick: () => saveScene(id, name) }, has ? 'Save again' : 'Save here'));
			}), h('button', { type: 'button', class: 'sc-off', onclick: () => play(0) }, 'All off'));
		};
		const cHouse = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'House scenes'),
			h('ol', { class: 'steps' },
				h('li', {}, 'On each light, make it look the way you want, then tap "Save here" on the scene.'),
				h('li', {}, 'Tap a scene to change every LED4YOU light at once. Each light shows its own look.')),
			sceneBox,
			h('details', { class: 'more' }, h('summary', {}, 'House settings'),
				h('label', { class: 'chk' }, hsJoin, ' This light follows house scenes'),
				field('House number (change it only if a neighbour also has LED4YOU)', hsId)));

		// ---- preset loop (temporary playlist of the saved presets) ----
		const loopSec = track(h('input', { type: 'range', min: '5', max: '600', step: '5', value: '60', 'aria-label': 'Seconds per preset' }));
		const loopLbl = h('span', {}, '60 s');
		loopSec.addEventListener('input', () => { loopLbl.textContent = loopSec.value >= 60 ? (loopSec.value / 60).toFixed(loopSec.value % 60 ? 1 : 0) + ' min' : loopSec.value + ' s'; });
		const loopState = h('span', {}, '');
		const startLoop = () => {
			const ids = st.p.map(p => p[0]).filter(i => i <= 10);
			if (ids.length < 2) { toast('Save at least two presets first.'); return; }
			t.send({ on: true, playlist: { ps: ids, dur: ids.map(() => +loopSec.value * 10), transition: ids.map(() => 7), repeat: 0 } })
				.then(() => { toast('Showing ' + ids.length + ' presets in a loop.'); setTimeout(refresh, 800); }).catch(fail());
		};
		const cLoop = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Preset loop ', loopState),
			h('div', { class: 'note' }, 'Shows your saved presets one after another, forever.'),
			h('div', { class: 'lbl' }, h('span', {}, 'Time per preset'), loopLbl), loopSec,
			h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: startLoop }, 'Start loop'),
				h('button', { class: 'btn', type: 'button', onclick: () => t.send({ l4y: { plstop: true } }).then(() => { toast('Loop stopped.'); setTimeout(refresh, 800); }).catch(fail()) }, 'Stop')));

		// ---- sound (AudioReactive usermod) ----
		const micOn = h('input', { type: 'checkbox', checked: '' });
		const micType = h('select', {}, h('option', { value: '1' }, 'I2S microphone (INMP441, ICS-43434)'), h('option', { value: '5' }, 'PDM microphone (no SCK)'), h('option', { value: '4' }, 'I2S with MCLK (line-in boards)'));
		const pin = v => h('input', { type: 'number', min: '-1', max: '48', value: String(v) });
		const micSd = pin(5), micWs = pin(6), micSck = pin(7);
		const micGain = track(h('input', { type: 'range', min: '1', max: '255', value: '60', 'aria-label': 'Microphone gain' }));
		const micSq = track(h('input', { type: 'range', min: '0', max: '80', value: '10', 'aria-label': 'Noise gate' }));
		const saveMic = () => {
			if (!confirmOnce('mic')) return;
			t.cfg({ um: { AudioReactive: { enabled: micOn.checked, digitalmic: { type: +micType.value, pin: [+micSd.value, +micWs.value, micType.value === '5' ? -1 : +micSck.value, -1] }, config: { squelch: +micSq.value, gain: +micGain.value, AGC: 1 } } } })
				.then(ok('Saved. The lights restart now.')).catch(fail());
		};
		const confirmOnce = k => { if (confirmOnce[k]) return true; confirmOnce[k] = true; toast('The lights restart to apply this. Tap again to confirm.'); return false; };
		const cSound = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Sound'),
			h('div', { class: 'note' }, 'Effects that move with music. Connect a microphone first and set its pins below.'),
			h('div', { class: 'themes' }, SOUND_FX.map(([n, id]) => h('button', { type: 'button', class: 'theme sound', onclick: () => t.send({ on: true, seg: { fx: id } }).then(ok(n + ' is on.')).catch(fail()) }, h('span', {}, n), PV.mini({ name: n, d2: /matrix/.test(n), w: 104, h: 12 })))),
			h('details', { class: 'more' }, h('summary', {}, 'Microphone setup'),
				h('label', { class: 'chk' }, micOn, ' Microphone on'),
				field('Type', micType),
				h('div', { class: 'pins' }, field('SD (data)', micSd), field('WS', micWs), field('SCK', micSck)),
				h('div', { class: 'lbl' }, h('span', {}, 'Gain (sensitivity)')), micGain,
				h('div', { class: 'lbl' }, h('span', {}, 'Noise gate')), micSq,
				h('div', { class: 'note' }, 'Do not use the LED data pin, GPIO 9 (boot button) or GPIO 8 (onboard LED).'),
				h('button', { class: 'btn primary', type: 'button', onclick: saveMic }, 'Save and restart')));

		// ---- motion sensor (PIR) ----
		const pirOn = h('input', { type: 'checkbox' }), pirNight = h('input', { type: 'checkbox' });
		const pirPin = pin(4), pirDur = h('input', { type: 'number', min: '1', max: '600', value: '15' });
		const pirPs = presetSelect('xPirPs', null);
		const pirState = h('span', {}, '');
		const savePir = () => t.send({ l4y: { pir: { en: pirOn.checked, pin: +pirPin.value, ps: +pirPs.value, dur: +pirDur.value, nt: pirNight.checked } } }).then(ok('Motion sensor saved.')).catch(fail());
		const cPir = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Motion scare ', pirState),
			h('div', { class: 'note' }, 'A motion sensor (PIR, e.g. HC-SR501 or AM312) plays a preset when someone walks by, then the lights go back to what they showed.'),
			h('label', { class: 'chk' }, pirOn, ' Sensor on'),
			h('div', { class: 'pins' }, field('Sensor pin (OUT)', pirPin), field('Seconds', pirDur)),
			field('Preset to play', pirPs),
			h('label', { class: 'chk' }, pirNight, ' Only after sunset'),
			h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: savePir }, 'Save'),
				h('button', { class: 'btn', type: 'button', onclick: () => t.send({ l4y: { pirt: true } }).then(ok('Playing the scare preset.')).catch(fail()) }, 'Test')));

		// ---- group (WLED sync over Wi-Fi) ----
		const gSend = h('input', { type: 'checkbox' }), gRecv = h('input', { type: 'checkbox' });
		const saveGroup = () => t.send({ l4y: { sync: { s: gSend.checked, r: gRecv.checked } } }).then(ok('Saved.')).catch(fail());
		gSend.onchange = saveGroup; gRecv.onchange = saveGroup;
		const cGroup = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Light group'),
			h('div', { class: 'note' }, 'Several LED4YOU lights on the same Wi-Fi can change together. Turn on "Lead" on the one you control and "Follow" on the others.'),
			h('label', { class: 'chk' }, gSend, ' Lead: send my changes to the other lights'),
			h('label', { class: 'chk' }, gRecv, ' Follow: copy changes from other lights'));

		// ---- power ----
		const pwBar = h('div', { class: 'pbar' }, h('i'));
		const pwTxt = h('span', {}, '');
		const pwNote = h('div', { class: 'note' }, '');
		const cPower = h('section', { class: 'card' }, h('div', { class: 'ct' }, 'Power ', pwTxt), pwBar, pwNote);

		// ---- fill in the current values ----
		let first = true;
		const render = () => {
			const x = st.x || {};
			nlInfo.textContent = x.nl > 0 ? 'off in ' + (x.nl >= 3600 ? Math.floor(x.nl / 3600) + ' h ' : '') + Math.ceil((x.nl % 3600) / 60) + ' min' : '';
			sunInfo.textContent = !x.tv ? 'The lights do not know the time yet. Saving sends the time from this phone.'
				: (x.geo ? 'Now ' + hhmm(x.now) + ' · sunset ' + hhmm(x.ss) + ' · sunrise ' + hhmm(x.sr) : 'Now ' + hhmm(x.now) + ' · tap "Use my location" for sunset times.');
			loopState.textContent = x.pl >= 0 ? 'running' : '';
			pirState.textContent = x.pir && x.pir.a ? 'scaring now' : '';
			cdState.textContent = x.cd && x.cd.on ? 'on' : '';
			if (x.ma > 0 && x.pwr >= 0) {
				const pc = Math.min(100, Math.round(100 * x.pwr / x.ma));
				pwBar.firstChild.style.width = pc + '%';
				pwBar.classList.toggle('hi', pc >= 90);
				pwTxt.textContent = x.pwr + ' / ' + x.ma + ' mA';
				pwNote.textContent = pc >= 90 ? 'At the limit: the lights are dimmed to protect the power supply.' : 'Estimated current. The limit is set in LED setup.';
			} else { pwTxt.textContent = x.pwr ? x.pwr + ' mA' : ''; pwNote.textContent = 'No current limit set. Set one in LED setup to protect the power supply.'; }
			const pk = JSON.stringify(st.p);
			if (pk !== renderScenes.k) { renderScenes.k = pk; renderScenes(); }
			if (!first) return;
			first = false;   // form fields: only once, so they do not jump while you edit them
			if (x.hs) { hsJoin.checked = !!x.hs.j; hsId.value = String(x.hs.id || 1); }
			const s = x.sch || {};
			onMode.set(s.om || 0); offMode.set(s.fm || 0);
			if (s.om === 1) onTime.value = hhmm(s.ot); else if (s.om === 2) onOff.value = s.ot;
			if (s.fm === 1) offTime.value = hhmm(s.ft); else if (s.fm === 2) offOff.value = s.ft;
			days = s.d === undefined ? 0x7F : s.d; updDays();
			schHouse.checked = !!s.h;
			onPs.fill(s.ops); updSch();
			if (x.cd && x.cd.n) cdName.value = x.cd.n;
			if (x.cd && x.cd.t) { const d = new Date((x.cd.t + new Date().getTimezoneOffset() * 60) * 1000); cdWhen.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
			if (x.pir) { pirOn.checked = !!x.pir.en; pirNight.checked = !!x.pir.nt; if (x.pir.pin >= 0) pirPin.value = x.pir.pin; pirDur.value = x.pir.dur || 15; pirPs.fill(x.pir.ps || 1); }
			if (x.sync) { gSend.checked = !!x.sync.s; gRecv.checked = !!x.sync.r; }
		};
		const refresh = () => t.status().then(s => { if (s) { st = s; render(); } }).catch(() => {});
		// give the lights this phone's time once, so timers and the countdown work without internet
		t.send({ time: Math.floor(Date.now() / 1000), l4y: { tz: -new Date().getTimezoneOffset() * 60 } }).catch(() => {}).finally(() => setTimeout(refresh, 500));
		const timer = setInterval(() => { if (document.body.contains(cPower)) refresh(); else clearInterval(timer); }, 4000);
		updDays(); updSch();
		return [cSleep, cSeasons, cHouse, cSched, cCount, cLoop, cSound, cPir, cGroup, cPower];
	}

	// ---------- GIF pack: original 16×16 animations hosted with the app ----------
	function gifPackCard(t, toast, base) {
		let stored = new Set();
		const prog = h('div', { class: 'note' });
		const grid = h('div', { class: 'gifpack' });
		const send = async (f, play) => {
			const name = f.f;
			if (!stored.has(name)) {
				prog.textContent = 'Sending ' + f.n + '…';
				const r = await fetch(base + name);
				if (!r.ok) throw new Error('download');
				const bytes = new Uint8Array(await r.arrayBuffer());
				const ok = await t.upload(name, bytes, play ? 1 : 0, p => { prog.textContent = 'Sending ' + f.n + '… ' + Math.round(p * 100) + '%'; });
				if (!ok) throw new Error('upload');
				stored.add(name);
			} else if (play) await t.send({ on: true, seg: { fx: 53, n: name, frz: false } });
			prog.textContent = '';
		};
		const card = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'GIF pack'),
			h('div', { class: 'note' }, 'Tap an animation to send it to the lights and play it. Made for matrices; on a strip it is squeezed into one line.'),
			grid, prog);
		const refreshStored = () => t.status ? t.status().then(s => { if (s && Array.isArray(s.g)) stored = new Set(s.g); }).catch(() => {}) : Promise.resolve();
		fetch(base + 'pack.json').then(r => r.json()).then(async pack => {
			await refreshStored();
			const themes = [...new Set(pack.map(f => f.t))];
			themes.forEach(th => {
				const list = pack.filter(f => f.t === th);
				const all = h('button', { type: 'button', class: 'btn small' }, 'Add all');
				all.onclick = async () => {
					all.disabled = true;
					try { for (const f of list) await send(f, false); toast(th + ': ' + list.length + ' animations stored on the lights.'); }
					catch (e) { toast('Stopped: not enough space or the lights did not answer.'); prog.textContent = ''; }
					all.disabled = false;
				};
				grid.append(h('div', { class: 'gphead' }, h('span', {}, th), all));
				list.forEach(f => {
					const b = h('button', { type: 'button', class: 'gpitem', title: f.n }, h('img', { src: base + f.f, alt: '', width: '64', height: '64' }), h('span', {}, f.n));
					b.onclick = async () => {
						b.disabled = true;
						try { await send(f, true); toast('Playing ' + f.n + '.'); }
						catch (e) { toast('Could not send ' + f.n + '.'); prog.textContent = ''; }
						b.disabled = false;
					};
					grid.append(b);
				});
			});
		}).catch(() => { grid.append(h('div', { class: 'note warnline' }, 'The GIF pack needs internet on this phone or computer.')); });
		return card;
	}

	// ---------- House (Wi-Fi only): every LED4YOU / WLED on the network, names, scenes, xLights ----------
	function houseCards(toast) {
		const list = h('div', { class: 'hlist' });
		const xl = h('div', { class: 'note' });
		const get = (ip, path) => fetch('http://' + ip + path, { cache: 'no-store' }).then(r => r.json());
		const post = (ip, path, obj) => fetch('http://' + ip + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
		const load = async () => {
			list.replaceChildren(h('div', { class: 'note' }, 'Looking for lights…'));
			let me, nodes = [];
			try { me = await (await fetch('/json/info', { cache: 'no-store' })).json(); } catch (e) {}
			try { nodes = (await (await fetch('/json/nodes', { cache: 'no-store' })).json()).nodes || []; } catch (e) {}
			const all = [{ name: me ? me.name : 'This light', ip: me ? me.ip : location.hostname, self: true }].concat(nodes.filter(n => !me || n.ip !== me.ip));
			list.replaceChildren();
			const rows = [];
			for (const n of all) {
				const name = h('input', { class: 'search', type: 'text', maxlength: '32', value: n.name || '' });
				const info = h('span', { class: 'note' }, n.ip);
				const chips = h('div', { class: 'pschips' });
				const rt = h('input', { type: 'checkbox' });
				const row = h('div', { class: 'housecard' },
					h('div', { class: 'hname' }, name, h('a', { class: 'btn small', href: 'http://' + n.ip + '/', target: '_blank', rel: 'noopener' }, 'Open')),
					info, chips,
					h('label', { class: 'chk' }, rt, ' xLights can control this light'));
				list.append(row);
				name.onchange = () => post(n.ip, '/json/cfg', { id: { name: name.value.trim() || 'LED4YOU' } }).then(() => toast('Name saved.')).catch(() => toast('Could not reach ' + n.ip + '.'));
				rt.onchange = () => post(n.ip, '/json/state', { l4y: { rt: rt.checked } }).then(() => toast('Saved.')).catch(() => toast('Could not reach ' + n.ip + '.'));
				// details from the light itself (answers with CORS, so this page can ask other lights)
				Promise.all([get(n.ip, '/json/si').catch(() => null), get(n.ip, '/presets.json').catch(() => null)]).then(([si, ps]) => {
					if (!si) { info.textContent = n.ip + ' · not answering'; return; }
					const leds = si.info && si.info.leds ? si.info.leds.count : 0;
					const isL4y = !!(si.state && si.state.l4y);
					info.textContent = n.ip + ' · ' + leds + ' LEDs' + (si.info && si.info.live ? ' · xLights playing now' : '') + (isL4y ? '' : ' · not LED4YOU (no scenes)');
					rt.checked = isL4y ? !!si.state.l4y.rt : true; rt.disabled = !isL4y;
					rows.push({ name: name.value, ip: n.ip, leds });
					chips.replaceChildren(...SCENES.map(([id, ic, name]) => h('span', { class: 'pschip' + (ps && ps[id] && ps[id].n ? ' has' : ''), title: name }, ic)));
					xl.replaceChildren(h('b', {}, 'In xLights (Setup → Controllers → Add Ethernet), one controller per light:'),
						h('div', { class: 'xltab' }, rows.map(r => h('div', {}, h('span', {}, r.name), h('span', {}, r.ip), h('span', {}, 'DDP'), h('span', {}, r.leds * 3 + ' channels')))));
				});
			}
			if (!nodes.length) list.append(h('div', { class: 'note' }, 'Only this light was found. Other lights appear here about a minute after they start. In Config → Sync Interfaces → Instance List, "Enable instance list" and "Make this instance discoverable" must be on (they are by default).'));
		};
		load();
		return [
			h('section', { class: 'card' },
				h('div', { class: 'ct' }, 'My house'),
				h('div', { class: 'note' }, 'Every light on your Wi-Fi. Give each one a clear name (Roof, Garden tree, Window…). The icons show which house scenes each light already has (bright = saved).'),
				list,
				h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: load }, 'Search again'))),
			h('section', { class: 'card' },
				h('div', { class: 'ct' }, 'xLights show'),
				h('div', { class: 'note' }, 'For shows timed to music, xLights on your computer sends the animation to every light at once. While it plays, the lights follow xLights; when it stops they go back to their own effect.'),
				xl)
		];
	}

	// ---------- Firmware update (Wi-Fi only): newest version from the LED4YOU site, one tap to install ----------
	const FW_URL = 'https://coristinaa.github.io/led4you/firmware/';
	function updateCard(toast) {
		const title = h('div', { class: 'ct' }, 'Update available');
		const info = h('div', { class: 'note' }, '');
		const notes = h('div', { class: 'note' }, '');
		const bar = h('div', { class: 'pbar' }, h('i'));
		const status = h('div', { class: 'note' }, '');
		const btn = h('button', { class: 'btn primary', type: 'button' }, 'Update now');
		bar.hidden = true;
		const card = h('section', { class: 'card upd', hidden: '' }, title, info, notes, h('div', { class: 'note warnline' }, 'Do not switch the lights off during the update.'), bar, status, h('div', { class: 'row' }, btn));
		let latest = null, armed = false;
		const setBar = f => { bar.hidden = false; bar.firstChild.style.width = Math.round(f * 100) + '%'; };
		// download the .bin from the site, counting the bytes so the bar moves
		const download = async () => {
			const r = await fetch(FW_URL + latest.update, { cache: 'no-store' });
			if (!r.ok) throw new Error('download');
			const total = +r.headers.get('content-length') || 1500000, rd = r.body.getReader(), parts = [];
			let got = 0;
			for (;;) {
				const { done, value } = await rd.read();
				if (done) break;
				parts.push(value); got += value.length;
				setBar(0.5 * Math.min(1, got / total)); status.textContent = 'Downloading the update… ' + Math.round(100 * Math.min(1, got / total)) + '%';
			}
			return new Blob(parts, { type: 'application/octet-stream' });
		};
		// send it to the lights' own update page (the same as Config → Security & Updates → Manual upload)
		const upload = blob => new Promise((ok, bad) => {
			const fd = new FormData();
			fd.append('update', blob, latest.update);
			const x = new XMLHttpRequest();
			x.open('POST', '/update');
			x.upload.onprogress = e => { if (e.lengthComputable) { setBar(0.5 + 0.5 * e.loaded / e.total); status.textContent = 'Sending to the lights… ' + Math.round(100 * e.loaded / e.total) + '%'; } };
			x.onload = () => x.status === 200 ? ok() : bad(new Error((x.responseText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || ('HTTP ' + x.status)));
			x.onerror = () => bad(new Error('network'));
			x.send(fd);
		});
		// after the restart, wait until the lights answer with the new version
		const waitBack = () => new Promise(done => {
			const t0 = Date.now();
			const tick = () => fetch('/json/state', { cache: 'no-store' }).then(r => r.json()).then(j => {
				if (j.l4y && j.l4y.fw >= latest.version) done(true); else throw 0;
			}).catch(() => { if (Date.now() - t0 < 90000) setTimeout(tick, 2500); else done(false); });
			setTimeout(tick, 6000);
		});
		btn.onclick = async () => {
			if (!armed) { armed = true; btn.textContent = 'Tap again to start'; setTimeout(() => { if (armed && !btn.disabled) { armed = false; btn.textContent = 'Update now'; } }, 4000); return; }
			btn.disabled = true; btn.hidden = true;
			try {
				const blob = await download();
				await upload(blob);
				setBar(1); status.textContent = 'Updated. The lights restart…';
				const ok = await waitBack();
				status.textContent = ok ? 'Done! LED4YOU v' + latest.version + ' is running.' : 'The lights restarted. Reload the page in a moment.';
				if (ok) { toast(status.textContent); setTimeout(() => location.reload(), 2500); }
			} catch (e) {
				status.textContent = e.message === 'download' || e.message === 'network' ? 'The update could not be downloaded. Check the internet on this phone or computer.' : 'The update failed: ' + e.message;
				btn.disabled = false; btn.hidden = false; armed = false; btn.textContent = 'Update now';
			}
		};
		Promise.all([
			fetch('/json/state', { cache: 'no-store' }).then(r => r.json()),
			fetch(FW_URL + 'latest.json', { cache: 'no-store' }).then(r => r.json())
		]).then(([st, lt]) => {
			const cur = (st.l4y && st.l4y.fw) || 0;   // 0: older LED4YOU that does not report its version yet
			if (!lt || !lt.version || lt.version <= cur || !lt.update) return;
			latest = lt;
			info.textContent = cur ? 'LED4YOU v' + lt.version + ' is ready (these lights have v' + cur + ').' : 'LED4YOU v' + lt.version + ' is ready.';
			notes.textContent = lt.notes || '';
			card.hidden = false;
			if (location.hash === '#update') card.scrollIntoView({ behavior: 'smooth' });
		}).catch(() => {});
		return card;
	}

	// ---------- Your own images and GIFs (used by the Studio page; the app has its own copy in the Images tab) ----------
	function myImagesCards(t, toast) {
		const inf = t.info();
		const isMatrix = !!(inf.mw && inf.mh);
		const W = isMatrix ? inf.mw : Math.max(1, inf.leds || 30), H = isMatrix ? inf.mh : 1;
		const cv = h('canvas', { class: 'imgprev', width: String(W), height: String(H) });
		const imgIn = h('input', { type: 'file', accept: 'image/*', hidden: '' });
		const imgMsg = h('div', { class: 'note' });
		let pixels = null;
		const keepBtn = h('button', { class: 'btn', type: 'button', hidden: '' }, 'Keep on the lights');
		imgIn.onchange = () => {
			const f = imgIn.files[0]; if (!f) return;
			const im = new Image();
			im.onload = async () => {
				const g = cv.getContext('2d');
				g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
				// fit the whole picture inside the LEDs, keeping its shape
				const k = Math.min(W / im.width, H / im.height), w = Math.max(1, Math.round(im.width * k)), hh = Math.max(1, Math.round(im.height * k));
				g.imageSmoothingQuality = 'high';
				g.drawImage(im, Math.floor((W - w) / 2), Math.floor((H - hh) / 2), w, hh);
				const d = g.getImageData(0, 0, W, H).data;
				pixels = [];
				for (let i = 0; i < W * H; i++) pixels.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
				URL.revokeObjectURL(im.src);
				imgMsg.textContent = 'Sending…';
				try {
					const hex = pixels.map(c => c.map(v => v.toString(16).padStart(2, '0')).join(''));
					for (let i = 0; i < hex.length; i += 120) await t.send({ on: true, seg: { i: [i, ...hex.slice(i, i + 120)] } });
					imgMsg.textContent = 'Showing your image. Tap "Keep on the lights" to keep it after a restart.';
					keepBtn.hidden = false;
				} catch (e) { imgMsg.textContent = 'Could not send.'; }
				imgIn.value = '';
			};
			im.src = URL.createObjectURL(f);
		};
		// keep: store the picture as the My LEDs table (fixed colours), so it comes back after a restart
		keepBtn.onclick = async () => {
			if (!pixels) return;
			const n = Math.min(pixels.length, 1024), b = new Uint8Array(6 + n * 6);
			b.set([76, 52, 89, 1, n & 255, n >> 8]);
			for (let i = 0; i < n; i++) b.set([pixels[i][0], pixels[i][1], pixels[i][2], 0, 128, 0], 6 + i * 6);
			imgMsg.textContent = 'Sending…';
			try { imgMsg.textContent = await t.upload('myleds.bin', b, 2) ? 'Kept. It is now your My LEDs design.' : 'The lights did not accept the design. Try again.'; }
			catch (e) { imgMsg.textContent = 'Could not send.'; }
		};
		const cImg = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Your image ', h('span', {}, W + '×' + H)),
			h('div', { class: 'note' }, 'Pick a photo or drawing. It is shrunk to your LEDs and shown right away.'),
			h('div', { class: 'imgwrap' }, cv),
			h('div', { class: 'row' }, h('label', { class: 'btn primary' }, 'Choose image', imgIn), keepBtn),
			imgMsg);

		// own GIF
		const gifIn = h('input', { type: 'file', accept: 'image/gif', hidden: '' });
		const gifMsg = h('div', { class: 'note' });
		const cleanName = n => {
			let b = n.toLowerCase().replace(/\.gif$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 26) || 'my-gif';
			if (b.length < 1) b = 'my-gif';
			return b + '.gif';
		};
		gifIn.onchange = async () => {
			const f = gifIn.files[0]; if (!f) return;
			gifIn.value = '';
			if (f.size > 65536) { gifMsg.textContent = 'This GIF is ' + Math.round(f.size / 1024) + ' KB. The limit is 64 KB: use a smaller one (made for LED matrices).'; return; }
			const name = cleanName(f.name);
			try {
				const ok = await t.upload(name, new Uint8Array(await f.arrayBuffer()), 1, p => { gifMsg.textContent = 'Sending… ' + Math.round(p * 100) + '%'; });
				gifMsg.textContent = ok ? 'Playing ' + name + '.' : 'The lights could not save the GIF.';
				if (ok) setTimeout(loadList, 800);
			} catch (e) { gifMsg.textContent = 'Could not send the GIF.'; }
		};
		const cGif = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Your GIF'),
			h('div', { class: 'note' }, 'Small GIFs made for LED matrices work best (up to 64 KB). The lights resize them to fit.'),
			h('div', { class: 'row' }, h('label', { class: 'btn primary' }, 'Choose GIF', gifIn)),
			gifMsg);

		// GIFs stored on the lights
		const list = h('div', { class: 'giflist2' });
		const loadList = () => (t.status ? t.status() : Promise.resolve(null)).then(s => {
			const g = (s && s.g) || [];
			if (!g.length) { list.replaceChildren(h('div', { class: 'note' }, 'No GIFs stored yet.')); return; }
			list.replaceChildren(...g.map(name => {
				const del = h('button', { type: 'button', class: 'btn small' }, 'Delete');
				del.onclick = async () => {
					if (del.dataset.c !== '1') { del.dataset.c = '1'; del.textContent = 'Tap to confirm'; setTimeout(() => { del.dataset.c = ''; del.textContent = 'Delete'; }, 3000); return; }
					try { if (!t.remove) throw 0; await t.remove(name); toast(name + ' deleted.'); setTimeout(loadList, 600); } catch (e) { toast('Could not delete.'); }
				};
				return h('div', { class: 'gifrow2' }, h('span', { 'data-notr': '' }, name),
					h('button', { type: 'button', class: 'btn small', onclick: () => t.send({ on: true, seg: { fx: 53, n: name, frz: false } }).then(() => toast('Playing ' + name + '.')).catch(() => toast('Could not send.')) }, 'Play'),
					del);
			}));
		}).catch(() => {});
		loadList();
		const cList = h('section', { class: 'card' }, h('div', { class: 'ct' }, 'On the lights'), list);
		return [cImg, cGif, cList];
	}

	// ---------- "?" help on card titles ----------
	const HELP = {
		'Live on your lights': 'What your lights show right now, updated several times a second.',
		'Color': 'The main colour used by most effects. Tap a circle for a quick colour.',
		'Effect': 'The animation. Tap one to see it on your lights. The sliders below change with the effect and only show what that effect uses.',
		'Palette': 'A set of colours that many effects blend through. Effects that only use your colour hide this card.',
		'Presets': 'Save what the lights show now under a number (Save), and bring it back later with one tap.',
		'Text': 'Scrolls a message across a LED matrix.',
		'My LEDs': 'Give every LED its own colour and behaviour. Select: pick LEDs and edit them. Draw: paint with your finger. Erase: switch LEDs off.',
		'Pixel art': 'Shows a photo or drawing on your LEDs.',
		'Your image': 'Shows a photo or drawing on your LEDs. "Keep on the lights" keeps it after a restart.',
		'GIF animation': 'Plays an animated GIF, best on a matrix.',
		'Your GIF': 'Plays an animated GIF, best on a matrix.',
		'On the lights': 'Animations stored on the lights. Play one or delete it to free space.',
		'Sleep timer': 'Slowly dims and switches the lights off after the time you pick.',
		'Seasons': 'Ready-made looks for Halloween and Christmas. Tap one; if you like it, save it as a preset.',
		'Schedule': 'Switches the lights on and off by themselves every day, at a set time or with the sunset and sunrise.',
		'Countdown': 'Counts down to a date on a matrix, for example to Christmas.',
		'Preset loop': 'Plays your saved presets one after another, again and again.',
		'Sound': 'Effects that move with music. They need a microphone connected to the board.',
		'Motion scare': 'With a motion sensor connected, plays a preset when someone walks by.',
		'Light group': 'Makes several lights copy each other over Wi-Fi.',
		'Power': 'How much current the LEDs use now, compared with your power supply limit.',
		'LED setup': 'Tells the board how your LEDs are connected. Wrong values here give wrong colours or no light at all.',
		'My house': 'Every LED4YOU light on your Wi-Fi, with its name and the scenes it already has.',
		'xLights show': 'For shows timed to music made in xLights on a computer.'
	};
	function helpify(root) {
		(root || document.body).querySelectorAll('.ct:not([data-help])').forEach(ct => {
			const first = [...ct.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
			const key = first && (first.l4yKey || first.nodeValue.trim());
			const text = key && HELP[key];
			ct.dataset.help = '';
			if (!text) return;
			const tip = h('div', { class: 'helptip', hidden: '' }, text);
			const b = h('button', { type: 'button', class: 'helpbtn', 'aria-label': 'What is this?', title: 'What is this?', onclick: () => { tip.hidden = !tip.hidden; b.classList.toggle('on', !tip.hidden); } }, '?');
			ct.append(b);
			ct.after(tip);
		});
	}
	// help for everything already on the page and for cards added later
	function autoHelp() {
		helpify(document.body);
		new MutationObserver(() => helpify(document.body)).observe(document.body, { childList: true, subtree: true });
	}

	window.L4YStudio = {
		textCard,
		helpify,
		autoHelp,
		myImagesCards,
		updateCard,
		myLedsCards,
		extrasCards,
		gifPackCard,
		houseCards,
		preview: PV.mini,
		palAt: PV.palAt,
		// styles shared by both pages (they already define the colour tokens)
		css: `
.card input[type=range] { --fill: var(--hot); }
.lab { font-size: 13px; color: var(--muted); display: block; margin-bottom: 6px; }
.rowc { display: flex; gap: 14px; align-items: center; margin: 4px 0 12px; flex-wrap: wrap; }
.grow { flex: 1; min-width: 160px; }
.colbtn { width: 56px; height: 56px; flex: none; border: 0; padding: 0; background: none; border-radius: 50%; cursor: pointer; }
.colbtn::-webkit-color-swatch-wrapper { padding: 0; }
.colbtn::-webkit-color-swatch { border: 2px solid var(--line); border-radius: 50%; }
.colbtn::-moz-color-swatch { border: 2px solid var(--line); border-radius: 50%; }
.warnline { color: var(--amber); margin-bottom: 10px; }
.gridwrap { overflow-x: auto; margin: 12px 0; }
.ledgrid { display: grid; gap: 4px; min-width: min-content; }
.led { aspect-ratio: 1; min-width: 22px; border-radius: 6px; border: 1px solid var(--line); font-size: 10px; color: rgba(255,255,255,.8); text-shadow: 0 0 3px #000; padding: 0; }
.led.on { outline: 2px solid var(--cyan); outline-offset: 1px; }
.emos { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.emo { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--raise); font-size: 20px; padding: 0; }
.emo:active { transform: scale(.92); }
.txtpv { display: block; width: 100%; border-radius: 10px; }
.segs { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
.seg { padding: 8px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--raise); font-size: 14px; }
.seg.sel { background: var(--ag); color: #fff; border-color: transparent; }
.chk { display: flex; gap: 8px; align-items: center; font-size: 14px; color: var(--muted); margin: 10px 0 14px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.btn[disabled] { opacity: .45; cursor: not-allowed; }
.tools { margin-bottom: 8px; }
.ledgrid.drawing { touch-action: none; cursor: crosshair; }
.ledgrid.drawing .led { pointer-events: auto; }
.fld { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); margin-top: 10px; }
.card select, .card input[type=time], .card input[type=number], .card input[type=datetime-local] { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--raise); color: var(--fg); font: inherit; }
.lab.sp { margin-top: 14px; }
.seg.day { min-width: 38px; text-align: center; padding: 8px 0; }
.pins { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
.themes { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; margin-top: 6px; }
.theme { padding: 14px 10px; border-radius: 14px; border: 1px solid var(--line); background: var(--raise); font-weight: 600; text-align: left; }
.theme.halloween { background: linear-gradient(135deg, #3a1a05, #24123a); border-color: #6b3510; }
.theme.christmas { background: linear-gradient(135deg, #3a0a0f, #0c3018); border-color: #5a1a20; }
.theme.sound { background: linear-gradient(135deg, #0b2a3a, #2a0b3a); border-color: #1d4660; }
.theme:active { transform: scale(.97); }
.theme { display: flex; flex-direction: column; gap: 8px; }
canvas.pv { display: block; width: 104px; max-width: 100%; height: 12px; border-radius: 6px; }
.sc-pv { align-self: stretch; display: flex; flex-direction: column; gap: 3px; margin: 6px 0 2px; }
.sc-pv canvas.pv { width: 100%; }
.sc-pv small { font-size: 11px; color: var(--muted); font-weight: 500; }
details.more { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 10px; }
details.more summary { cursor: pointer; font-weight: 600; color: var(--fg); }
.pbar { height: 12px; border-radius: 999px; background: var(--raise); overflow: hidden; border: 1px solid var(--line); }
.pbar i { display: block; height: 100%; width: 0; background: var(--ag); transition: width .4s; }
.pbar.hi i { background: var(--amber); }
.imgwrap { margin: 10px 0; display: flex; justify-content: center; background: #000; border-radius: 12px; padding: 8px; }
.imgprev { width: 100%; max-width: 320px; image-rendering: pixelated; }
.giflist2 { display: flex; flex-direction: column; gap: 6px; }
.gifrow2 { display: flex; gap: 8px; align-items: center; }
.gifrow2 span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ct { align-items: center; }
.helpbtn { margin-left: 8px; width: 22px; height: 22px; flex: none; border-radius: 50%; border: 1px solid var(--line); background: var(--raise); color: var(--muted); font-size: 12px; font-weight: 700; padding: 0; line-height: 20px; text-transform: none; letter-spacing: 0; }
.helpbtn.on { background: var(--violet); color: #fff; border-color: transparent; }
.helptip { font-size: 13px; color: var(--fg); background: var(--raise); border-left: 3px solid var(--violet); border-radius: 8px; padding: 8px 10px; margin: -4px 0 10px; }
.card.upd { border-color: var(--cyan); background: linear-gradient(135deg, #0b2a3a, #171a22 60%); }
.gifpack { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; margin-top: 8px; }
.gphead { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 13px; color: var(--muted); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.btn.small { padding: 6px 12px; font-size: 13px; text-transform: none; letter-spacing: 0; }
.gpitem { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 14px; border: 1px solid var(--line); background: var(--raise); font-size: 12px; }
.gpitem img { width: 64px; height: 64px; image-rendering: pixelated; border-radius: 6px; background: #000; }
.gpitem[disabled] { opacity: .5; }
.steps { margin: 0 0 10px; padding-left: 20px; font-size: 14px; color: var(--muted); display: grid; gap: 4px; }
.scenes { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.scene { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--raise); }
.scene.has { border-color: var(--violet); background: linear-gradient(135deg, #1a1440, #0b2a3a); }
.sc-play { flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 12px; border: 0; background: none; text-align: left; }
.sc-ic { font-size: 26px; line-height: 1; }
.sc-name { font-weight: 700; }
.sc-st { font-size: 12px; color: var(--muted); }
.scene.has .sc-st { color: var(--cyan); }
.sc-save { border: 0; border-top: 1px solid var(--line); background: rgba(255,255,255,.04); padding: 8px; font-size: 13px; color: var(--fg); }
.sc-off { grid-column: 1 / -1; padding: 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--raise); font-weight: 600; }
.hlist { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.housecard { border: 1px solid var(--line); border-radius: 14px; padding: 10px; background: var(--raise); display: flex; flex-direction: column; gap: 6px; }
.housecard .search { margin: 0; flex: 1; }
.hname { display: flex; gap: 8px; align-items: center; }
.hname a.btn { text-decoration: none; color: var(--fg); }
.housecard .chk { margin: 0; }
.pschips { display: flex; gap: 4px; flex-wrap: wrap; }
.pschip { min-width: 28px; text-align: center; font-size: 16px; opacity: .35; padding: 2px 4px; border-radius: 6px; border: 1px solid var(--line); color: var(--muted); }
.pschip.has { opacity: 1; background: var(--violet); border-color: transparent; }
.xltab { display: grid; gap: 4px; margin-top: 8px; font-size: 13px; }
.xltab div { display: grid; grid-template-columns: 1.3fr 1.2fr .6fr 1fr; gap: 6px; padding: 6px 8px; background: var(--raise); border-radius: 8px; }
`
	};
})();
