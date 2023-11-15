<script>
	export let href = '';
	export let id = '';
	export let label = '';
	export let parent = '';
	export let subitems = [];
    export let rendition;
    export let active;
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
                    <svelte:self
                        {...child} {rendition} {active}
                        depth={depth + 1.5}
                        on:close={() => dispatch('close')}
                    />
                {/each}
            </ul>
        {/if}
    {:else}
        <div {href}
            class={active == href ? 'active' : ''}
            on:click|preventDefault={() => {
                rendition.display(href);
                dispatch('close');
            }}
        >
            <a id="chap-{id}">{label.trim()}</a>
        </div>
    {/if}
</li>

<style>
    div {
        padding: .2em 0;
        line-height: .9em;
        user-select: none;
    }

    .active {
        text-decoration: underline;
        color: black;
    }

    div:hover {
        cursor: pointer;
        font-weight: 700;
        background-color: rgba(228, 228, 228, .4);
    }
</style>