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
		--bg-base: #1e1e2e;
		--bg-surface: #27293d;
		--bg-elevated: #32354f;
		--bg-hover: #3d4163;
		--border: rgba(142, 164, 200, 0.18);
		--border-bright: rgba(142, 164, 200, 0.35);
		--text-primary: #e0e0e0;
		--text-secondary: #d4d4d4;
		--text-muted: #808080;
		--accent: #8ea4c8;
		--accent-dim: #6b7d9a;
		--accent-glow: rgba(107, 125, 154, 0.1);
		--success: #89b482;
		--error: #e06c75;
		--warning: #e5c07b;

		--font-serif: 'Lora', 'Georgia', serif;
		--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
		--font-sans: 'Inter', -apple-system, sans-serif;

		--badge-libro: rgba(97, 175, 239, 0.12);
		--badge-articulo: rgba(229, 192, 123, 0.12);
		--badge-reporte: rgba(198, 120, 221, 0.12);
		--badge-tesis: rgba(86, 182, 194, 0.12);
		--badge-web: rgba(224, 108, 117, 0.12);

		--text-libro: #7fb4f5;
		--text-articulo: #eacb8a;
		--text-reporte: #d496e5;
		--text-tesis: #78c5cf;
		--text-web: #e88a91;

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

	:global(.badge) {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 1.5px solid transparent;
	}

	:global(.badge-libro) { background: var(--badge-libro); color: var(--text-libro); border-color: rgba(127, 180, 245, 0.2); }
	:global(.badge-articulo) { background: var(--badge-articulo); color: var(--text-articulo); border-color: rgba(234, 203, 138, 0.2); }
	:global(.badge-reporte) { background: var(--badge-reporte); color: var(--text-reporte); border-color: rgba(212, 150, 229, 0.2); }
	:global(.badge-tesis) { background: var(--badge-tesis); color: var(--text-tesis); border-color: rgba(120, 197, 207, 0.2); }
	:global(.badge-web) { background: var(--badge-web); color: var(--text-web); border-color: rgba(232, 138, 145, 0.2); }

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
