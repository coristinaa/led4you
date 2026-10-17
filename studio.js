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
			t.send({ on: true, seg: { fx: TEXT_FX, n: s, sx: +spd.value, c2: +size.value, col: [hexToRgb(col.value)] }, l4y: { cd: { on: false } } })
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
		const stopDraw = () => { if (!drawing) return; drawing = false; save(); clearTimeout(flushTimer); flush(); };
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
				liveReady = false;
			} catch (e) { prog.textContent = 'Could not send. Move closer and try again.'; }
			sendBtn.disabled = false;
		};
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

	// ---------- Extras: timer, schedule, seasons, countdown, preset loop, sound, motion, group, power ----------
	const pad = n => String(n).padStart(2, '0');
	const hhmm = m => m < 0 ? '--:--' : pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
	const toMin = v => { const [a, b] = (v || '0:0').split(':'); return (+a) * 60 + (+b); };
	const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	// built-in WLED effects used by the themes and the sound list (ids from WLED FX.h)
	const FX = { candle: 88, eyes: 82, lightning: 57, colortwinkle: 74, twinklefox: 80, fire: 66, scroll: 122 };
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
				fm: offMode.value, ft: offMode.value === 1 ? toMin(offTime.value) : +offOff.value, d: days };
			t.send({ time: Math.floor(Date.now() / 1000), l4y: { tz: -new Date().getTimezoneOffset() * 60, sch } }).then(ok('Schedule saved on the lights.')).catch(fail());
		};
		const cSched = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Schedule'),
			h('div', { class: 'lab' }, 'Switch on'), onMode, onTimeF, onOffF, onPsF,
			h('div', { class: 'lab sp' }, 'Switch off'), offMode, offTimeF, offOffF,
			h('div', { class: 'lab sp' }, 'Days'), h('div', { class: 'segs' }, dayBtns),
			sunInfo,
			h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: saveSch }, 'Save schedule'), geoBtn));

		// ---- seasonal themes ----
		const xfx = i => (st.x.xfx || [])[i];
		const THEMES = [
			['Halloween', [
				['Pumpkin glow', () => ({ fx: FX.candle, sx: 96, ix: 224, pal: 0, col: [[255, 90, 0], [0, 0, 0]] })],
				['Haunted', () => ({ fx: xfx(2), sx: 160, ix: 96, col: [[255, 106, 16]] })],
				['Spooky eyes', () => ({ fx: FX.eyes, sx: 128, ix: 128, pal: 0, col: [[255, 0, 0], [0, 0, 0]] })],
				['Storm', () => ({ fx: FX.lightning, sx: 128, ix: 128, pal: 0, col: [[200, 220, 255], [0, 0, 20]] })],
				['Witch brew', () => ({ fx: FX.colortwinkle, sx: 128, ix: 128, pal: 5, col: [[120, 0, 255], [40, 255, 0], [255, 80, 0]] })]]],
			['Christmas', [
				['Retro tree', () => ({ fx: xfx(3), sx: 96, ix: 128 })],
				['Candy cane', () => ({ fx: xfx(0), sx: 64, ix: 48, col: [[255, 0, 0], [255, 255, 255]] })],
				['Snowfall', () => ({ fx: xfx(1), sx: 128, ix: 96, col: [[255, 255, 255], [0, 0, 24]] })],
				['Merry twinkle', () => ({ fx: FX.twinklefox, sx: 128, ix: 128, pal: 5, col: [[255, 0, 0], [0, 200, 30], [255, 180, 60]] })],
				['Fireplace', () => ({ fx: FX.fire, sx: 64, ix: 160, pal: 35 })]]]
		];
		const cSeasons = h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Seasons'),
			THEMES.flatMap(([group, list]) => [h('div', { class: 'lab sp' }, group), h('div', { class: 'themes' }, list.map(([name, f]) => h('button', {
				type: 'button', class: 'theme ' + group.toLowerCase(), onclick: () => {
					const seg = f();
					if (seg.fx === undefined || seg.fx === 255) { toast('Update the lights to the newest LED4YOU for this theme.'); return; }
					t.send({ on: true, seg, l4y: { cd: { on: false } } }).then(ok(name + ' is on. Save it as a preset to keep it.')).catch(fail());
				}
			}, name)))]));

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
			t.send({ on: true, time: Math.floor(Date.now() / 1000), seg: { fx: FX.scroll, col: [hexToRgb(cdCol.value)] },
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

		// ---- preset loop (temporary playlist of the saved presets) ----
		const loopSec = track(h('input', { type: 'range', min: '5', max: '600', step: '5', value: '60', 'aria-label': 'Seconds per preset' }));
		const loopLbl = h('span', {}, '60 s');
		loopSec.addEventListener('input', () => { loopLbl.textContent = loopSec.value >= 60 ? (loopSec.value / 60).toFixed(loopSec.value % 60 ? 1 : 0) + ' min' : loopSec.value + ' s'; });
		const loopState = h('span', {}, '');
		const startLoop = () => {
			const ids = st.p.map(p => p[0]);
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
			h('div', { class: 'themes' }, SOUND_FX.map(([n, id]) => h('button', { type: 'button', class: 'theme sound', onclick: () => t.send({ on: true, seg: { fx: id } }).then(ok(n + ' is on.')).catch(fail()) }, n))),
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
			if (!first) return;
			first = false;   // form fields: only once, so they do not jump while you edit them
			const s = x.sch || {};
			onMode.set(s.om || 0); offMode.set(s.fm || 0);
			if (s.om === 1) onTime.value = hhmm(s.ot); else if (s.om === 2) onOff.value = s.ot;
			if (s.fm === 1) offTime.value = hhmm(s.ft); else if (s.fm === 2) offOff.value = s.ft;
			days = s.d === undefined ? 0x7F : s.d; updDays();
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
		return [cSleep, cSeasons, cSched, cCount, cLoop, cSound, cPir, cGroup, cPower];
	}

	window.L4YStudio = {
		textCard,
		myLedsCards,
		extrasCards,
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
details.more { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 10px; }
details.more summary { cursor: pointer; font-weight: 600; color: var(--fg); }
.pbar { height: 12px; border-radius: 999px; background: var(--raise); overflow: hidden; border: 1px solid var(--line); }
.pbar i { display: block; height: 100%; width: 0; background: var(--ag); transition: width .4s; }
.pbar.hi i { background: var(--amber); }
`
	};
})();
