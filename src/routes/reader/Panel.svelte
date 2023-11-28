<script>
    export let book, rendition, tocData, currentChapter, style;

	import Toc from "./TOC.svelte";
	import Search from "./Search.svelte";
    import { onMount } from "svelte";

    let shown = false, state = 'toc', states = {};
	let search = { 'query': '', 'results': [] };

    export function flip() { shown = !shown; }
    export function hide() { shown = false; }
    export function show() { shown = true; }
    export function set(s) { state = s; }

</script>

{#if shown}
	<div class="background" on:click={() => shown = false}></div>
	<div class="panel">
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
				{#each tocData as t}
					<Toc {...t} {rendition} active={currentChapter}
						on:close={() => shown = false} />
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
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

	textarea {
		margin-top: 1em;
		width: 95%;
		height: 95%;
	}

	.panel {
		position: fixed;
		height: 100%;
		width: 24em;
		top: 0;
		left: 0;

		z-index: 1;
		overflow-y: scroll;

		background: white;
		box-shadow: 0 0 5px -2px black, 0 0 18px -8px black;
		padding: 0em 1em;
	}

    .background {
		position: fixed;
		top: 0%;
		left: 0%;
		width: 100%;
		height: 100%;
		background-color: rgba(0,0,0, 0);
		z-index: 1;
	}
	
	ul {
		list-style: none;
		padding: 0;
	}
</style>
	