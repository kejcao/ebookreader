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
        books.push({
            'metadata': await b.loaded.metadata,
            'toc': (await b.loaded.navigation).toc,
            'file': file
        });
    }

    if (books.length > 8) { books.shift() }

    await localForage.setItem('ebook', books);
    location.assign('/reader');
}
