<script>
	export let href = '';
	export let id = '';
	export let label = '';
	export let parent = '';
	export let subitems = [];
    export let rendition;
    export let depth = 0;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    let open = false;

    function hasChildren() {
        return subitems.length != 0;
    }
</script>

<li style:padding-left="{depth}em">
    {#if hasChildren()}
        <div
            on:click={() => {
                open = !open;
                return false;
            }}
        >
            <a id="chap-{id}"><i>{label.trim()}</i></a>
        </div>

        {#if open}
            <ul>
                {#each subitems as child}
                    <svelte:self {...child} {rendition} depth={depth+1.5}
                        on:close={() => { dispatch('close'); }} />
                {/each}
            </ul>
        {/if}
    {:else}
        <div {href}
            on:click={() => {
                rendition.display(href);
                dispatch('close');
                return false;
            }}
        >
            <a id="chap-{id}">{label.trim()}</a>
        </div>
    {/if}
</li>

<style>
    li {
        padding: .2em 0;
        line-height: .9em;
    }

    div:hover {
        cursor: pointer;
        font-weight: 700;
    }
</style>