<script lang="ts">
	import { base } from '$app/paths';
	import { citasStore, conexionesStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { eliminarConexion, obtenerConexiones } from '$lib/services/conexiones';
	import { formatAutores, formatAutoresCorto } from '$lib/types';
	import type { Cita, Conexion } from '$lib/types';
	import { onMount, tick, untrack } from 'svelte';

	let tab = $state<'temas' | 'manuales'>('temas');

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

	// Posiciones guardadas: sobreviven rebuilds
	const savedPositions = new Map<string, { x: number; y: number }>();

	function savePositions() {
		for (const n of nodes) {
			savedPositions.set(n.id, { x: n.x, y: n.y });
		}
	}

	// Build graph from citas
	function buildGraph() {
		savePositions();

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

		const temas = Array.from(temaMap.entries()).filter(([, c]) => c.length >= 1);
		const cx = canvasW / 2;
		const cy = canvasH / 2;
		const temaRadius = Math.min(canvasW, canvasH) * 0.22;

		temas.forEach(([tema, citas], i) => {
			const angle = (2 * Math.PI * i) / temas.length - Math.PI / 2;
			const defaultTx = cx + temaRadius * Math.cos(angle);
			const defaultTy = cy + temaRadius * Math.sin(angle);
			const temaId = `tema_${tema}`;
			const saved = savedPositions.get(temaId);

			newNodes.push({
				id: temaId,
				label: tema,
				shortLabel: tema,
				type: 'tema',
				x: saved?.x ?? defaultTx,
				y: saved?.y ?? defaultTy,
				width: 180,
				height: 100
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
					newNodes.push({
						id: cNodeId,
						label: `${formatAutores(cita.autores)} (${cita.año})`,
						shortLabel: apaLabel,
						type: 'cita',
						x: savedCita?.x ?? defaultCx,
						y: savedCita?.y ?? defaultCy,
						citaId: cita.id,
						width: Math.max(140, apaLabel.length * 10 + 30),
						height: 48
					});
					citaNodeIds.add(cNodeId);
				}
				newEdges.push({ from: temaId, to: cNodeId });
			});
		});

		nodes = newNodes;
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

	onMount(() => {
		const fsHandler = () => {
			isFullScreen = !!document.fullscreenElement;
			tick().then(resize);
		};
		document.addEventListener('fullscreenchange', fsHandler);
		resize();
		buildGraph();
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
			document.removeEventListener('fullscreenchange', fsHandler);
		};
	});

	// Rebuild when citas change
	$effect(() => {
		$citasStore;
		untrack(() => {
			if (canvasW > 0) buildGraph();
		});
	});

	function svgPoint(clientX: number, clientY: number) {
		const rect = svgEl.getBoundingClientRect();
		return {
			x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
			y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h
		};
	}

	function onPointerDown(e: PointerEvent, nodeId: string) {
		e.stopPropagation();
		e.preventDefault();
		const pt = svgPoint(e.clientX, e.clientY);
		const node = nodes.find(n => n.id === nodeId);
		if (!node) return;
		dragging = nodeId;
		selectedNode = nodeId;
		dragOffset = { x: pt.x - node.x, y: pt.y - node.y };
		(e.target as Element).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (dragging) {
			const pt = svgPoint(e.clientX, e.clientY);
			const idx = nodes.findIndex(n => n.id === dragging);
			if (idx >= 0) {
				nodes[idx].x = pt.x - dragOffset.x;
				nodes[idx].y = pt.y - dragOffset.y;
			}
		} else if (isPanning) {
			const dx = (e.clientX - panStart.x) * (viewBox.w / canvasW);
			const dy = (e.clientY - panStart.y) * (viewBox.h / canvasH);
			viewBox = { ...viewBox, x: panStart.vx - dx, y: panStart.vy - dy };
		}
	}

	function onPointerUp() {
		if (dragging) {
			const node = nodes.find(n => n.id === dragging);
			if (node) savedPositions.set(node.id, { x: node.x, y: node.y });
		}
		dragging = null;
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

	// ── Manual connections (unchanged) ──
	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}

	async function handleEliminar(cx: Conexion) {
		if (!confirm('¿Eliminar esta conexión?')) return;
		try {
			await eliminarConexion(cx.id);
			conexionesStore.set(await obtenerConexiones());
			showToast('Conexión eliminada');
		} catch {
			showToast('Error al eliminar', 'error');
		}
	}
</script>

<h1>Conexiones</h1>

<div class="tabs">
	<button class="tab" class:active={tab === 'temas'} onclick={() => tab = 'temas'}>Nexos</button>
	<button class="tab" class:active={tab === 'manuales'} onclick={() => tab = 'manuales'}>Manuales</button>
</div>

{#if tab === 'temas'}
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
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
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
						/>
					{/if}
				{/each}

				<!-- Nodes -->
				{#each nodes as node (node.id)}
					{#if node.type === 'tema'}
						<g
							class="node-tema"
							class:selected={selectedNode === node.id}
							onpointerdown={(e) => onPointerDown(e, node.id)}
							role="button"
							tabindex="-1"
						>
							<rect
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								rx={node.height / 2}
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
							onpointerdown={(e) => onPointerDown(e, node.id)}
							ondblclick={() => { if (node.citaId) window.location.href = `${base}/citas/${node.citaId}`; }}
							role="button"
							tabindex="-1"
						>
							<rect
								x={node.x - node.width / 2} y={node.y - node.height / 2}
								width={node.width} height={node.height}
								rx={node.height / 2}
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
{:else}
	{#if $conexionesStore.length === 0}
		<p class="empty">No hay conexiones manuales.</p>
	{:else}
		<div class="conexion-list">
			{#each $conexionesStore as cx (cx.id)}
				{@const origen = getCitaById(cx.cita_origen_id)}
				{@const destino = getCitaById(cx.cita_destino_id)}
				<div class="conexion-card">
					<div class="conexion-pair">
						<a href="{base}/citas/{cx.cita_origen_id}" class="conexion-cita">
							{origen ? `${formatAutores(origen.autores)} (${origen.año})` : '(eliminada)'}
						</a>
						<span class="conexion-arrow">&rarr;</span>
						<a href="{base}/citas/{cx.cita_destino_id}" class="conexion-cita">
							{destino ? `${formatAutores(destino.autores)} (${destino.año})` : '(eliminada)'}
						</a>
					</div>
					{#if cx.etiqueta}
						<span class="conexion-etiqueta">{cx.etiqueta}</span>
					{/if}
					{#if cx.comentario}
						<p class="conexion-comentario">{cx.comentario}</p>
					{/if}
					<button class="btn-delete-sm" onclick={() => handleEliminar(cx)}>Eliminar</button>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 16px;
	}
	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
	}
	.tab {
		flex: 1;
		padding: 10px;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		text-transform: uppercase;
		background: var(--bg-surface);
		color: var(--text-muted);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}
	.tab.active {
		background: var(--accent);
		color: #121212;
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
		stroke: var(--border-bright);
		stroke-width: 2;
		opacity: 0.5;
	}
	.edge-highlight {
		stroke: var(--accent);
		stroke-width: 3;
		opacity: 1;
	}

	/* Tema nodes */
	.node-tema rect {
		fill: var(--accent-dim);
		stroke: var(--accent);
		stroke-width: 2.5;
		cursor: grab;
		filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
		transition: fill 0.15s;
	}
	.node-tema:hover rect,
	.node-tema.selected rect {
		fill: var(--accent);
		filter: drop-shadow(0 4px 20px rgba(142, 164, 200, 0.4));
	}
	/* Cita nodes */
	.node-cita rect {
		fill: var(--bg-elevated);
		stroke: var(--border-bright);
		stroke-width: 1.5;
		cursor: grab;
		filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
		transition: fill 0.15s, stroke 0.15s;
	}
	.node-cita:hover rect,
	.node-cita.selected rect {
		fill: var(--bg-hover);
		stroke: var(--accent-dim);
		filter: drop-shadow(0 2px 12px rgba(142, 164, 200, 0.3));
	}
	/* Detail panel - overlay */
	.detail-panel {
		position: absolute;
		bottom: 16px;
		left: 16px;
		right: 16px;
		max-width: 420px;
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

	/* ── Manual connections ── */
	.conexion-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
	}
	@media (min-width: 768px) {
		.conexion-list {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
	}
	@media (min-width: 1280px) {
		.conexion-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.conexion-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px 14px;
	}
	.conexion-pair {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.conexion-cita {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	.conexion-arrow {
		color: var(--text-muted);
	}
	.conexion-etiqueta {
		display: inline-block;
		margin-top: 6px;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-elevated);
		color: var(--accent);
	}
	.conexion-comentario {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}
	.btn-delete-sm {
		margin-top: 8px;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--error);
		background: none;
		border: 1px solid var(--error);
		border-radius: 4px;
		padding: 2px 8px;
		cursor: pointer;
	}

	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
