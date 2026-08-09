import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({
  initial = '',
  large = false,
  autofocus = false,
  placeholder = 'Search for a brand, e.g. Nike, Apple, Zara...',
}) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form
      className={`dn-search w-full ${large ? 'dn-search--hero' : 'max-w-xl'}`}
      onSubmit={submit}
      role="search"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${large ? 'text-teal' : 'text-ink-muted'}`}
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        className="dn-search__input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autofocus}
      />
      <button className="btn btn-primary shrink-0 py-1.5 text-sm" type="submit">
        Compare
      </button>
    </form>
  );
}
