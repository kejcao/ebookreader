<script>
	import { onMount } from 'svelte';
	import ePub from 'epubjs';

	import Panel from "./Panel.svelte";
	import { readBook, getBooks } from "./util.js";

	let loading = true;

	function handleKeypress(e) {
		if (e.key == 'Escape' && showPanel) {
			showPanel = false;
			return false;
		}
		if (e.key == 't' && !showPanel) {
			showPanel = true;
			return false;
		}

		if (e.ctrlKey) {
			switch (e.key) {
				case 'f':
					panel.set('search');
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

	let mode, style, rendition, currentChapter;

	function injectCSS() {
		rendition.hooks.content.register(
			contents => contents.addStylesheetCss(style));
	}

	// to make our event listeners work in the iframes
	function hookIframes() {
		rendition.on('rendered', (section, iframe) => {
			iframe.document.addEventListener(
				'keydown', handleKeypress, { passive: false });
		});
	}

	function updateProgress(loc) {
		const {page, total} = loc.end.displayed;
		progress = `${Math.ceil(loc.start.percentage * 100)}% (${page - 1}/${total})`;
		currentChapter = loc.end.href;
	}

	let book, metadata;
	async function loadBook(b) {
		metadata = b.metadata;

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
		await rendition.display(localStorage.getItem(`${book.key()}-loc`) ?? undefined);
		await rendition.display(localStorage.getItem(`${book.key()}-loc`) ?? undefined); // second call is a hack to make it work

		loading = false;

		try {
			await book.locations.generate(48); // TODO fix
		} catch(e) { }

		rendition.on('relocated', updateProgress);
		updateProgress(rendition.currentLocation())
	}

	// $: if (style) {
	// 	injectCSS();
	// 	rendition.clear();
	// 	rendition.display();
	// }

	onMount(async () => {
		mode = localStorage.getItem('mode') ?? 'scroll';
		style = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,700;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap');
/*@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap');*/

body {
	text-align: justify !important;
	hyphens: auto !important;
	background-color: rgba(0,0,0,0) !important;
	font-family: 'Crimson Text', serif;
	${
		mode == 'scroll'
			? 'padding: 10em 0 !important;'
			: ''
	}
}

img {
	/* max-width: 28em !important; */
	height: auto;
	object-fit: contain !important;
}
		`;

		const books = await getBooks();
		if (books.length == 0) {
			location.assign('/');
		}
		await loadBook(books[books.length - 1]);
	});


	let panel, showPanel = false;
	let progress;

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

<svg
	width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
	on:click|preventDefault={() => showPanel = !showPanel}
>
	<path d="M5 7H19" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5 12L19 12" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5 17L19 17" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<div class="viewer">
	{#if book}
		<div class="panel" style:visibility={showPanel ? 'visible' : 'hidden'}>
			<Panel bind:book bind:rendition bind:style bind:currentChapter bind:progress bind:this={panel} />
		</div>
	{/if}
	<main class="{mode == 'swipe' ? 'swipe' : ''}"></main>
</div>

<style>
	.viewer {
		display: flex;
	}

	.panel {
		position: fixed;
		left: 0;
		top: 0;
		width: 24em;
		z-index: 1;
	}

	svg {
		position: fixed;
		top: 1px;
		left: 2px;
	}

	.loading-background {
		cursor: wait;
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: #fff;
		z-index: 1;
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
		overflow: auto;
		flex: 2;
		max-width: 28em; /* don't change this without changing img max-width */
		margin: 0 auto;
		/* padding: 0 2em; */
		padding: 0;
	}

	.swipe {
		width: min(80vw, 28rem) !important;
		height: min(80vh, 56rem) !important;
		padding: 2em;
		box-shadow: 0 0 4px #ccc;
	}
</style>
