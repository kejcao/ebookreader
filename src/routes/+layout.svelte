<script>
	import { readBook } from "./reader/util.js";

	let dropZone = 'hidden';
</script>

<svelte:document
	on:dragenter|preventDefault={e => {
		e.dataTransfer.dropEffect = 'copy';
		dropZone = 'visible';
	}}
	on:dragleave|preventDefault={e => {
		if (!e.fromElement) {
			dropZone = 'hidden';
		}
	}}
	on:dragover|preventDefault
	on:drop|preventDefault={async e => {
		if (e.dataTransfer.items) {
			const item = e.dataTransfer.items[0];
			if (item.kind == 'file') {
				await readBook(item.getAsFile());
			}
		} else {
			await readBook(e.dataTransfer.files[0]);
		}
		dropZone = 'hidden';
	}}
/>

<div class="dropZone" style:visibility={dropZone}>
	<div><h1>DROP HERE!</h1></div>
</div>

<slot />

<style>
	.dropZone {
		background: gray;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 998;
		opacity: 0.6;
		visibility: hidden;
	}

	.dropZone > div {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		color: #000;
		opacity: 1;

		z-index: 999;
	}

	:global(body) {
		max-width: 38rem;
		margin: 2em auto;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		margin: 0 auto;
	}
</style>
