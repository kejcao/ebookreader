<script>
	import { onMount } from 'svelte';
	import localForage from 'localforage';
	import ePub from 'epubjs';

	let dragover = false;

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
			if (err) { return; }
			let book = ePub(value);
			let rendition = book.renderTo(
				document.body,
				{
					manager: "continuous",
					flow: "scrolled", width: "100%"
					});
			let displayed = rendition.display();

			// displayed.then(renderer => { });
			// book.loaded.navigation.then(toc => {
			// 	console.log(toc);
			// });
		})
	}

	let panel;

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
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<main>
	<div bind:this={panel} class="dropZone"></div>
</main>

<style>
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
</style>