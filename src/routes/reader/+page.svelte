<script>
// @ts-nocheck

	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	import Toc from "./TOC.svelte";

	function addFile(file) {
		localForage.setItem('ebook', file)
			.then(() => { location.reload(); });
	}

	function handleKeypress(e) {
		switch (e.key) {
			case 't':
			case 'Tab':
				panel = panel == 'visible' ? 'hidden' : 'visible';
				e.preventDefault();
				break;
			case 'Escape':
				panel = 'hidden';
				break;
			case 'm':
				mode = mode == 'swipe' ? 'scroll' : 'swipe';
				location.reload();
				break;
		}

		if (mode == 'swipe') {
			switch (e.key) {
				case 'ArrowRight':
				case 'l': case 'j':
					rendition.next()
					break;
				case 'ArrowLeft':
				case 'h': case 'k':
					rendition.prev()
					break;
			}
		}
	}

	let mode, metadata, rendition, book, currentChapter, tocData = [];

	onMount(() => {
		mode = localStorage.getItem('mode') ?? 'swipe';

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
				mode == 'swipe'
					? {
						manager: "continuous",
						flow: "paginated",
						width: "100%", height: "100%"
					}
					: {
						manager: "continuous",
						flow: "scrolled", width: "100%",
						fullsize: true
					});

			function updateProgress(loc) {
				const {page, total} = loc.end.displayed;
				chapterProgress = (page - 1) + '/' + total;
				progress = Math.ceil(loc.start.percentage * 100);
				currentChapter = loc.end.href;
			}

			// code to get and update percentage
			book.ready
				.then(async () => {
					// we're imitating the book.locations.generate() function

					const locs = book.locations;

					locs.break = 1024;

					let xs = [];
					locs.spine.each(x => xs.push(x));
					for (const section of xs) {
						await (locs.process.bind(locs))(section);
					}

					locs.total = locs._locations.length - 1;
					if (locs._currentCfi) {
						locs.currentLocation = locs._currentCfi;
					}

					rendition.on('relocated', updateProgress);
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
						${ // we only need this CSS if in scroll mode
							mode == 'scroll'
								? 'padding: 10em 0 !important;'
								: ''
						}
						hyphens: auto;
					}
					
					img {
						max-width: 100% !important;
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
						.then(() => {
							// this is a hack to make it work
							rendition._display(loc)
							updateProgress(rendition.currentLocation())
						})
				} else {
					rendition.display()
						.then(() => updateProgress(rendition.currentLocation()))
				}

				// save the metadata (for title and desc)
				metadata = x;
			});

			// save the table of contents
			book.loaded.navigation.then(toc => tocData = toc.toc);
		});
	});

	let panel = 'hidden';
	let progress = 'N/A', chapterProgress = 'N/A';

	// if panel is displayed, then lock the scroll of body element.
    $: if (typeof document !== 'undefined') {
		document.body.style.overflow =
			panel == 'hidden' ? 'auto' : 'hidden';
	}

	$: switch(mode) {
		case 'swipe':
			document.querySelector('html').style = `height:${mode == 'swipe' ? '100%' : 'auto'}`;
			break;
	}
</script>

<svelte:head>
	<title>{metadata?.title ?? "eBook Reader"}</title>
	<meta name="description" content={metadata?.description ?? "No description."} />
</svelte:head>

<!-- TODO make swipe work only if mode is scroll -->
<svelte:window
	on:beforeunload={_ => {
		// save reader configuration before exiting
		localStorage.setItem(book.key(), rendition.currentLocation().start.cfi);
		localStorage.setItem('mode', mode);
	}}
	on:swiperight={() => rendition.next()}
	on:swipeleft={() => rendition.prev()}
/>
<svelte:document on:keydown={handleKeypress} />

<div
	class="panel-background"
	style:visibility={panel}
	on:click={() => panel = 'hidden'}
></div>
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
		{#each tocData as t}
			<Toc {...t} {rendition} active={currentChapter}
				on:close={() => panel = 'hidden'} />
		{/each}
	</ul>
</div>
<div class="progress">{progress}%</div>
<div class="chapter-progress">{chapterProgress}</div>
<main class="{mode == 'swipe' ? 'swipe' : ''}"></main>

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
		width: min(90vw, 32rem) !important;
	}

	.swipe {
		height: min(90vh, 48rem) !important;
		box-shadow: 0 0 4px #ccc;
	}
</style>