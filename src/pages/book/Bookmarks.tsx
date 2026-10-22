import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty } from '../../components/ui';
import { loadBook, loc, toc, type Book } from '../../lib/content';
import { getReading, toggleBookmark } from '../../lib/reading';

export default function Bookmarks() {
  const { t, lang } = useT();
  const r = useLiveQuery(() => getReading(), []);
  const [book, setBook] = useState<Book>();
  useEffect(() => { loadBook(lang).then(setBook); }, [lang]);
  const list = [...(r?.bookmarks ?? [])].sort((a, b) => b.at - a.at);
  return (
    <Page>
      <PageHeader title={t('bookmarks')} back="/book" />
      {!list.length ? <Empty kind="book" title={t('noBookmarks')} text={t('noBookmarksText')} /> : (
        <ul className="grid gap-2">
          {list.map((b) => {
            const text = book?.chapters.find((c) => c.id === b.chapter)?.blocks[b.blockIndex]?.text ?? '';
            return (
              <li key={b.chapter + b.blockIndex} className="card p-3 flex gap-2 items-start">
                <Link to={`/book/${b.chapter}?b=${b.blockIndex}`} className="flex-1 min-w-0">
                  <span className="text-sm font-extrabold text-accent">{loc(toc.toc.find((c) => c.id === b.chapter)?.title, lang)}</span>
                  <span className="block font-read line-clamp-3">{text}</span>
                </Link>
                <button className="icon-btn" aria-label={t('delete')} onClick={() => toggleBookmark(b.chapter, b.blockIndex)}><Trash2 size={20} /></button>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
