<script>
    export let book, rendition, search;

    let caseSensitivity = true, matchWords = false;

    function traverseText(root, f) {
        let treeWalker = document.createTreeWalker(
            root, NodeFilter.SHOW_TEXT, null, false);

        let node;
        while (node = treeWalker.nextNode()) {
            f(node);
        }
    }

    function around(match, width=42) {
        const size = width / 2 - match[0].length / 2;
        const {input, index} = match;

        let s = input.slice(Math.max(0, index - size), index)
        const n = s.padStart(size, '_').length - s.length;
        for (let i = 0; i < n; ++i) {
            s = '&nbsp;' + s;
        }
        return (
            s + `<span style="color:red">${match[0]}</span>` +
            input.slice(index + match[0].length, Math.min(input.length, index + size))
        );
    }

    async function updateSearchResults() {
        async function getResults() {
            if (!search.query) {
                return [];
            }

            const queryRegex = new RegExp(
                matchWords
                    ? `(?<=\\s|,|\\.|\\?|^)${search.query}(?=\\s|,|\\.|\\?|$)`
                    : search.query,
                'g' + (caseSensitivity ? 'i' : '')
            );

            return (await Promise.all(
                book.locations.spine.spineItems.map(async item => {
                    await item.load(book.load.bind(book));

                    let results = [];
                    traverseText(item.document, node => {
                        for (const match of node.textContent.matchAll(queryRegex)) {
                            let range = item.document.createRange();
                            range.setStart(node, match.index);
                            range.setEnd(node, match.index + search.query.length);
                            results.push({
                                'cfi': item.cfiFromRange(range),
                                'excerpt': around(match)
                            });
                        }
                    });
                    return results
                })
            )).flat();
        }

        search.results = await getResults();
    }

    let previousHighlight;
</script>

<form>
    <input
        bind:value={search.query}
        type="text" inputmode="search" autofocus
        on:keypress={async e => {
            if (e.which == 10 || e.which == 13) {
                await updateSearchResults();
                e.preventDefault();
            }
        }
    }>
    <div>
        <input
            type="checkbox"
            on:change={async () => await updateSearchResults()}
            bind:checked={caseSensitivity}
        />
        <label>case</label>
    </div>
    <div>
        <input
            type="checkbox"
            on:change={async () => await updateSearchResults()}
            bind:checked={matchWords}
        />
        <label>word</label>
    </div>
</form>

<ul>
    {#each search.results as {cfi, excerpt}}
        <li>
            <a
                href="#" draggable="false"
                on:click={e => {
                    rendition.display(cfi);
                    if (previousHighlight) {
                        rendition.annotations.remove(previousHighlight, 'highlight');
                    }
                    rendition.annotations.highlight(cfi);
                    previousHighlight = cfi;
                }}
            >
                {@html excerpt}
            </a>
        </li>
    {/each}
</ul>

<style>
    input[type="text"] {
        font-family: monospace;
        padding: .5rem .6rem;
        margin-right: .6rem;
        width: 100%;
    }

    input[type="checkbox"] {
        appearance: none;
        position: relative;
        display: inline-block;
        background: lightgrey;
        height: 1.65rem;
        width: 2.75rem;
        vertical-align: middle;
        border-radius: 2rem;
        box-shadow: 0px 1px 3px #0003 inset;
        transition: 0.25s linear background;
    }

    input[type="checkbox"]::before {
        content: "";
        display: block;
        width: 1.25rem;
        height: 1.25rem;
        background: #fff;
        border-radius: 1.2rem;
        position: absolute;
        top: 0.2rem;
        left: 0.2rem;
        box-shadow: 0px 1px 3px #0003;
        transition: 0.25s linear transform;
        transform: translateX(0rem);
    }

    input[type="checkbox"]:checked {
        background: green;
    }

    input[type="checkbox"]:checked::before {
        transform: translateX(1rem);
    }

    input[type="checkbox"]:focus {
        outline: none;
    }

    input:focus-visible {
        outline: 2px solid dodgerblue;
        outline-offset: 2px;
    }

    input:focus {
        outline-color: transparent;
    }

    form {
        padding-top: .8em;
        display: flex;
        align-items: center;
    }

    li {
        font-size: 80%;
        padding: .2em .6em;
        line-height: .9em;
        user-select: none;
    }

    li:hover {
        cursor: pointer;
        background-color: rgba(181, 186, 199, .3);
    }

    label {
        position: relative;
        top: -.6em;
        font-size: 80%;
        color: gray;
    }

	a {
		text-decoration: none;
        color: inherit;
		font-family: monospace;
	}

	ul {
		list-style-type: none;
		padding: 0;
	}
</style>