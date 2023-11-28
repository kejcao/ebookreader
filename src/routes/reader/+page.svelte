<script>
	import { onMount } from 'svelte';
	import ePub from 'epubjs';

	import Panel from "./Panel.svelte";
	import { readBook, getBooks } from "./util.js";

	let loading = true;

	function handleKeypress(e) {
		switch (e.key) {
			// case 'Tab':
			// 	e.preventDefault();
			// 	panel.flip();
			// 	break;
			case 'Escape':
				panel.hide();
				break;
		}

		if (e.ctrlKey) {
			switch (e.key) {
				case 'q':
					panel.flip();
					break;
				case 'f':
					panel.show();
					panel.set('search');
					e.preventDefault();
					break;
				case 's':
					// if (panel == true && panelMode != 'settings') {
					// 	panelMode = 'settings';
					// } else {
					// 	panelMode = 'settings';
					// 	panel = !panel;
					// }
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
		updateProgress(rendition.currentLocation())
		loading = false;
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

p {
	text-align: justify !important;
	hyphens: auto !important;
}

body {
	font-family: 'Crimson Text', serif;
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

		const books = await getBooks();
		if (books.length == 0) {
			location.assign('/');
		}
		await loadBook(books[books.length - 1]);
	});

	let panel;
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
<Panel bind:book bind:rendition bind:tocData bind:style bind:currentChapter bind:this={panel} />
<div>
	<div class="progress">{progress}%</div>
	<div class="chapter-progress">{chapterProgress}</div>
</div>
<main class="{mode == 'swipe' ? 'swipe' : ''}"></main>

<style>
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
		/* width: min(90vw, 38rem) !important; */
		width: 28rem !important;
	}

	.swipe {
		width: min(80vw, 28rem) !important;
		height: min(80vh, 56rem) !important;
		padding: 2em;
		box-shadow: 0 0 4px #ccc;
	}
</style>