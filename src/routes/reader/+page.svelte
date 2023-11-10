<script>
// @ts-nocheck

	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	import Toc from "./TOC.svelte";

	let metadata, rendition, book, TOC = [];

	function addFile(file) {
		localForage.setItem('ebook', file)
			.then(() => { location.reload(); });
	}

	function handleKeypress(e) {
		switch(e.key) {
			case 't':
				panel = panel == 'visible' ? 'hidden' : 'visible';
				break;
			case 'Escape':
				panel = 'hidden';
				break;
		}

		let href;
		if (rendition.currentLocation == undefined) {
			href = null;
		} else {
			href = rendition.currentLocation().end.href;
		}
		for (const x of document.querySelectorAll('.panel div')) {
			x.style.color = x.getAttribute('href') == href ? 'red' : '';
		}
	}

	onMount(() => {
		localForage.getItem('ebook', (err, value) => {
			if (err) {
				alert('something went wrong');
				location.assign('/');
			}

			// if no value stored then return to homepage
			if (!value) { location.replace('/'); }

			// otherwise initialize the ebook
			book = ePub(value);
			rendition = book.renderTo(
				document.querySelector('main'),
				{
					manager: "continuous",
					flow: "scrolled", width: "100%",
					fullsize: true
				});

			// to make our keybinds work in iframe pages
			rendition.on('keydown', handleKeypress)

			// inject our own CSS to make ebooks look nicer
			rendition.hooks.content.register(contents => {
				contents.addStylesheetCss(`
					@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap');
					body {
						font-family: "EB Garamond", serif;
						font-size: 1.2rem !important;
						text-align: justify;
						hyphens: auto;
						padding-top: 10em !important;
						padding-bottom: 10em !important;
					}
					
					img {
						width: 100% !important;
						height: auto !important;
						object-fit: contain !important;
					}
				`);
			});

			book.loaded.metadata.then(x => {
				// try to load the saved reader position
				let loc = localStorage.getItem(book.key());
				if (loc) {
					rendition.display(loc)
						.then(_ => {
							// this is a hack to make it work
							rendition._display(loc)
						})
				}

				// save the metadata (for title and desc)
				metadata = x;
			});

			// save the table of contents
			book.loaded.navigation.then(toc => {
				toc.forEach((chapter, index) => {
					TOC.push(chapter);
				});
			});
		});
	});

	let dropZone = 'hidden', panel = 'hidden';
</script>

<svelte:head>
	<title>{metadata?.title ?? "eBook Reader"}</title>
	<meta name="description" content={metadata?.description ?? "No description."} />
</svelte:head>

<svelte:window
	on:beforeunload={_ => {
		// save reader position before exiting
		localStorage.setItem(book.key(), rendition.currentLocation().start.cfi);
		return null;
	}}
/>

<svelte:document
	on:keydown={handleKeypress}
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
	on:drop|preventDefault={e => {
		if (e.dataTransfer.items) {
			const item = e.dataTransfer.items[0];
			if (item.kind == 'file') {
				addFile(item.getAsFile());
			}
		} else {
			addFile(e.dataTransfer.files[0]);
		}
		dropZone = 'hidden';
	}}
/>

<div class="dropZone" style:visibility={dropZone}>
	<div><h1>DROP HERE!</h1></div>
</div>

<main>
	<div class="panel" style:visibility={panel}>
		<div>
			<a
				href="#"
				on:click={() => {
					localForage.clear();
					location.assign('/');
					return false;
				}}
			>
				RESTART
			</a>
		</div>
		<hr />
		<ul class="toc">
			{#each TOC as t}
				<Toc {...t} {rendition} on:close={() => panel = 'hidden'} />
			{/each}
		</ul>
	</div>
</main>

<style>
	.panel {
		position: fixed;
		width: 38em;
		height: 60%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		z-index: 2;
		overflow-y: scroll;

		background: white;
		border: 2px solid rgb(37, 37, 37);
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

	/* style TOC entries */
	:global(.panel a) {
		text-decoration: none;
		color: inherit;
		font-family: monospace;
	}
	:global(.panel a:hover) {
		font-weight: 700;
	}

	:global(.toc, .toc ul) {
		list-style: none;
		padding: 0;
	}

	/* hide scroll bar */
	:global(body::-webkit-scrollbar) {
		display: none;
	}
	:global(body) {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	/* fix epubjs toc jump */
	:global(.epub-container *) {
		overflow-anchor: none !important;
	}
</style>