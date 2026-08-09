export const PAGE_SIZE = 20;

export default function Pagination({
  page = 1,
  pages = 1,
  total = 0,
  limit = PAGE_SIZE,
  onPageChange,
}) {
  const current = Number(page) || 1;
  const totalPages = Math.max(1, Number(pages) || 1);
  const totalItems = Number(total) || 0;
  const pageSize = Number(limit) || PAGE_SIZE;

  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const from = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <span className="muted text-sm">
        {totalItems === 0 ? '0 results' : `${from}–${to} of ${totalItems}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={current <= 1}
          onClick={() => onPageChange?.(current - 1)}
        >
          Prev
        </button>
        <span className="min-w-[4.5rem] text-center text-sm tabular-nums">
          {current} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={current >= totalPages}
          onClick={() => onPageChange?.(current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
