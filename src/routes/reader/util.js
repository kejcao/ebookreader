import localForage from 'localforage';
import ePub from 'epubjs';

export async function getBooks() {
    return await localForage.getItem('ebook') ?? [];
}

function equals(f1, f2) {
    return f1.name == f2.name && f1.lastModified == f2.lastModified;
}

export async function readBook(file) {
    const books = await getBooks();

    // if this book is already in history, then just move it to the front
    for (let i = 0; i < books.length; ++i) {
        if (equals(file, books[i].file)) {
            let tmp = books[i]
            books[i] = books[books.length - 1];
            books[books.length - 1] = tmp;
            break;
        }
    }

    if (books.length == 0 || !equals(file, books.at(-1).file)) {
        const b = await ePub(file);
        const prefix = (await b.loaded.spine).items[0].href.match(/.*\//);

        // holy shit this is bad
        function f(section) {
            if (!section.href.toLowerCase().startsWith('text/')) {
                section.href = prefix + section.href;
            }
            section.subitems = section.subitems.map(f);
            return section;
        }

        books.push({
            'metadata': await b.loaded.metadata,
            'toc': (await b.loaded.navigation).toc.map(f),
            'file': file
        });
    }

    if (books.length > 8) { books.shift() }

    await localForage.setItem('ebook', books);
    location.assign('/reader');
}
