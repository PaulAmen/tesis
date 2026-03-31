<script lang="ts">
	import { toasts } from '$lib/stores/toast';
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<div class="toast toast-{toast.type}">
			{toast.message}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 90%;
		max-width: 400px;
	}
	.toast {
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 0.875rem;
		font-family: var(--font-mono);
		animation: slideIn 0.3s ease;
	}
	.toast-success {
		background: var(--bg-surface);
		color: var(--success);
		border: 1px solid var(--success);
	}
	.toast-error {
		background: var(--bg-surface);
		color: var(--error);
		border: 1px solid var(--error);
	}
	.toast-info {
		background: var(--bg-surface);
		color: var(--accent);
		border: 1px solid var(--accent);
	}
	@keyframes slideIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
