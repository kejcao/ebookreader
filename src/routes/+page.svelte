<script>
// @ts-nocheck

	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	import Toc from "./TOC.svelte";

	let dragover = false, noBookLoaded = true, showPanel = false;
	let metadata, rendition, TOC = [];

	function getFile(event) {
		let file;
		if (event.dataTransfer.items) {
			const x = event.dataTransfer.items[0];
			if (x.kind === "file") {
				file = x.getAsFile();
			}
		} else {
			file = event.dataTransfer.files[0];
		}
		return file;
	}

	function tryRender() {
		localForage.getItem('ebook', (err, value) => {
			if (err) { alert('fuck'); return; }
			if (!value) {
				noBookLoaded = true;
				return;
			}
			noBookLoaded = false;
			let book = ePub(value);
			rendition = book.renderTo(
				document.querySelector('main'),
				{
					manager: "continuous",
					flow: "scrolled", width: "100%",
					fullsize: true
				});
			let displayed = rendition.display();

			book.loaded.metadata.then(x => { metadata = x; });
			book.loaded.navigation.then(toc => {
				toc.forEach((chapter, index) => {
					TOC.push(chapter);
				});
			});
		})
	}

	onMount(() => {
		tryRender();

		const panel = document.querySelector('#dropZone')

		const show = e => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
			panel.style.visibility = 'visible';
		};
		const hide = e => {
			if (!e.fromElement) {
				panel.style.visibility = 'hidden';
			}
		};

		const dragover = e => {
			e.preventDefault();
		};
		const drop = e => {
			e.preventDefault();

			localForage.setItem('ebook', getFile(e), err => {
				if (err) {
					console.error(err);
					alert('fuck');
				}

				location.reload();
			});
		};

		const keydown = e => {
			switch (e.key) {
				case 't':
					showPanel = !showPanel;
					break;
				case 'Escape':
					showPanel = false;
					break;
			}
		};

		const keyup = e => {

		};

		document.addEventListener('keydown', keydown);
		document.addEventListener('keyup', keyup);

		document.addEventListener('dragenter', show);
		document.addEventListener('dragover', dragover);
		document.addEventListener('drop', drop);
		document.addEventListener('dragleave', hide);
		return () => {
			document.removeEventListener('keydown', keydown);
			document.removeEventListener('keyup', keyup);

			document.removeEventListener('dragenter', show);
			document.removeEventListener('dragover', dragover);
			document.removeEventListener('drop', drop);
			document.removeEventListener('dragleave', hide);
		}
	});
</script>

<svelte:head>
	<title>{metadata?.title ?? "untitled"}</title>
	<meta name="description" content={metadata?.description ?? "No description."} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="dropZone"></div>
<main>
	{#if noBookLoaded}
		<div>
			<h1 style="text-align:center">Drop file to get started!</h1>
		</div>
	{:else}
		{#if showPanel}
			<div class="panel">
				<div>
					<a
						href="#"
						on:click={() => {
							localForage.clear();
							location.reload();
							return false;
						}}
					>
						<span class="important">RESTART</span>
					</a>
				</div>
				<hr />
				<ul class="toc">
					{#each TOC as t}
						<Toc {...t}
							on:close={() => { showPanel = false; }}
							rendition={rendition}
						/>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</main>

<style>
	.panel {
		position: fixed;
		width: 38em;
		height: 60%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		z-index: 1;
		overflow-y: scroll;

		background: white;
		border: 3px solid rgb(48, 48, 48);
		border-radius: 12px;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
		padding: 1em 2em;
	}

	.dropZone {
		background: gray;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 999;
		opacity: 0.6;
		visibility: hidden;
	}

	/* style TOC entries */
	:global(.panel a) {
		text-decoration: none;
		color: inherit;
		font-family: monospace;
	}
	:global(.panel a:hover) {
		font-weight: 700;
	}

	.toc ul {
		list-style: none;
		padding: 0;
	}

	/* hide scroll bars */
	.panel::-webkit-scrollbar {
		display: none;
	}
	.panel {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	:global(body::-webkit-scrollbar) {
		display: none;
	}
	:global(body) {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	/* style links on top of .panel */
	.important {
		font-weight: 700;
	}
	.important:hover {
		color: red;
	}

</style>