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

    function around(match) {
        const previewSize = 20;
        const {input, index} = match;

        return (
            input.slice(Math.max(0, index - previewSize), index) + 
            `<span style="color:red">${match[0]}</span>` +
            input.slice(index + match[0].length, Math.min(input.length, index + previewSize))
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
            <a href="#" on:drag|preventDefault on:click|preventDefault={e => rendition.display(cfi)}>
                {@html excerpt }
            </a>
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

    div {
        text-align: center;
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

	ul {
		list-style-type: none;
		padding: 0;
	}
</style>