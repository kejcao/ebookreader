<script>
	import { readBook, getBooks } from "./reader/util.js";

	let input;
</script>

<div class="dropZone">
    <div>
        <svg width="16em" height="16em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V22M12 16L14 18M12 16L10 18" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 13.3529C22 15.6958 20.5562 17.7055 18.5 18.5604M14.381 8.02721C14.9767 7.81911 15.6178 7.70588 16.2857 7.70588C16.9404 7.70588 17.5693 7.81468 18.1551 8.01498M7.11616 10.6089C6.8475 10.5567 6.56983 10.5294 6.28571 10.5294C3.91878 10.5294 2 12.4256 2 14.7647C2 16.6611 3.26124 18.2664 5 18.8061M7.11616 10.6089C6.88706 9.9978 6.7619 9.33687 6.7619 8.64706C6.7619 5.52827 9.32028 3 12.4762 3C15.4159 3 17.8371 5.19371 18.1551 8.01498M7.11616 10.6089C7.68059 10.7184 8.20528 10.9374 8.66667 11.2426M18.1551 8.01498C19.0446 8.31916 19.8345 8.83436 20.4633 9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <h1>DRAG EPUB FILES<br />
			OR <input
				bind:this={input} style="display:none" type="file"
				on:change={e => { readBook(e.target.files[0]); }}
			/>
            <a href="#" on:click|preventDefault={() => input.click()}>CLICK TO UPLOAD</a>
        </h1>
        <h3>try out <a href="#" on:click|preventDefault={() => readBook('/jane-austen_pride-and-prejudice.epub')}>Pride & Prejudice</a></h3>

		<hr>

		<ul class="history">
			{#await getBooks()}
				<li>loading...</li>
			{:then books}
				{#each [...books].reverse() as {file, metadata}}
					<li>
						<a href="#" on:click|preventDefault={() => readBook(file)}><i>{metadata.title}</i></a> by {metadata.creator}
					</li>
				{/each}
			{/await}
		</ul>
    </div>
</div>

<style>
	.dropZone h1,
	.dropZone h3 {
		opacity: .9;
	}

	.history {
		height: 14em;
		list-style-type: none;
		padding: 0;
	}

	.history li {
		padding: .2em 0;
	}

	.dropZone {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;

		opacity: .8;
	}

	:global(html) {
		height: 100%;
	}
</style>