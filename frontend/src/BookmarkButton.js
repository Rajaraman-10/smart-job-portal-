import { useMemo, useState } from 'react';
import { addBookmark, removeBookmark } from './services/api';

function BookmarkButton({ job, bookmarks = [], onChange }) {
  const [isSaving, setIsSaving] = useState(false);

  const bookmark = useMemo(() => bookmarks.find((item) => Number(item.job) === Number(job?.id)), [bookmarks, job?.id]);
  const isSaved = Boolean(bookmark);

  const handleToggle = async () => {
    if (!job?.id || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await removeBookmark(bookmark.id);
        onChange((prev) => prev.filter((item) => item.id !== bookmark.id));
      } else {
        const created = await addBookmark(job.id);
        onChange((prev) => [created, ...prev]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      className={`bookmark-btn ${isSaved ? 'is-saved' : ''}`}
      onClick={handleToggle}
      disabled={isSaving}
      aria-label={isSaved ? 'Remove bookmark' : 'Save job'}
    >
      {isSaved ? '★' : '☆'}
    </button>
  );
}

export default BookmarkButton;
