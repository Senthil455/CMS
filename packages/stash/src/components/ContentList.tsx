import React, { useEffect, useState } from 'react'
import { Content } from '@/types'
import { getAllContent, searchContent } from '@/utils/storage'

interface ContentListProps {
  onSelectContent: (content: Content) => void
  searchQuery?: string
  selectedId?: string
  typeFilter?: 'video' | 'mp3' | 'article'
}

export const ContentList: React.FC<ContentListProps> = ({
  onSelectContent,
  searchQuery = '',
  selectedId = '',
  typeFilter,
}) => {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContents = async () => {
      setLoading(true)
      try {
        let items: Content[] = []
        if (searchQuery) {
          items = await searchContent(searchQuery)
        } else {
          items = await getAllContent()
        }

        if (typeFilter) {
          items = items.filter(item => item.type === typeFilter)
        }

        setContents(items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')))
      } catch (error) {
        console.error('Failed to load contents:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContents()
  }, [searchQuery])

  if (loading) {
    return <div style={{ padding: '16px', textAlign: 'center' }}>Loading content...</div>
  }

  if (contents.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
        {searchQuery ? 'No results found' : 'No content available'}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '8px 0',
      }}
    >
      {contents.map((content) => (
        <div
          key={content.id}
          onClick={() => onSelectContent(content)}
          style={{
            padding: '16px',
            cursor: 'pointer',
            background: selectedId === content.id ? 'var(--sage-light)' : 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: selectedId === content.id 
              ? '1px solid var(--primary-color)' 
              : '1px solid var(--glass-border)',
            boxShadow: selectedId === content.id ? 'var(--card-shadow)' : 'none',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ 
            fontWeight: 700, 
            fontSize: '1rem', 
            marginBottom: '6px',
            color: 'var(--sage-dark)'
          }}>
            {content.title}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>
            {content.content}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '12px',
          }}>
            <span style={{ 
              fontSize: '0.7rem', 
              color: 'var(--primary-color)',
              fontWeight: 600,
              background: 'rgba(109, 166, 122, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              {content.entityName || 'Article'}
            </span>
            {content.updatedAt && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {new Date(content.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
