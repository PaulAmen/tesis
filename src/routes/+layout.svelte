<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Login from '$lib/components/Login.svelte';
	import { citasStore, conexionesStore, loadingStore } from '$lib/stores/data';
	import { userStore, authLoading } from '$lib/stores/auth';
	import { obtenerCitas } from '$lib/services/citas';
	import { obtenerConexiones } from '$lib/services/conexiones';
	import { onMount } from 'svelte';

	let { children } = $props();
	let dataLoaded = $state(false);

	$effect(() => {
		if ($userStore && !dataLoaded) {
			dataLoaded = true;
			loadData();
		}
	});

	async function loadData() {
		loadingStore.set(true);
		try {
			const [citas, conexiones] = await Promise.all([
				obtenerCitas(),
				obtenerConexiones()
			]);
			citasStore.set(citas);
			conexionesStore.set(conexiones);
		} catch (e) {
			console.error('Error cargando datos:', e);
		} finally {
			loadingStore.set(false);
		}
	}
</script>

{#if $authLoading}
	<div class="app-shell">
		<main class="content">
			<p class="loading">Cargando...</p>
		</main>
	</div>
{:else if !$userStore}
	<Login />
{:else}
	<div class="app-shell">
		<main class="content">
			{@render children()}
		</main>
		<BottomNav />
		<Toast />
	</div>
{/if}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(:root) {
		--bg-base: #121212;
		--bg-surface: #1e1e1e;
		--bg-elevated: #282a36;
		--bg-hover: #323444;
		--border: rgba(255, 255, 255, 0.05);
		--border-bright: rgba(255, 255, 255, 0.1);
		--text-primary: #e0e0e0;
		--text-secondary: #d4d4d4;
		--text-muted: #808080;
		--accent: #98c379;
		--accent-dim: #6a9955;
		--accent-glow: rgba(106, 153, 85, 0.15);
		--success: #98c379;
		--error: #e06c75;
		--warning: #e5c07b;

		--font-serif: 'Lora', 'Georgia', serif;
		--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
		--font-sans: 'Inter', -apple-system, sans-serif;

		--badge-libro: rgba(97, 175, 239, 0.15);
		--badge-articulo: rgba(229, 192, 123, 0.15);
		--badge-reporte: rgba(198, 120, 221, 0.15);
		--badge-tesis: rgba(86, 182, 194, 0.15);
		--badge-web: rgba(224, 108, 117, 0.15);

		--radius-sm: 8px;
		--radius-md: 14px;
		--radius-lg: 24px;
		
		--shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.4);
		--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.5);
		--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.6);
	}

	:global(html, body) {
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 20px;
		line-height: 1.6;
		-webkit-font-smoothing: antialiased;
		min-height: 100vh;
		overflow-x: hidden;
	}

	:global(body::before) {
		content: "";
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.03;
		pointer-events: none;
		z-index: 9999;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/svg%3E");
	}

	:global(h1, h2, h3, h4) {
		font-family: var(--font-sans);
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}

	:global(a) {
		color: var(--accent-dim);
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(a:hover) {
		color: var(--accent);
		text-shadow: 0 0 12px var(--accent-glow);
	}

	:global(button) {
		font-family: var(--font-sans);
		cursor: pointer;
		border: none;
		background: none;
		color: inherit;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(button:active) {
		transform: scale(0.96);
	}

	:global(input, textarea, select) {
		font-family: var(--font-sans);
		background: var(--bg-surface);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 14px 18px;
		font-size: 0.95rem;
		width: 100%;
		outline: none;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		transition: all 0.3s ease;
	}

	:global(input:focus, textarea:focus, select:focus) {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
		box-shadow: 0 0 0 4px var(--accent-glow);
	}

	:global(textarea) {
		resize: vertical;
		min-height: 120px;
		line-height: 1.7;
	}

	:global(select) {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 16px center;
		padding-right: 44px;
	}

	.app-shell {
		max-width: 1600px;
		margin: 0 auto;
		min-height: 100vh;
		position: relative;
	}

	.content {
		padding: 24px 20px 100px;
	}

	@media (min-width: 768px) {
		.content {
			padding: 48px 40px 120px;
		}
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
	}
</style>
