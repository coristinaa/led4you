/*
 * LED4YOU camera scan: finds where every LED is, like the Twinkly mapping.
 * The phone films the lights while the app switches the LEDs on one at a time; the brightest
 * new spot in the picture is that LED. The result is kept on the phone (for "See it") and can
 * be sent to the lights as ledmap.json, so matrix effects, text and pictures follow the real shape.
 *
 * L4YScan.mount(box, opts)
 *   opts.key       () -> string     name of the lights (where the scan is kept)
 *   opts.count     () -> number     physical LED count
 *   opts.state     () -> {fx, bri, on}
 *   opts.send      obj -> Promise   WLED JSON state command
 *   opts.upload    (name, bytes, action) -> Promise<boolean>
 *   opts.remove    name -> Promise<boolean>
 *   opts.hasMap    () -> boolean    ledmap.json is on the lights
 *   opts.toast     text -> void
 *   opts.done      scan -> void     called after a scan is saved
 * L4YScan.load(key) -> { n, pts:[[x,y]|null..], ar, photo } | null
 */
(function () {
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
	const wait = ms => new Promise(r => setTimeout(r, ms));
	const KEY = k => 'l4yScan:' + k;
	const load = k => { try { return JSON.parse(localStorage.getItem(KEY(k)) || 'null'); } catch (e) { return null; } };
	const save = (k, s) => {
		try { localStorage.setItem(KEY(k), JSON.stringify(s)); return true; }
		catch (e) { try { localStorage.setItem(KEY(k), JSON.stringify(Object.assign({}, s, { photo: null }))); } catch (e2) {} return false; }
	};

	// LEDs that were not seen: placed between their neighbours along the string
	const fillGaps = pts => {
		const known = pts.map((p, i) => p ? i : -1).filter(i => i >= 0);
		if (!known.length) return pts;
		return pts.map((p, i) => {
			if (p) return p;
			let a = -1, b = -1;
			for (const k of known) { if (k < i) a = k; else { b = k; break; } }
			if (a < 0) return pts[b].slice(); if (b < 0) return pts[a].slice();
			const f = (i - a) / (b - a); return [pts[a][0] + (pts[b][0] - pts[a][0]) * f, pts[a][1] + (pts[b][1] - pts[a][1]) * f];
		});
	};

	// a WLED ledmap: a grid of at most 1024 cells, each LED in its own cell (nearest free one)
	const makeMap = (pts, ar) => {
		const xs = pts.map(p => p[0] * ar), ys = pts.map(p => p[1]);
		const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(1e-3, Math.max(...xs) - x0), bh = Math.max(1e-3, Math.max(...ys) - y0);
		const n = pts.length, cells = Math.min(1024, Math.max(n * 2.2, 64));
		let W = Math.max(4, Math.round(Math.sqrt(cells * bw / bh))), H = Math.max(4, Math.round(cells / W));
		while (W * H > 1024) { if (W > H) W--; else H--; }
		if (W * H < n) return null;
		const map = new Array(W * H).fill(-1);
		pts.forEach((p, i) => {
			const cx = Math.min(W - 1, Math.round(((xs[i] - x0) / bw) * (W - 1))), cy = Math.min(H - 1, Math.round(((ys[i] - y0) / bh) * (H - 1)));
			for (let r = 0; r < W + H; r++) {   // nearest free cell, growing rings
				let best = -1, bd = 1e9;
				for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
					if (map[y * W + x] >= 0) continue; const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; best = y * W + x; }
				}
				if (best >= 0) { map[best] = i; return; }
			}
		});
		return { W, H, map };
	};

	function mount(box, opts) {
		const video = h('video', { playsinline: '', muted: '', autoplay: '', class: 'scan-video' });
		video.muted = true;
		const over = h('canvas', { class: 'scan-over' });
		const stage = h('div', { class: 'scan-stage' }, video, over);
		const msg = h('div', { class: 'note' }, '');
		const bar = h('div', { class: 'scan-bar' }, h('i', {}));
		const startBtn = h('button', { class: 'btn primary', type: 'button' }, 'Start the scan');
		const camBtn = h('button', { class: 'btn', type: 'button' }, 'Turn on the camera');
		const stopBtn = h('button', { class: 'btn', type: 'button', hidden: '' }, 'Stop');
		const result = h('div', {});
		let stream = null, running = false, stop = false;
		const work = document.createElement('canvas'), wg = work.getContext('2d', { willReadFrequently: true });
		const status = t => { msg.textContent = t; };

		const camera = async () => {
			if (stream) return true;
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { opts.toast('This browser cannot use the camera here.'); return false; }
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
				video.srcObject = stream; await video.play();
				stage.classList.add('on'); camBtn.hidden = true;
				status('Point the camera at all the lights and keep the phone still (lean it on something). A darker room or the evening works best.');
				return true;
			} catch (e) { opts.toast('The camera was not allowed.'); return false; }
		};
		const closeCam = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; stage.classList.remove('on'); camBtn.hidden = false; };

		// one small grey picture of what the camera sees now
		const grab = () => {
			const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return null;
			const W = 240, H = Math.round(240 * vh / vw);
			if (work.width !== W) { work.width = W; work.height = H; }
			wg.drawImage(video, 0, 0, W, H);
			const d = wg.getImageData(0, 0, W, H).data, g = new Float32Array(W * H);
			for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = d[i] + d[i + 1] + d[i + 2];
			return { W, H, g };
		};
		const frame = () => new Promise(r => { if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => r(grab())); else setTimeout(() => r(grab()), 40); });
		// the brightest new spot compared with the dark picture
		const spot = (f, base) => {
			const { W, H, g } = f; let best = 0, bi = -1;
			for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				const v = (g[i] - base[i]) * 2 + (g[i - 1] - base[i - 1]) + (g[i + 1] - base[i + 1]) + (g[i - W] - base[i - W]) + (g[i + W] - base[i + W]);
				if (v > best) { best = v; bi = i; }
			}
			if (bi < 0) return null;
			let sx = 0, sy = 0, sw = 0; const bx = bi % W, by = (bi / W) | 0;
			for (let y = Math.max(0, by - 5); y <= Math.min(H - 1, by + 5); y++) for (let x = Math.max(0, bx - 5); x <= Math.min(W - 1, bx + 5); x++) {
				const v = g[y * W + x] - base[y * W + x]; if (v > best / 12) { sx += x * v; sy += y * v; sw += v; } }
			return { v: best / 6, x: (sw ? sx / sw : bx) / W, y: (sw ? sy / sw : by) / H };
		};
		const drawPts = (pts, cur) => {
			const r = stage.getBoundingClientRect(); over.width = r.width * 2; over.height = r.height * 2;
			const g = over.getContext('2d'); g.clearRect(0, 0, over.width, over.height);
			pts.forEach((p, i) => { if (!p) return; g.fillStyle = i === cur ? '#ff2e93' : '#2ee6ff'; g.beginPath(); g.arc(p[0] * over.width, p[1] * over.height, i === cur ? 9 : 5, 0, 7); g.fill(); });
		};

		const scan = async () => {
			if (running) return;
			if (opts.hasMap()) { opts.toast('Remove the LED map from the lights first (below), then scan again.'); return; }
			if (!await camera()) return;
			const n = opts.count();
			if (!n) { opts.toast('Connect to the lights first.'); return; }
			running = true; stop = false; startBtn.hidden = true; stopBtn.hidden = false;
			const before = opts.state();
			const pts = new Array(n).fill(null);
			try {
				await opts.send({ on: true, bri: 160, seg: { i: [0, n, '000000'] } });
				await wait(700);
				// the dark picture, and how much it moves by itself (noise)
				const fs = []; for (let k = 0; k < 6; k++) { fs.push(await frame()); await wait(60); }
				const base = new Float32Array(fs[0].g.length);
				fs.forEach(f => f.g.forEach((v, i) => { base[i] += v / fs.length; }));
				let noise = 0; fs.forEach(f => { const s = spot(f, base); if (s) noise = Math.max(noise, s.v); });
				const thr = Math.max(60, noise * 2.5);
				// a photo of the place for "See it"
				const pc = document.createElement('canvas'), pw = 640, ph = Math.round(640 * video.videoHeight / video.videoWidth);
				pc.width = pw; pc.height = ph; pc.getContext('2d').drawImage(video, 0, 0, pw, ph);
				const photo = pc.toDataURL('image/jpeg', .7);
				let prev = -1;
				for (let k = 0; k < n && !stop; k++) {
					await opts.send({ seg: { i: prev >= 0 ? [prev, '000000', k, 'FFFFFF'] : [k, 'FFFFFF'] } });
					prev = k;
					const t0 = performance.now(); let got = null, lastSeen = null;
					while (performance.now() - t0 < 1400) {
						const s = spot(await frame(), base);
						if (s && s.v > thr) { if (lastSeen && Math.hypot(s.x - lastSeen.x, s.y - lastSeen.y) < .02) { got = s; break; } lastSeen = s; } else lastSeen = null;
					}
					pts[k] = got ? [got.x, got.y] : null;
					bar.firstChild.style.width = ((k + 1) * 100 / n) + '%';
					status('LED ' + (k + 1) + ' of ' + n + ' · found ' + pts.filter(Boolean).length);
					drawPts(pts, k);
				}
				if (stop) { status('Scan stopped.'); return; }
				const found = pts.filter(Boolean).length;
				if (found < Math.max(3, n * .3)) { status('Only ' + found + ' of ' + n + ' LEDs were seen. Try again in a darker place, with all the lights in the picture.'); return; }
				const all = fillGaps(pts);
				const res = { n, pts: all, seen: pts.map(Boolean), ar: video.videoWidth / video.videoHeight, photo, date: Date.now() };
				const okPhoto = save(opts.key(), res);
				drawPts(all, -1);
				status('Done: ' + found + ' of ' + n + ' LEDs seen' + (found < n ? ', the others were placed between their neighbours' : '') + '.' + (okPhoto ? '' : ' (The photo was too big to keep.)'));
				opts.done && opts.done(res);
				showResult();
			} catch (e) { status('The scan stopped: ' + (e.message || 'connection lost') + '.'); }
			finally {
				running = false; startBtn.hidden = false; stopBtn.hidden = true;
				opts.send({ seg: { fx: before.fx, frz: false }, bri: before.bri || 128, on: before.on !== false }).catch(() => {});
			}
		};

		const sendMap = async () => {
			const s = load(opts.key()); if (!s) return;
			const m = makeMap(s.pts, s.ar);
			if (!m) { opts.toast('Too many LEDs for a map (at most 1024).'); return; }
			const json = JSON.stringify({ n: 'LED4YOU scan', width: m.W, height: m.H, map: m.map });
			try {
				if (!await opts.upload('ledmap.json', new TextEncoder().encode(json), 0)) throw new Error();
				try { localStorage.setItem('l4yMapFix', JSON.stringify({ w: m.W, h: m.H })); } catch (e) {}
				opts.toast('Map saved. The lights restart now; connect again afterwards.');
				setTimeout(() => opts.send({ rb: true }).catch(() => {}), 600);
			} catch (e) { opts.toast('The lights did not take the map. Update the lights to the newest LED4YOU.'); }
		};
		const removeMap = async () => {
			try {
				if (!await opts.remove('ledmap.json')) throw new Error();
				try { localStorage.removeItem('l4yMapFix'); } catch (e) {}
				opts.toast('Map removed. The lights restart now; connect again afterwards.');
				setTimeout(() => opts.send({ rb: true }).catch(() => {}), 600);
			} catch (e) { opts.toast('Could not remove the map.'); }
		};
		const showResult = () => {
			const s = load(opts.key());
			const has = opts.hasMap();
			result.replaceChildren(
				s ? h('div', { class: 'note' }, 'Saved scan: ' + s.n + ' LEDs (' + new Date(s.date).toLocaleDateString() + '). Open "See it" › "My lights" to try effects on it.') : '',
				s ? h('details', { class: 'more' }, h('summary', {}, 'Use the scan on the lights (advanced)'),
					h('div', { class: 'note' }, 'The lights then know where each LED is: matrix effects, text and pictures follow the real shape. Effects for strips also run across the shape instead of along the string. You can remove it again here.'),
					h('div', { class: 'row' },
						has ? '' : h('button', { class: 'btn', type: 'button', onclick: sendMap }, 'Send the map to the lights'),
						has ? h('button', { class: 'btn', type: 'button', onclick: removeMap }, 'Remove the map from the lights') : '')) :
					(has ? h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: removeMap }, 'Remove the map from the lights')) : ''));
		};

		camBtn.onclick = camera; startBtn.onclick = scan; stopBtn.onclick = () => { stop = true; };
		box.replaceChildren(h('section', { class: 'card' },
			h('div', { class: 'ct' }, 'Scan my lights'),
			h('ol', { class: 'steps' },
				h('li', {}, 'Put up the lights and connect to them.'),
				h('li', {}, 'Turn on the camera and point it at all the lights. Keep the phone still.'),
				h('li', {}, 'Tap "Start the scan": the LEDs light up one by one and the app finds each one.')),
			stage, bar, msg,
			h('div', { class: 'row' }, camBtn, startBtn, stopBtn),
			result));
		showResult();
		// stop the camera when the tab is left
		new MutationObserver(() => { if (!box.isConnected || box.closest('[hidden]')) { if (!running) closeCam(); } }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
	}

	const css = `
.scan-stage { position: relative; display: none; margin: 10px 0; border-radius: 14px; overflow: hidden; background: #000; }
.scan-stage.on { display: block; }
.scan-video { display: block; width: 100%; height: auto; }
.scan-over { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.scan-bar { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; margin: 8px 0; }
.scan-bar i { display: block; height: 100%; width: 0; background: var(--ag, #2ee6ff); transition: width .2s; }
`;
	window.L4YScan = { mount, load, css, makeMap };
})();
