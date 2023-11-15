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
	}

	// function updateCurrentChapterHighlight() {
	// 	try {
	// 		let href = rendition.currentLocation().end.href;
	// 		for (const x of document.querySelectorAll('.panel div')) {
	// 			x.style.color = x.getAttribute('href') == href ? 'red' : '';
	// 		}
	// 	} catch(_) { }
	// }

	// $: panel, updateCurrentChapterHighlight();

	let active;

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

			function updateProgress(loc) {
				const {page, total} = loc.end.displayed;
				chapterProgress = (page - 1) + '/' + total;
				progress = Math.ceil(loc.start.percentage * 100);
				active = loc.end.href;
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
						hyphens: auto;
						padding-top: 10em !important;
						padding-bottom: 10em !important;
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
			book.loaded.navigation.then(toc => {
				toc.forEach((chapter, index) => {
					TOC.push(chapter);
				});
			});
		});
	});

	let panel = 'hidden';
	let progress = 'N/A', chapterProgress = 'N/A';

    $: if (typeof document !== 'undefined') {
		document.body.style.overflow =
			panel == 'hidden' ? 'auto' : 'hidden';
	}
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

<svelte:document on:keydown={handleKeypress} />

<main>
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
			{#each TOC as t}
				<Toc {...t} {rendition} {active}
					on:close={() => panel = 'hidden'} />
			{/each}
		</ul>
	</div>
	<div class="progress">{progress}%</div>
	<div class="chapter-progress">{chapterProgress}</div>
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
</style>