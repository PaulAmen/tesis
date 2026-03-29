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
		--bg-base: #050505;
		--bg-surface: #121212;
		--bg-elevated: #1e1e1e;
		--bg-hover: #2a2a2a;
		--border: #333333;
		--text-primary: #ffffff;
		--text-secondary: #b3b3b3;
		--text-muted: #757575;
		--accent: #a5b4fc;
		--accent-dim: #6366f1;
		--success: #86efac;
		--error: #fca5a5;
		--warning: #fde047;

		--font-serif: 'Georgia', 'Times New Roman', serif;
		--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

		--badge-libro: #93c5fd;
		--badge-articulo: #fdba74;
		--badge-reporte: #c084fc;
		--badge-tesis: #5eead4;
		--badge-web: #f472b6;

		--radius-sm: 6px;
		--radius-md: 12px;
		--radius-lg: 20px;
	}

	:global(html, body) {
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-serif);
		font-size: 21px;
		line-height: 1.65;
		-webkit-font-smoothing: antialiased;
		min-height: 100vh;
	}

	:global(a) {
		color: var(--accent);
		text-decoration: none;
		transition: color 0.2s;
	}

	:global(a:hover) {
		color: var(--text-primary);
	}

	:global(button) {
		font-family: var(--font-sans);
		cursor: pointer;
		border: none;
		background: none;
		color: inherit;
		transition: transform 0.1s, opacity 0.2s;
	}

	:global(button:active) {
		transform: scale(0.98);
	}

	:global(input, textarea, select) {
		font-family: var(--font-serif);
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		font-size: 1rem;
		width: 100%;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	:global(input:focus, textarea:focus, select:focus) {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.1);
	}

	:global(textarea) {
		resize: vertical;
		min-height: 140px;
	}

	:global(select) {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 32px;
	}

	.app-shell {
		max-width: 100%;
		margin: 0 auto;
		min-height: 100vh;
	}

	.content {
		padding: 16px;
		padding-bottom: 80px;
	}

	@media (min-width: 768px) {
		.content {
			padding: 32px 48px 80px;
		}
	}
	@media (min-width: 1280px) {
		.content {
			padding: 40px 80px 80px;
		}
	}

	.loading {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
