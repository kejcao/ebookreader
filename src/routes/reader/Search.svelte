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

    async function process() {
        const query = document.querySelector('input')?.value;
        async function find() {
            if (!query) {
                return [];
            }
            let items = [];
            book.locations.spine.each(item => items.push(item));
            return [].concat(...await Promise.all(
                items.map(async item => {
                    await item.load(book.load.bind(book));

                    let results = [];
                    traverseText(item.document, node => {
                        const previewSize = 23;
                        for (const match of node.textContent.matchAll(new RegExp(matchWords ? `(?<=\\s|,|\\.|\\?|^)${query}(?=\\s|,|\\.|\\?|$)` : query, `g${caseSensitivity ? 'i' : ''}`))) {
                            let range = item.document.createRange();
                            range.setStart(node, match.index);
                            range.setEnd(node, match.index + query.length);
                            results.push({
                                'cfi': item.cfiFromRange(range),
                                'excerpt': around(match)
                            });
                        }
                    });
                    return results
                })
            ));
        }

        search = { 'query': query, 'results': await find() }
    }

    // $: caseSensitivity, matchWords, await process(search['query']);
</script>

<form>
    <input
        value={search['query']} type="text" autofocus
        on:keypress={async e => {
            if (e.which == 10 || e.which == 13) {
                await process();
                e.preventDefault();
            }
        }
    }>
    <div>
        <input type="checkbox" on:change={async () => await process()} bind:checked={caseSensitivity} />
        <label>case</label>
    </div>
    <div>
        <input type="checkbox" on:change={async () => await process()} bind:checked={matchWords} />
        <label>word</label>
    </div>
</form>

<ul>
    {#each search['results'] as {cfi, excerpt}}
        <li>
            <div>
                <a
                    href="#"
                    on:click|preventDefault={e => rendition.display(cfi)}
                >
                    {@html excerpt}
                </a>
            </div>
        </li>
    {/each}
</ul>

<style>
    input[type="text"] {
        padding: .6rem;
        font-family: monospace;
        margin-right: .6rem;
        width: 100%;
    }

    input[type="checkbox"] {
        width: 1.6rem;
        height: 1.6rem;
        margin-bottom: -1rem;
    }

    form {
        padding-top: .8em;
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

    form {
        display: flex;
        align-items: center;
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