import React, { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search content...',
  className = '',
}) => {
  const [query, setQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div
      className={className}
      style={{
        padding: '12px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        margin: '8px 0',
      }}
    >
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid var(--sage-light)',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          background: 'rgba(255, 255, 255, 0.4)',
          outline: 'none',
          color: 'var(--text-main)',
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--sage-light)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--sage-dark)',
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}
