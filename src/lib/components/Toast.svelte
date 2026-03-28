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
		background: #1a3a2a;
		color: #6ee7a0;
		border: 1px solid #2d5a3d;
	}
	.toast-error {
		background: #3a1a1a;
		color: #e76e6e;
		border: 1px solid #5a2d2d;
	}
	.toast-info {
		background: #1a2a3a;
		color: #6eb0e7;
		border: 1px solid #2d3d5a;
	}
	@keyframes slideIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
