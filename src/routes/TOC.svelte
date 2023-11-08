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
</script>

<style>
</style>

<li>
    <!-- {#if subitems.length != 0}
        <a href="#" on:click={() => { open = !open; }}><b>{open ? '↑' : '↓'}</b></a>
    {/if} -->

    {#if subitems.length != 0}
        <a
            on:click={() => {
                open = !open;
            }}

            href="#"
            id="chap-{id}"
        >
            <i>{label.trim()}</i>
        </a>
    {:else}
        <a
            on:click={() => {
                rendition.display(href);
                dispatch('close');
                return false;
            }}

            href="#"
            id="chap-{id}"
        >
            {label.trim()}
        </a>
    {/if}

    {#if subitems.length != 0 && open}
        <ul>
            {#each subitems as subitem}
                <svelte:self
                    {...subitem}
                    on:close={() => { dispatch('close'); }}
                    rendition={rendition}
                />
            {/each}
        </ul>
    {/if}
</li>