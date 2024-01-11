<script>
	export let book, rendition, currentChapter, style, progress, showPanel;

	import Toc from "./TOC.svelte";
	import Search from "./Search.svelte";

	let state = "toc";
	let search = { query: "", results: [] };

	// see https://github.com/futurepress/epub.js/issues/1084#issuecomment-647002309
	function fixNav(nav) {
		function reorient(url) {
			const base = "https://example.invalid/";
			return new URL(
				url,
				base + (book.packaging.navPath || book.packaging.ncxPath),
			).href.replace(base, "");
		}

		function f(section) {
			section.href = book.spine.get(reorient(section.href))?.href;
			section.subitems = section.subitems.map(f);
			return section;
		}

		return nav.map(f);
	}

	$: if (typeof progress !== "undefined") {
		const [percentage, ..._] = progress.split(" ");
		document.querySelector("#book").value = parseInt(percentage);
		document.querySelector("#book").title = progress;
	}

	export function set(s) {
		state = s;
	}
</script>

<section>
	<div>
		<button
			type="button"
			on:click|preventDefault={() => (showPanel = false)}
		>
			<svg
				role="img"
				viewBox="0 0 1024 1024"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill="#000000"
					d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z"
				/>
			</svg>
		</button>
		<progress id="book" max="100"></progress>
	</div>

	<nav>
		<ul>
			<li
				class={state == "toc" ? "active" : ""}
				on:click={() => set("toc")}
			>
				toc
			</li>
			<!-- <li class={state == 'settings' ? 'active' : ''} on:click={() => set('settings')}>settings</li> -->
			<li
				class={state == "search" ? "active" : ""}
				on:click={() => set("search")}
			>
				search
			</li>
		</ul>
	</nav>

	{#if state == "search"}
		<Search {book} {rendition} bind:search />
	{:else if state == "settings"}
		<textarea bind:value={style}></textarea>
	{:else}
		<ul class="toc">
			{#await book.loaded.navigation}
				loading...
			{:then nav}
				{#each fixNav(nav.toc) as t}
					<Toc
						{...t}
						{rendition}
						active={currentChapter}
						on:close={() => {}}
					/>
				{/each}
			{/await}
		</ul>
	{/if}
</section>

<style>
	div {
		margin-top: 6px;
		display: flex;
	}

	button {
		width: 32px;
		height: 32px;
		padding: 0;
		margin-right: 4px;

		appearance: none;
		border: none;
		background-color: transparent;

		& > svg {
			opacity: 0.7;

			&:hover {
				opacity: 1;
				cursor: pointer;
			}
		}
	}

	progress {
		margin: 0;
		appearance: none;
		width: 100%;
		height: auto;
		background: white;

		&::-webkit-progress-bar {
			background: white;
			border: 1px solid gray;
			border-radius: 2px;
		}
		&::-webkit-progress-value {
			background: repeating-linear-gradient(
				-45deg,
				lightgray,
				lightgray 10px,
				rgb(180, 180, 180) 10px,
				rgb(180, 180, 180) 20px
			);
			opacity: 0.5;
		}

		&:not([value])::-webkit-progress-bar {
			background: repeating-linear-gradient(
				-45deg,
				lightgray,
				lightgray 10px,
				rgb(180, 180, 180) 10px,
				rgb(180, 180, 180) 20px
			);
			opacity: 0.2;
		}
	}

	section {
		height: 100dvh;
		position: sticky;
		top: 0;
		flex: 0 0 300px;

		overflow-y: scroll;
		background: white;
		box-shadow:
			0 0 5px -2px black,
			0 0 18px -12px black;
		padding: 0em 1em;
		font-family: monospace;

		scrollbar-width: none;
		-ms-overflow-style: none;
		&::-webkit-scrollbar {
			display: none;
		}
	}

	ul {
		list-style: none;
		padding: 0;
	}

	nav > ul {
		margin: 0.5em 0;
		padding: 0;
		display: flex;
		width: 100%;
	}

	nav {
		& li {
			flex: 1;
			display: inline;
			text-align: center;
			padding: 0.6em 0;
			border-bottom: 1px solid gray;
			border: 1px solid white;
		}

		& li:not(.active) {
			border-bottom: 1px solid gray;
			background-color: whitesmoke;
		}

		& li:hover {
			cursor: pointer;
		}

		& li:hover:not(.active) {
			background-color: lightgray;
		}
	}

	li.active {
		font-weight: 700;
		border: 1px solid gray;
		border-top-left-radius: 2px;
		border-top-right-radius: 2px;
		border-bottom: 0;
	}
</style>
