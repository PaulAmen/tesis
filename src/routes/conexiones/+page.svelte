<script lang="ts">
	import { base } from '$app/paths';
	import { citasStore } from '$lib/stores/data';
	import { formatAutores, formatAutoresCorto } from '$lib/types';
	import type { Cita } from '$lib/types';
	import { onMount, tick, untrack } from 'svelte';

	// ── Graph state ──
	interface GraphNode {
		id: string;
		label: string;
		shortLabel: string;
		type: 'tema' | 'cita';
		x: number;
		y: number;
		citaId?: string;
		width: number;
		height: number;
		color: string;
		strokeColor: string;
	}

	// Paleta de colores para temas
	const TEMA_COLORS = [
		{ fill: '#5b8abd', stroke: '#7fb4f5' },  // azul
		{ fill: '#c49a4a', stroke: '#eacb8a' },  // dorado
		{ fill: '#9b6bbd', stroke: '#d496e5' },  // morado
		{ fill: '#4a9a7a', stroke: '#78c5a0' },  // verde
		{ fill: '#c46a5a', stroke: '#e88a7a' },  // coral
		{ fill: '#5a8a9a', stroke: '#78c5cf' },  // cyan
		{ fill: '#8a7a5a', stroke: '#c4b48a' },  // arena
		{ fill: '#7a5a8a', stroke: '#b48ac4' },  // lavanda
	];

	function hexToRgb(hex: string): [number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return [r, g, b];
	}

	function rgbToHex(r: number, g: number, b: number): string {
		return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
	}

	function mixColors(hexColors: string[]): string {
		if (hexColors.length === 0) return '#32354f';
		if (hexColors.length === 1) return hexColors[0];
		const rgbs = hexColors.map(hexToRgb);
		const avg = rgbs.reduce(
			(acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
			[0, 0, 0]
		);
		const n = rgbs.length;
		return rgbToHex(avg[0] / n, avg[1] / n, avg[2] / n);
	}
	interface GraphEdge {
		from: string;
		to: string;
	}

	let nodes = $state<GraphNode[]>([]);
	let edges = $state<GraphEdge[]>([]);
	let svgEl: SVGSVGElement;
	let containerEl: HTMLDivElement;
	let isFullScreen = $state(false);

	let dragging = $state<string | null>(null);
	let dragOffset = { x: 0, y: 0 };

	let canvasW = $state(1200);
	let canvasH = $state(900);

	// Pan & zoom
	let viewBox = $state({ x: 0, y: 0, w: 1200, h: 900 });
	let isPanning = $state(false);
	let panStart = { x: 0, y: 0, vx: 0, vy: 0 };

	let selectedNode = $state<string | null>(null);

	// Persistencia de posiciones en localStorage
	const storageKey = 'tesis_graph_positions';
	let savedPositions = new Map<string, { x: number; y: number }>();
	// Use a plain array + manual tick to avoid $state reactivity issues during drag
	let rawNodes: GraphNode[] = [];

	function syncNodes() {
		nodes = [...rawNodes];
	}

	function loadPositions() {
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const data = JSON.parse(stored);
				savedPositions = new Map(Object.entries(data));
			}
		} catch (e) {
			console.error('Error cargando posiciones:', e);
		}
	}

	function persistPositions() {
		try {
			const data = Object.fromEntries(savedPositions);
			localStorage.setItem(storageKey, JSON.stringify(data));
		} catch (e) {
			console.error('Error persistiendo posiciones:', e);
		}
	}

	function savePositions() {
		for (const n of rawNodes) {
			savedPositions.set(n.id, { x: n.x, y: n.y });
		}
		persistPositions();
	}

	// Build graph from citas
	function buildGraph() {
		// Antes de reconstruir, guardamos lo que tenemos si ya hay nodos
		if (rawNodes.length > 0) {
			savePositions();
		}

		const temaMap = new Map<string, Cita[]>();
		for (const cita of $citasStore) {
			for (const tema of cita.temas) {
				if (!temaMap.has(tema)) temaMap.set(tema, []);
				temaMap.get(tema)!.push(cita);
			}
		}

		const newNodes: GraphNode[] = [];
		const newEdges: GraphEdge[] = [];
		const citaNodeIds = new Set<string>();
		// Map tema -> color index, and cita -> list of tema colors
		const temaColorMap = new Map<string, { fill: string; stroke: string }>();
		const citaColorsMap = new Map<string, string[]>();

		const temas = Array.from(temaMap.entries()).filter(([, c]) => c.length >= 1);
		const cx = canvasW / 2;
		const cy = canvasH / 2;
		const temaRadius = Math.min(canvasW, canvasH) * 0.22;

		// Assign colors to temas
		temas.forEach(([tema], i) => {
			temaColorMap.set(tema, TEMA_COLORS[i % TEMA_COLORS.length]);
		});

		// Collect colors per cita
		for (const cita of $citasStore) {
			const colors: string[] = [];
			for (const tema of cita.temas) {
				const tc = temaColorMap.get(tema);
				if (tc) colors.push(tc.fill);
			}
			if (colors.length > 0) citaColorsMap.set(cita.id, colors);
		}

		temas.forEach(([tema, citas], i) => {
			const angle = (2 * Math.PI * i) / temas.length - Math.PI / 2;
			const defaultTx = cx + temaRadius * Math.cos(angle);
			const defaultTy = cy + temaRadius * Math.sin(angle);
			const temaId = `tema_${tema}`;
			const saved = savedPositions.get(temaId);
			const tc = temaColorMap.get(tema)!;

			newNodes.push({
				id: temaId,
				label: tema,
				shortLabel: tema,
				type: 'tema',
				x: saved?.x ?? defaultTx,
				y: saved?.y ?? defaultTy,
				width: 180,
				height: 100,
				color: tc.fill,
				strokeColor: tc.stroke
			});

			const citaRadius = 140 + citas.length * 18;
			const tx = saved?.x ?? defaultTx;
			const ty = saved?.y ?? defaultTy;

			citas.forEach((cita, j) => {
				const cNodeId = `cita_${cita.id}`;
				if (!citaNodeIds.has(cNodeId)) {
					const ca = (2 * Math.PI * j) / citas.length - Math.PI / 2;
					const defaultCx = tx + citaRadius * Math.cos(ca);
					const defaultCy = ty + citaRadius * Math.sin(ca);
					const savedCita = savedPositions.get(cNodeId);
					const apaLabel = `(${formatAutoresCorto(cita.autores)}, ${cita.año})`;
					const citaColors = citaColorsMap.get(cita.id) ?? [];
					const mixed = mixColors(citaColors);
					// Lighten the mixed color for stroke
					const [r, g, b] = hexToRgb(mixed);
					const lighter = rgbToHex(
						Math.min(255, r + 60),
						Math.min(255, g + 60),
						Math.min(255, b + 60)
					);
					newNodes.push({
						id: cNodeId,
						label: `${formatAutores(cita.autores)} (${cita.año})`,
						shortLabel: apaLabel,
						type: 'cita',
						x: savedCita?.x ?? defaultCx,
						y: savedCita?.y ?? defaultCy,
						citaId: cita.id,
						width: Math.max(140, apaLabel.length * 10 + 30),
						height: 48,
						color: mixed,
						strokeColor: lighter
					});
					citaNodeIds.add(cNodeId);
				}
				newEdges.push({ from: temaId, to: cNodeId });
			});
		});

		rawNodes = newNodes;
		nodes = [...newNodes];
		edges = newEdges;
	}

	function resize() {
		if (!containerEl) return;
		canvasW = containerEl.clientWidth;
		if (isFullScreen) {
			canvasH = window.innerHeight;
		} else {
			const availableH = window.innerHeight - containerEl.getBoundingClientRect().top - 40;
			canvasH = Math.max(800, availableH); 
		}
		viewBox = { x: 0, y: 0, w: canvasW, h: canvasH };
	}

	function toggleFullScreen() {
		if (!document.fullscreenElement) {
			containerEl.requestFullscreen().catch(err => {
				console.error(`Error attempting to enable full-screen mode: ${err.message}`);
			});
		} else {
			document.exitFullscreen();
		}
	}

	// Track citas count to detect real changes
	let lastCitasIds = '';

	onMount(() => {
		loadPositions();
		const fsHandler = () => {
			isFullScreen = !!document.fullscreenElement;
			tick().then(resize);
		};
		document.addEventListener('fullscreenchange', fsHandler);
		resize();
		buildGraph();
		lastCitasIds = $citasStore.map(c => c.id).join(',');
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
			document.removeEventListener('fullscreenchange', fsHandler);
		};
	});

	// Only rebuild when citas actually change (added/removed)
	$effect(() => {
		const ids = $citasStore.map(c => c.id).join(',');
		if (ids !== lastCitasIds) {
			lastCitasIds = ids;
			untrack(() => buildGraph());
		}
	});

	function svgPoint(clientX: number, clientY: number) {
		const rect = svgEl.getBoundingClientRect();
		return {
			x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
			y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h
		};
	}

	function onNodePointerDown(e: PointerEvent, nodeId: string) {
		e.stopPropagation();
		e.preventDefault();
		const pt = svgPoint(e.clientX, e.clientY);
		const node = rawNodes.find(n => n.id === nodeId);
		if (!node) return;
		dragging = nodeId;
		selectedNode = nodeId;
		dragOffset = { x: pt.x - node.x, y: pt.y - node.y };
		document.addEventListener('pointermove', onDocPointerMove);
		document.addEventListener('pointerup', onDocPointerUp);
	}

	function onDocPointerMove(e: PointerEvent) {
		if (!dragging) return;
		e.preventDefault();
		const pt = svgPoint(e.clientX, e.clientY);
		const newX = pt.x - dragOffset.x;
		const newY = pt.y - dragOffset.y;
		const node = rawNodes.find(n => n.id === dragging);
		if (node) {
			node.x = newX;
			node.y = newY;
			savedPositions.set(dragging, { x: newX, y: newY });
			syncNodes();
		}
	}

	function onDocPointerUp() {
		dragging = null;
		persistPositions();
		document.removeEventListener('pointermove', onDocPointerMove);
		document.removeEventListener('pointerup', onDocPointerUp);
	}

	function onSvgPointerMove(e: PointerEvent) {
		if (isPanning) {
			const dx = (e.clientX - panStart.x) * (viewBox.w / canvasW);
			const dy = (e.clientY - panStart.y) * (viewBox.h / canvasH);
			viewBox = { ...viewBox, x: panStart.vx - dx, y: panStart.vy - dy };
		}
	}

	function onSvgPointerUp() {
		isPanning = false;
	}

	function onBgPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		selectedNode = null;
		isPanning = true;
		panStart = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const scale = e.deltaY > 0 ? 1.1 : 0.9;
		const rect = svgEl.getBoundingClientRect();
		const mx = viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
		const my = viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;
		const nw = viewBox.w * scale;
		const nh = viewBox.h * scale;
		viewBox = {
			x: mx - (mx - viewBox.x) * scale,
			y: my - (my - viewBox.y) * scale,
			w: nw,
			h: nh
		};
	}

	function getNodeById(id: string) {
		return nodes.find(n => n.id === id);
	}

	function resetView() {
		viewBox = { x: 0, y: 0, w: canvasW, h: canvasH };
	}

	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}
</script>

<h1>Nexos</h1>

{#if $citasStore.filter(c => c.temas.length > 0).length === 0}
		<p class="empty">No hay citas con temas asignados aún.</p>
	{:else}
		<div class="graph-toolbar">
			<button class="btn-tool" onclick={resetView}>Resetear vista</button>
			<button class="btn-tool" onclick={toggleFullScreen}>
				{isFullScreen ? 'Salir pantalla completa' : 'Pantalla completa'}
			</button>
			<span class="hint">Arrastra nodos · Scroll/pinch zoom · Doble clic en cita para abrir</span>
		</div>
		<div class="graph-container" class:is-fullscreen={isFullScreen} bind:this={containerEl}>
			<svg
				bind:this={svgEl}
				viewBox="{viewBox.x} {viewBox.y} {viewBox.w} {viewBox.h}"
				class="graph-svg"
				style="height: {isFullScreen ? '100vh' : canvasH + 'px'}"
				onpointermove={onSvgPointerMove}
				onpointerup={onSvgPointerUp}
				onpointerdown={onBgPointerDown}
				onwheel={onWheel}
			>
				<!-- Edges -->
				{#each edges as edge}
					{@const from = getNodeById(edge.from)}
					{@const to = getNodeById(edge.to)}
					{#if from && to}
						<line
							x1={from.x} y1={from.y}
							x2={to.x} y2={to.y}
							class="edge"
							class:edge-highlight={selectedNode === edge.from || selectedNode === edge.to}
							style="stroke: {from.type === 'tema' ? from.strokeColor : to.strokeColor}"
						/>
					{/if}
				{/each}

				<!-- Nodes -->
				{#each nodes as node (node.id)}
					{#if node.type === 'tema'}
						<g
							class="node-tema"
							class:selected={selectedNode === node.id}
							onpointerdown={(e) => onNodePointerDown(e, node.id)}
							role="button"
							tabindex="-1"
						>
							<rect
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								rx={node.height / 2}
								style="fill: {node.color}; stroke: {node.strokeColor}"
							/>
							<foreignObject
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								style="pointer-events: none;"
							>
								<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;padding:4px 12px;text-align:center;line-height:1.15;word-break:break-word;overflow:hidden;user-select:none;color:#121212;font-family:'JetBrains Mono','Fira Code',monospace;font-size:16px;font-weight:700;">
									{node.shortLabel}
								</div>
							</foreignObject>
						</g>
					{:else}
						<g
							class="node-cita"
							class:selected={selectedNode === node.id}
							onpointerdown={(e) => onNodePointerDown(e, node.id)}
							ondblclick={() => { if (node.citaId) window.location.href = `${base}/citas/${node.citaId}`; }}
							role="button"
							tabindex="-1"
						>
							<rect
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								rx={node.height / 2}
								style="fill: {node.color}22; stroke: {node.strokeColor}"
							/>
							<foreignObject
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								style="pointer-events: none;"
							>
								<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;padding:4px 10px;text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;user-select:none;color:#d4d4d4;font-family:'JetBrains Mono','Fira Code',monospace;font-size:15px;">
									{node.shortLabel}
								</div>
							</foreignObject>
						</g>
					{/if}
				{/each}
			</svg>

			<!-- Detail panel overlay -->
			{#if selectedNode}
				{@const sel = getNodeById(selectedNode)}
				{#if sel}
					<div class="detail-panel">
						<button class="panel-close" onclick={() => selectedNode = null}>&times;</button>
						{#if sel.type === 'tema'}
							<h3 class="panel-title">{sel.label}</h3>
							<p class="panel-sub">{edges.filter(e => e.from === sel.id).length} citas vinculadas</p>
							<div class="panel-links">
								{#each edges.filter(e => e.from === sel.id) as edge}
									{@const citaNode = getNodeById(edge.to)}
									{#if citaNode?.citaId}
										<a href="{base}/citas/{citaNode.citaId}" class="panel-link">{citaNode.label}</a>
									{/if}
								{/each}
							</div>
						{:else if sel.citaId}
							{@const cita = getCitaById(sel.citaId)}
							{#if cita}
								<p class="panel-sub">{sel.shortLabel}</p>
								{#if cita.cita_textual}
									<blockquote class="panel-quote">{cita.cita_textual}</blockquote>
								{:else if cita.notas}
									<p class="panel-notas">{cita.notas}</p>
								{:else}
									<h3 class="panel-title">{cita.titulo}</h3>
								{/if}
								<a href="{base}/citas/{cita.id}" class="panel-go">Ver cita completa</a>
							{/if}
						{/if}
					</div>
				{/if}
			{/if}
		</div>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 16px;
	}
	/* ── Graph ── */
	.graph-toolbar {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 10px;
	}
	.btn-tool {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 6px 14px;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: var(--bg-surface);
		color: var(--text-secondary);
		cursor: pointer;
	}
	.btn-tool:hover {
		border-color: var(--accent-dim);
		color: var(--accent);
	}
	.hint {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--text-muted);
	}
	.graph-container {
		position: relative;
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background:
			radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0) 0 0 / 40px 40px,
			var(--bg-base);
		touch-action: none;
	}
	.graph-container.is-fullscreen {
		border: none;
		border-radius: 0;
	}
	.graph-svg {
		width: 100%;
		display: block;
		user-select: none;
	}

	/* Edges */
	.edge {
		stroke-width: 2;
		opacity: 0.4;
	}
	.edge-highlight {
		stroke-width: 3;
		opacity: 0.9;
	}

	/* Tema nodes */
	.node-tema rect {
		stroke-width: 2.5;
		cursor: grab;
		filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
		transition: filter 0.15s, opacity 0.15s;
	}
	.node-tema:hover rect,
	.node-tema.selected rect {
		filter: drop-shadow(0 4px 20px rgba(142, 164, 200, 0.4)) brightness(1.2);
	}
	/* Cita nodes */
	.node-cita rect {
		stroke-width: 1.5;
		cursor: grab;
		filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
		transition: filter 0.15s;
	}
	.node-cita:hover rect,
	.node-cita.selected rect {
		filter: drop-shadow(0 2px 12px rgba(142, 164, 200, 0.3)) brightness(1.3);
	}
	/* Detail panel - overlay */
	.detail-panel {
		position: absolute;
		top: 16px;
		left: 16px;
		max-width: 420px;
		max-height: calc(100% - 32px);
		overflow-y: auto;
		padding: 18px 22px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: 10;
	}
	.panel-close {
		position: absolute;
		top: 10px;
		right: 14px;
		font-size: 1.25rem;
		color: var(--text-muted);
		background: none;
		border: none;
		cursor: pointer;
		line-height: 1;
	}
	.panel-title {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 4px;
	}
	.panel-sub {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-bottom: 10px;
	}
	.panel-links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.panel-link {
		font-size: 0.875rem;
		padding: 4px 0;
	}
	.panel-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 10px;
	}
	.panel-tag {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 3px 10px;
		border-radius: 12px;
		background: var(--bg-elevated);
		color: var(--accent);
		border: 1px solid var(--accent-dim);
	}
	.panel-quote {
		border-left: 4px solid var(--accent);
		padding: 8px 12px;
		margin: 8px 0;
		font-style: italic;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--text-secondary);
		background: var(--bg-elevated);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}
	.panel-notas {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin: 8px 0;
	}
	.panel-go {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--accent);
		font-weight: 600;
	}

	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
