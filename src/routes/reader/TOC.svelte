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
    const x = localStorage.getItem(id);
    if (x !== null) {
        open = x == 'true' ? true : false;
    }

    function hasChildren() {
        return subitems.length != 0;
    }
</script>

<li>
    {#if hasChildren()}
        <div
            on:click|preventDefault={() => {
                open = localStorage.getItem(id) === 'true' ? false : true;
                localStorage.setItem(id, open.toString());
            }}
        >
            {#each {length: depth} as _, i} &nbsp;&nbsp;&nbsp;&nbsp; {/each}
            {#if open}
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="text-outline shrink-0" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"></path></svg>
            {:else}
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="text-outline shrink-0" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"></path></svg>
            {/if}
            <a id="chap-{id}"><b>{label.trim()}</b></a>
        </div>

        {#if open}
            <ul>
                {#each subitems as child}
                    <svelte:self
                        {...child} {rendition} {active}
                        depth={depth + 1}
                        on:close={() => dispatch('close')}
                    />
                {/each}
            </ul>
        {/if}
    {:else}
        <div {href}
            class:active={active == href}
            on:click|preventDefault={() => {
                rendition.display(href);
                rendition.display(href);
                dispatch('close');
            }}
        >
            {#each {length: depth} as _, i} &nbsp;&nbsp;&nbsp;&nbsp; {/each}
            <a id="chap-{id}">{label.trim()}</a>
        </div>
    {/if}
</li>

<style>
    svg {
        position: relative;
    }

    div {
        padding: .6em .6em;
        line-height: 1em;
        user-select: none;
    }

    div:hover {
        cursor: pointer;
        background-color: rgba(181, 186, 199, .3);
    }
    div.active:hover {
        background-color: rgba(181, 186, 199, .9);
    }

    .active {
        background-color: rgba(181, 186, 199, .6);
    }

	a {
		text-decoration: none;
		font-family: monospace;
	}

	ul {
		list-style: none;
		padding: 0;
	}
</style>