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
          className={`p-4 cursor-pointer rounded-2xl relative overflow-hidden transition-all duration-300 active:scale-[0.99] group ${
            selectedId === content.id
              ? 'bg-sage-light border border-primary-color shadow-md'
              : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg'
          }`}
        >
          <div className="font-semibold text-lg text-sage-dark mb-1.5 leading-tight">
            {content.title}
          </div>
          <div className="text-sm text-gray-500 overflow-hidden line-clamp-2 leading-relaxed h-[40px]">
            {content.content}
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-sage-dark font-medium bg-sage-light/50 px-2 py-0.5 rounded tracking-wide">
              {content.entityName || 'Article'}
            </span>
            {content.updatedAt && (
              <span className="text-[0.65rem] text-gray-400 font-medium tracking-wide uppercase">
                {new Date(content.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
