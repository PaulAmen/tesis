<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const items = [
		{ href: `${base}/`, label: 'Citas', icon: 'book' },
		{ href: `${base}/borradores`, label: 'Borradores', icon: 'edit' },
		{ href: `${base}/conexiones`, label: 'Conexiones', icon: 'link' },
		{ href: `${base}/ia`, label: 'IA', icon: 'brain' },
		{ href: `${base}/nueva`, label: 'Nueva', icon: 'plus' }
	];

	const icons: Record<string, string> = {
		book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
		link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
		brain: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
		plus: 'M12 4v16m8-8H4'
	};

	function isActive(href: string): boolean {
		const path = page.url?.pathname ?? '';
		if (href === `${base}/` || href === base) {
			return path === `${base}/` || path === base || path.startsWith(`${base}/citas`);
		}
		return path.startsWith(href);
	}
</script>

<nav class="bottom-nav">
	{#each items as item}
		<a href={item.href} class="nav-item" class:active={isActive(item.href)}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d={icons[item.icon]} />
			</svg>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		background: var(--bg-surface);
		border-top: 1px solid var(--border);
		padding: 6px 0 env(safe-area-inset-bottom, 8px);
		z-index: 100;
	}
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px 12px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.625rem;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color 0.2s;
	}
	.nav-item.active {
		color: var(--accent);
	}
	.nav-item:hover {
		color: var(--text-primary);
	}
</style>
