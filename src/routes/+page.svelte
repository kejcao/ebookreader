<script>
	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	let dragover = false;
	let panel, metadata, blank = true;

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
				blank = true;
				return;
			}
			blank = false;
			let book = ePub(value);
			let rendition = book.renderTo(
				document.body,
				{
					manager: "continuous",
					flow: "scrolled", width: "100%"
				});
			let displayed = rendition.display();

			book.loaded.metadata.then(x => { metadata = x; });
			book.loaded.navigation.then(toc => {
				toc.forEach((chapter, index) => {
					const x = document.querySelector('.toc');
					
					let item = document.createElement('li');
					let link = document.createElement('a');
					link.id = `chapter-${chapter.id}`;
					link.href = chapter.href;
					link.innerText = chapter.label.trim();
					link.classList.add('link');
					link.onclick = () => {
						rendition.display(link.getAttribute("href"));
						return false;
					};
					item.appendChild(link);
					x.appendChild(item);
				});
			});
		})
	}

	onMount(() => {
		tryRender();

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

		document.addEventListener('dragenter', show);
		document.addEventListener('dragover', dragover);
		document.addEventListener('drop', drop);
		document.addEventListener('dragleave', hide);
		return () => {
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
</svelte:head>

<main>
	{#if blank}
		<div class="center">
			<h1>Drop file to get started!</h1>
		</div>
	{:else}
		<div class="left">
			<div>
				<a on:click={() => {
					localForage.clear();
					location.reload();
					return false;
				}}>restart</a>
			</div>
			<ul class="toc"></ul>
		</div>
	{/if}
	<div bind:this={panel} class="dropZone"></div>
</main>

<style>
	.center {
		text-align: center;
	}

	.toc {
		list-style: none;
		padding: 0;
	}

	.left {
		position: fixed;
		top: 0;
		left: 0;
		border: 2px solid black;
		border-radius: 16px;
		padding: 1em 2em;
		margin: 1em 1em;
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

	.left a {
		text-decoration: none;
		color: inherit;
		font-family: monospace;
		text-transform: uppercase;
	}

	:global(.epub-container) {
		background: white;
	}

	:global(.left a) {
		text-decoration: none;
		color: inherit;
		font-family: monospace;
	}

	:global(.left a:hover) {
		font-weight: 700;
	}
</style>