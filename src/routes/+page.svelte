<script>
// @ts-nocheck

	// TODO: highlight TOC chapter user is currently on
	// TODO: Fix TOC jump not working.
	// TODO: Fix book fast scroll.
	// TODO: verify file input (that there is only one input, that it's epub, etc.).
	// TODO: make "DROP HERE!" text darker.

	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	import Toc from "./TOC.svelte";

	let dragover = false, noBookLoaded = false, showPanel = false;
	let metadata, rendition, TOC = [];

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

			rendition.hooks.content.register(contents => {
				contents.addStylesheetCss(`
					@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap');
					body {
						font-family: "EB Garamond", serif !important;
						font-size: 1.2rem !important;
					}
					
					img {
						width: 100% !important;
						height: auto !important;
						object-fit: contain !important;
					}
				`);
			});

			book.loaded.metadata.then(x => { metadata = x; });
			book.loaded.navigation.then(toc => {
				toc.forEach((chapter, index) => {
					TOC.push(chapter);
				});
			});
		})
	}
	onMount(tryRender);

	function addFile(file) {
		localForage.setItem('ebook', file)
			.then(() => { location.reload(); });
	}

	let dropZone;
</script>

<svelte:head>
	<title>{metadata?.title ?? "untitled"}</title>
	<meta name="description" content={metadata?.description ?? "No description."} />
</svelte:head>

<svelte:document
	on:keydown={e => {
		switch(e.key) {
			case 't':
				showPanel = !showPanel;
				break;
			case 'Escape':
				showPanel = false;
				break;
		}
	}}
	on:dragenter|preventDefault={e => {
		e.dataTransfer.dropEffect = 'copy';
		dropZone.style.visibility = 'visible';
	}}
	on:dragleave|preventDefault={e => {
		if (!e.fromElement) {
			dropZone.style.visibility = 'hidden';
		}
	}}
	on:dragover|preventDefault
	on:drop|preventDefault={e => {
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
		addFile(getFile(e));
	}}
/>

<div bind:this={dropZone} class="dropZone">
	<div class="msg">
		<h1>DROP HERE!</h1>
	</div>
</div>
<main>
	{#if noBookLoaded}
		<div class="dropZoneStart">
			<div>
				<svg width="16em" height="16em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 16V22M12 16L14 18M12 16L10 18" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M22 13.3529C22 15.6958 20.5562 17.7055 18.5 18.5604M14.381 8.02721C14.9767 7.81911 15.6178 7.70588 16.2857 7.70588C16.9404 7.70588 17.5693 7.81468 18.1551 8.01498M7.11616 10.6089C6.8475 10.5567 6.56983 10.5294 6.28571 10.5294C3.91878 10.5294 2 12.4256 2 14.7647C2 16.6611 3.26124 18.2664 5 18.8061M7.11616 10.6089C6.88706 9.9978 6.7619 9.33687 6.7619 8.64706C6.7619 5.52827 9.32028 3 12.4762 3C15.4159 3 17.8371 5.19371 18.1551 8.01498M7.11616 10.6089C7.68059 10.7184 8.20528 10.9374 8.66667 11.2426M18.1551 8.01498C19.0446 8.31916 19.8345 8.83436 20.4633 9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
				<input
					id="upload" type="file"
					on:change={e => {
						addFile(e.target.files[0]);
					}}
				/>
				<h1>DRAG EPUB FILES<br />OR
					<a
						on:click|preventDefault={() => {
							document.querySelector('#upload').click();
						}}
						href="#"
					>
						CLICK TO UPLOAD
					</a>
				</h1>
			</div>
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
	#upload {
		display: none;
	}

	.dropZoneStart {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;

		opacity: .8;

		position: fixed;
		width: 38em;
		height: 38em;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
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
		border: 3px solid rgb(48, 48, 48);
		border-radius: 12px;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
		padding: 1em 2em;
	}

	.msg {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		color: #000;
		opacity: 1;

		z-index: 999;
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

	/* add padding to chapters */
	:global(.epub-view) {
		padding: 4em 0;
	}

	/* style links on top of .panel */
	.important {
		font-weight: 700;
	}
	.important:hover {
		color: red;
	}
</style>