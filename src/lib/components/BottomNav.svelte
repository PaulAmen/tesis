<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const items = [
		{ href: `${base}/`, label: 'Citas', icon: 'book' },
		{ href: `${base}/borradores`, label: 'Borrador', icon: 'edit' },
		{ href: `${base}/matrices`, label: 'Matrices', icon: 'grid' },
		{ href: `${base}/conexiones`, label: 'Nexos', icon: 'link' },
		{ href: `${base}/ia`, label: 'IA', icon: 'brain' }
	];

	const icons: Record<string, string> = {
		book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
		grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
		brain: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
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
	<div class="nav-container">
		{#each items as item}
			<a href={item.href} class="nav-item" class:active={isActive(item.href)}>
				<div class="icon-wrapper">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d={icons[item.icon]} />
					</svg>
				</div>
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 24px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		z-index: 1000;
		pointer-events: none;
	}
	.nav-container {
		pointer-events: auto;
		display: flex;
		gap: 8px;
		background: rgba(15, 15, 20, 0.75);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--border-bright);
		padding: 8px;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.4);
	}
	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 10px 16px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.65rem;
		font-family: var(--font-mono);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		border-radius: var(--radius-md);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		min-width: 80px;
	}
	.icon-wrapper {
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.nav-item:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}
	.nav-item:hover .icon-wrapper {
		transform: translateY(-2px);
	}
	.nav-item.active {
		color: var(--accent);
		background: rgba(199, 210, 254, 0.1);
		box-shadow: inset 0 0 12px rgba(199, 210, 254, 0.05);
	}
	.nav-item.active .icon-wrapper {
		transform: scale(1.1);
		filter: drop-shadow(0 0 8px var(--accent-glow));
	}
	@media (max-width: 480px) {
		.bottom-nav {
			bottom: 12px;
		}
		.nav-container {
			gap: 4px;
			padding: 6px;
			border-radius: var(--radius-md);
			width: 95%;
		}
		.nav-item {
			padding: 8px 4px;
			min-width: 60px;
			font-size: 0.55rem;
		}
	}
</style>
