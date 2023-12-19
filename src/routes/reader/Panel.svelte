<script>
    export let book, rendition, currentChapter, style, progress;

	import Toc from "./TOC.svelte";
	import Search from "./Search.svelte";
    import { onMount } from "svelte";

    let state = 'toc', states = {};
	let search = { 'query': '', 'results': [] };

	// see https://github.com/futurepress/epub.js/issues/1084#issuecomment-647002309
	function fixNav(nav) {
		function reorient(url) {
			const base = 'https://example.invalid/';
			return new URL(url, base + (book.packaging.navPath || book.packaging.ncxPath)).href.replace(base, '')
		}

		function f(section) {
			section.href = book.spine.get(reorient(section.href))?.href;
			section.subitems = section.subitems.map(f);
			return section;
		}

		return nav.map(f);
	}

	$: if (typeof(progress) !== "undefined") {
		const [percentage, ..._] = progress.split(' ');
		document.querySelector('#book').value = parseInt(percentage);
		document.querySelector('#book').title = progress;
	}

    export function set(s) { state = s; }
</script>

<div>
	<progress id="book" max="100"></progress>
	<nav>
		<ul>
			<li class={state == 'toc' ? 'active' : ''} on:click={() => set('toc')}>toc</li>
			<li class={state == 'settings' ? 'active' : ''} on:click={() => set('settings')}>settings</li>
			<li class={state == 'search' ? 'active' : ''} on:click={() => set('search')}>search</li>
		</ul>
	</nav>

	{#if state == 'search'}
		<Search {book} {rendition} bind:search />
	{:else if state == 'settings'}
		<textarea bind:value={style}></textarea>
	{:else}
		<ul class="toc">
			{#await book.loaded.navigation}
				loading...
			{:then nav}
				{#each fixNav(nav.toc) as t}
					<Toc {...t} {rendition} active={currentChapter}
						on:close={() => {}} />
				{/each}
			{/await}
		</ul>
	{/if}
</div>

<style>
	progress {
		position: sticky;
		margin: 2px;
		margin-top: 6px;
		appearance: none;
		width: 100%;
		height: 1.2em;
		background: white;
	}

	progress::-webkit-progress-bar {
		background: white;
		border: 1px solid gray;
		border-radius: 4px;
	}

	progress::-webkit-progress-value {
		/* background: lightgray; */
		background: repeating-linear-gradient(
			45deg,
			lightgray,
			lightgray 10px,
			rgb(180, 180, 180) 10px,
			rgb(180, 180, 180) 20px
		);
		opacity: .5;
	}

	progress::before {
		z-index: 999;
		content: attr(title);
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	progress:not([value])::before {
		content: 'loading...';
	}

	div {
		height: 100dvh;
		position: sticky;
		top: 0;
		flex: 0 0 300px;

		overflow-y: scroll;
		background: white;
		box-shadow: 0 0 5px -2px black, 0 0 18px -12px black;
		padding: 0em 1em;
		font-family: monospace;
	}

	div::-webkit-scrollbar {
		display: none;
	}
	div {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	
	ul {
		list-style: none;
		padding: 0;
	}

	nav > ul {
		margin: .5em 0;
		padding: 0;
		display: flex;
		width: 100%;
	}

	nav li {
		flex: 1;
		display: inline;
		text-align: center;
        padding: .6em 0;
        border-bottom: 1px solid #dee2e6;
    }

    nav li:hover {
        cursor: pointer;
    }

    nav li:hover:not(.active) {
        border-radius: .25rem;
        background-color: #dee2e640;
    }

    li.active {
		border: 1px solid #dee2e6;
        border-top-left-radius: .5rem;
        border-top-right-radius: .5rem;
        border-bottom: 0;
    }

	/* textarea {
		margin-top: 1em;
		width: 95%;
		height: 95%;
	} */
</style>