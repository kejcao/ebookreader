<script>
	export let href = '';
	export let id = '';
	export let label = '';
	export let parent = '';
	export let subitems = [];
    export let rendition;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    let open = false;

    function hasChildren() {
        return subitems.length != 0;
    }
</script>

<li>
    <!-- {#if subitems.length != 0}
        <a href="#" on:click={() => { open = !open; }}><b>{open ? '↑' : '↓'}</b></a>
    {/if} -->

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
                    <svelte:self {...child}
                        on:close={() => { dispatch('close'); }}
                        rendition={rendition}
                    />
                {/each}
            </ul>
        {/if}
    {:else}
        <div
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
    div:hover {
        cursor: pointer;
        font-weight: 700;
    }
</style>