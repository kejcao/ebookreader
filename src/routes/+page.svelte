<script>
	let dragover = false;
	let ref;

	function getFile(e) {
		let file;
		if (e.dataTransfer.items) {
			const x = e.dataTransfer.items[0];
			if (x.kind === "file") {
				file = x.getAsFile();
			}
		} else {
			file = e.dataTransfer.files[0];
		}
		return file;
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
</svelte:head>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<main>
	<div class="msg">
		<h1>{dragover ? '' : 'Drag & drop or select an ebook'}</h1>
	</div>
	<div
		class="dragndrop {dragover ? 'dragover' : ''}"
		on:drop={e => {
			e.preventDefault();
			dragover = false;

			let book = ePub(getFile(e));
			let rendition = book.renderTo(
				document.body,
				{
					manager: "continuous",
					flow: "scrolled", width: "100%"
				});
			let displayed = rendition.display();

			displayed.then(renderer => { });
			book.loaded.navigation.then(toc => {
				console.log(toc);
			});
		}}
		on:dragover={e => {
			e.preventDefault();
			dragover = true;
		}}
		on:dragleave={e => {
			dragover = false;
		}}
	>
	</div>
</main>

<style>
	.dragndrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		background-color: skyblue;
	}

	.msg {
		text-align: center;
	}

	.dragover {
		opacity: 1;
	}
</style>