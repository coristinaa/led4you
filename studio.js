/*
 * LED4YOU Studio: "Text" and "My LEDs" editors.
 * Shared by the LED4YOU app (Bluetooth) and the /studio page on the lights (Wi-Fi).
 * The page supplies a transport object:
 *   send(obj)                          -> Promise   send a WLED JSON state command
 *   upload(name, bytes, action, prog)  -> Promise<boolean>   store a file on the lights
 *                                         (action 2 = load the My LEDs table and start the effect)
 *   info()                             -> { leds, mw, mh, mfx }   LED count, matrix size, My LEDs effect id
 *   loadTable()                        -> Promise<Uint8Array|null> current /myleds.bin (optional)
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
	function textCard(t, toast) {
		const inf = t.info();
		const txt = h('input', { class: 'search', id: 'stText', type: 'text', maxlength: '60', placeholder: 'HAPPY HALLOWEEN' });
		const col = h('input', { id: 'stTextCol', type: 'color', value: '#ff7a00', class: 'colbtn', 'aria-label': 'Text color' });
		const spd = track(h('input', { id: 'stTextSpd', type: 'range', min: '0', max: '255', value: '128', 'aria-label': 'Speed' }));
		const size = track(h('input', { id: 'stTextSize', type: 'range', min: '0', max: '255', value: '128', 'aria-label': 'Letter size' }));
		const warn = h('div', { class: 'note warnline' }, 'Text needs a matrix. Set the matrix size in LED setup first.');
		warn.hidden = !!(inf.mw && inf.mh);
		const send = () => {
			const s = txt.value.trim();
			if (!s) { toast('Type a message first.'); return; }
			t.send({ on: true, seg: { fx: TEXT_FX, n: s, sx: +spd.value, c2: +size.value, col: [hexToRgb(col.value)] } })
				.then(() => toast('Showing your text.')).catch(() => toast('Could not send the text.'));
		};
		return h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Text'),
			warn,
			h('label', { for: 'stText', class: 'lab' }, 'Message'),
			txt,
			h('div', { class: 'rowc' }, col, h('div', { class: 'grow' },
				h('div', { class: 'lbl' }, h('span', {}, 'Speed')), spd,
				h('div', { class: 'lbl' }, h('span', {}, 'Letter size')), size)),
			h('button', { class: 'btn primary', type: 'button', onclick: send }, 'Show text'));
	}

	// ---------- My LEDs ----------
	function myLedsCards(t, toast) {
		const inf = t.info();
		const isMatrix = !!(inf.mw && inf.mh);
		const count = Math.max(1, Math.min(MAX_LEDS, isMatrix ? inf.mw * inf.mh : (inf.leds || 30)));
		const cols = isMatrix ? inf.mw : Math.min(10, count);
		const KEY = 'l4yMyLeds' + count;
		// one entry per LED: [r, g, b, mode, speed, phase]
		let leds = Array.from({ length: count }, () => [40, 40, 60, 0, 128, 0]);
		try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (Array.isArray(s) && s.length === count) leds = s; } catch (e) {}
		const sel = new Set();
		const save = () => { try { localStorage.setItem(KEY, JSON.stringify(leds)); } catch (e) {} };

		const grid = h('div', { class: 'ledgrid', role: 'grid', 'aria-label': 'LEDs' });
		grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
		const cells = leds.map((l, i) => {
			const b = h('button', { type: 'button', class: 'led', title: 'LED ' + (i + 1), 'aria-label': 'LED ' + (i + 1) });
			if (!isMatrix) b.textContent = i + 1;
			b.onclick = () => { sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('on', sel.has(i)); updSel(); };
			grid.append(b); return b;
		});
		const selInfo = h('span', {}, 'No LEDs selected');
		const updSel = () => { selInfo.textContent = sel.size ? sel.size + ' selected' : 'No LEDs selected'; applyBtn.disabled = !sel.size; };
		const selectAll = () => { cells.forEach((c, i) => { sel.add(i); c.classList.add('on'); }); updSel(); };
		const selectNone = () => { sel.clear(); cells.forEach(c => c.classList.remove('on')); updSel(); };

		// editor for the selected LEDs
		const col = h('input', { id: 'stLedCol', type: 'color', value: '#ff2e93', class: 'colbtn', 'aria-label': 'LED color' });
		let mode = 0;
		const modeBtns = MODES.map(m => h('button', { type: 'button', class: 'seg' + (m.id === 0 ? ' sel' : ''), onclick: () => { mode = m.id; modeBtns.forEach((b, j) => b.classList.toggle('sel', j === m.id)); } }, m.name));
		const spd = track(h('input', { id: 'stLedSpd', type: 'range', min: '0', max: '255', value: '128', 'aria-label': 'Speed' }));
		const wave = h('input', { id: 'stWave', type: 'checkbox' });
		const applyBtn = h('button', { class: 'btn primary', type: 'button', disabled: '' }, 'Apply to selected');
		applyBtn.onclick = () => {
			const c = hexToRgb(col.value), idx = [...sel].sort((a, b) => a - b);
			idx.forEach((i, k) => { leds[i] = [c[0], c[1], c[2], mode, +spd.value, wave.checked ? Math.round(k * 256 / idx.length) & 255 : 0]; });
			save(); toast('Applied. Tap "Send to lights" to see it.');
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
				else if (l[3] === 3) c = (hash(i * 7919 + Math.floor(tt / period)) & 3) ? fade(c, 24) : fade(c, 24 + (sin8((pos - 64) & 255) * 231 >> 8));
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
		sendBtn.onclick = async () => {
			sendBtn.disabled = true; prog.textContent = 'Sending…';
			try {
				const ok = await t.upload('myleds.bin', toBin(), 2, p => { prog.textContent = 'Sending… ' + Math.round(p * 100) + '%'; });
				prog.textContent = ok ? 'Done. Your design is playing and stays saved on the lights.' : 'The lights did not accept the design. Try again.';
			} catch (e) { prog.textContent = 'Could not send. Move closer and try again.'; }
			sendBtn.disabled = false;
		};
		const clearAll = () => { leds = leds.map(() => [0, 0, 0, 0, 128, 0]); save(); toast('All LEDs set to off.'); };

		// start from the design stored on the lights when the page can read it (Wi-Fi)
		if (t.loadTable) t.loadTable().then(b => {
			if (!b || b.length < 6 || b[0] !== 76 || b[1] !== 52 || b[2] !== 89) return;
			const n = Math.min(count, b[4] | (b[5] << 8));
			for (let i = 0; i < n; i++) leds[i] = Array.from(b.slice(6 + i * 6, 12 + i * 6));
		}).catch(() => {});

		return [
			h('section', { class: 'card' },
				h('div', { class: 'ct' }, 'My LEDs ', h('span', {}, count + (isMatrix ? ' (' + inf.mw + '×' + inf.mh + ')' : ' LEDs'))),
				h('div', { class: 'note' }, 'Tap LEDs to select them, then pick a color and how they behave.'),
				h('div', { class: 'gridwrap' }, grid),
				h('div', { class: 'row' },
					h('button', { class: 'btn', type: 'button', onclick: selectAll }, 'Select all'),
					h('button', { class: 'btn', type: 'button', onclick: selectNone }, 'Clear selection'),
					selInfo)),
			h('section', { class: 'card' },
				h('div', { class: 'ct' }, 'Selected LEDs'),
				h('div', { class: 'rowc' }, col, h('div', { class: 'segs' }, modeBtns)),
				h('div', { class: 'lbl' }, h('span', {}, 'Speed'), h('span', {}, 'slow → fast')), spd,
				h('label', { class: 'chk' }, wave, ' Wave: stagger the timing along the selection'),
				applyBtn),
			h('section', { class: 'card' },
				h('div', { class: 'row' }, sendBtn, h('button', { class: 'btn', type: 'button', onclick: clearAll }, 'Turn all off')),
				prog)
		];
	}

	window.L4YStudio = {
		textCard,
		myLedsCards,
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
.segs { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
.seg { padding: 8px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--raise); font-size: 14px; }
.seg.sel { background: var(--ag); color: #fff; border-color: transparent; }
.chk { display: flex; gap: 8px; align-items: center; font-size: 14px; color: var(--muted); margin: 10px 0 14px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.btn[disabled] { opacity: .45; cursor: not-allowed; }
`
	};
})();
