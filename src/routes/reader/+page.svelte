<script>
	import { onMount } from 'svelte';
	import ePub from 'epubjs';

	import Toc from "./TOC.svelte";
	import Search from "./Search.svelte";
	import { readBook, getBooks } from "./util.js";

	let loading = true;

	function handleKeypress(e) {
		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				if (showSearch == true) {
					showSearch = false;
					break;
				}
				panel = !panel;
				break;
			case 'Escape':
				panel = false;
				break;
		}

		if (e.ctrlKey) {
			switch (e.key) {
				case 'f':
					showSearch = true;
					panel = true;
					e.preventDefault();
					break;
				case 'm':
					mode = mode == 'swipe' ? 'scroll' : 'swipe';
					location.reload();
					break;
			}
			return
		}

		if (mode == 'swipe') {
			switch (e.key) {
				case 'ArrowRight': case 'PageDown':
					rendition.next(); break;
				case  'ArrowLeft': case   'PageUp':
					rendition.prev(); break;
			}
			if (e.key == ' ') {
				e.shiftKey
					? rendition.prev()
					: rendition.next();
			}
		}
	}

	let mode, rendition, currentChapter;
	let search = { 'query': '', 'results': [] };

	function injectCSS() {
		rendition.book.spine.hooks.content.register(doc => {
			const style = doc.createElement('style');
			style.innerHTML = `
				@import url('https://fonts.cdnfonts.com/css/dejavu-serif');

				p {
					text-align: justify !important;
					hyphens: auto !important;
				}

				html, p {
					font-size: 1.1rem;
				}

				body {
					font-family: "DejaVu Serif", serif;
					${
						mode == 'scroll'
							? 'padding: 10em 0 !important;'
							: ''
					}
				}

				img {
					max-width: 100% !important;
					height: auto !important;
					object-fit: contain !important;
				}
			`;
			doc.querySelector('head').appendChild(style);
		});
	}

	// to make our event listeners work in the iframes
	function hookIframes() {
		rendition.on('rendered', (_, iframe) => {
			iframe.document.addEventListener(
				'keydown', handleKeypress, { passive: false });
		});
	}

	function updateProgress(loc) {
		const {page, total} = loc.end.displayed;
		chapterProgress = (page - 1) + '/' + total;
		progress = Math.ceil(loc.start.percentage * 100);
		currentChapter = loc.end.href;
	}

	let book, metadata, tocData = [];
	async function loadBook(b) {
		metadata = b.metadata;
		tocData = b.toc;
		book = ePub(b.file);

		rendition = book.renderTo(
			document.querySelector('main'),
			{
				manager: "continuous",
				width: "100%", allowPopups: true,
				...(mode == 'swipe'
					? { flow: "paginated", height: "100%" }
					: { flow: "scrolled", fullsize: true })
			});

		hookIframes();
		injectCSS();

		await book.ready;
		await book.locations.generate(1024);

		rendition.on('relocated', updateProgress);

		await rendition.display(localStorage.getItem(`${book.key()}-loc`) ?? undefined);
		await rendition.display(localStorage.getItem(`${book.key()}-loc`) ?? undefined); // second call is a hack to make it work
		loading = false;
		updateProgress(rendition.currentLocation())
	}

	onMount(async () => {
		mode = localStorage.getItem('mode') ?? 'scroll';

		const books = await getBooks();
		if (books.length == 0) {
			location.assign('/');
		}
		await loadBook(books[books.length - 1]);
	});

	let panel = false, showSearch = false;
	let progress = 'N/A', chapterProgress = 'N/A';

	let results = [];

	$: switch(mode) {
		case 'swipe':
			document.querySelector('html').style = `height:${mode == 'swipe' ? '100%' : 'auto'}`;
			break;
	}
</script>

<svelte:head>
	<title>{metadata?.title ?? 'Untitled'} - eBook Reader</title>
	<meta name="description" content={metadata?.description ?? "No description."} />
</svelte:head>

<svelte:window
	on:beforeunload={_ => {
		localStorage.setItem(`${book.key()}-loc`, rendition.currentLocation().start.cfi);
		localStorage.setItem('mode', mode);
	}}
	on:swiperight={() => mode == 'swipe' && rendition.next()}
	on:swipeleft={() => mode == 'swipe' && rendition.prev()}
/>
<svelte:document on:keydown|nonpassive={handleKeypress} />

{#if loading}
	<div class="loading-background"></div>
{/if}
{#if panel}
	<div
		class="panel-background"
		on:click={() => panel = false}
	></div>
	<div class="panel">
		{#if showSearch}
			<!-- <Search {book} {rendition} bind:search /> -->
		{:else}
			<ul class="toc">
				{#each tocData as t}
					<Toc {...t} {rendition} active={currentChapter}
						on:close={() => panel = false} />
				{/each}
			</ul>
		{/if}
	</div>
{/if}
<div class="progress">{progress}%</div>
<div class="chapter-progress">{chapterProgress}</div>
<main class="{mode == 'swipe' ? 'swipe' : ''}">
</main>

<style>
	.panel-background {
		position: fixed;
		top: 0%;
		left: 0%;
		width: 100%;
		height: 100%;
		background-color: rgba(0,0,0, 0);
		z-index: 1;
	}

	.loading-background {
		position: fixed;
		top: 0%;
		left: 0%;
		width: 100%;
		height: 100%;
		background-color: rgb(255, 255, 255);
		z-index: 1;
	}

	.progress {
		position: fixed;
		top: 100%;
		left: 100%;
		transform: translate(-100%, -100%);

		font-family: monospace;
	}

	.chapter-progress {
		position: fixed;
		top: 100%;
		left: 0%;
		transform: translate(0%, -100%);

		font-family: monospace;
	}

	.panel {
		position: fixed;
		height: 100%;
		width: 24em;
		top: 0;
		left: 0;

		/* width: 100%;
		display: flex;
		align-items: center;
		justify-items: center; */

		z-index: 1;
		overflow-y: scroll;

		background: white;
		box-shadow: 0 0 5px -2px black, 0 0 18px -8px black;
		padding: 0em 1em;
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

	main {
		width: min(90vw, 48rem) !important;
	}

	.swipe {
		width: min(80vw, 52rem) !important;
		height: min(80vh, 56rem) !important;
		padding: 2em;
		box-shadow: 0 0 4px #ccc;
	}
</style>