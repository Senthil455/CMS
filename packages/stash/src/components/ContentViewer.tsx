import React, { useEffect, useState } from 'react'
import { Content } from '@/types'

interface ContentViewerProps {
  content: Content | null
  isOnline: boolean
}

export const ContentViewer: React.FC<ContentViewerProps> = ({ content, isOnline }) => {
  const [displayContent, setDisplayContent] = useState<Content | null>(null)

  useEffect(() => {
    setDisplayContent(content)
  }, [content])

  if (!displayContent) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '16px',
        }}
      >
        Select content to view
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--card-shadow)',
        margin: '16px 0',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '24px',
          }}
        >
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '1.75rem', 
              fontWeight: 800,
              color: 'var(--sage-dark)',
              lineHeight: 1.2
            }}>
              {displayContent.title}
            </h1>
            {displayContent.slug && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                /{displayContent.slug}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {displayContent.status === 'published' && (
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(109, 166, 122, 0.15)',
                  color: 'var(--sage-dark)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Published
              </span>
            )}
            {!isOnline && (
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(139, 170, 181, 0.15)',
                  color: 'var(--secondary-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Offline
              </span>
            )}
          </div>
        </div>

        <div style={{ 
          color: 'var(--text-main)',
          lineHeight: '1.8',
          fontSize: '1rem',
          letterSpacing: '0.01em',
        }}>
          {displayContent.html ? (
            <div
              dangerouslySetInnerHTML={{ __html: displayContent.html }}
              style={{
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {displayContent.content}
            </div>
          )}
        </div>

        {(displayContent.createdAt || displayContent.updatedAt) && (
          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: 'rgba(106, 135, 115, 0.05)',
              borderRadius: '16px',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              border: '1px solid rgba(106, 135, 115, 0.1)',
            }}
          >
            {displayContent.createdAt && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Created</span> {new Date(displayContent.createdAt).toLocaleString()}
              </div>
            )}
            {displayContent.updatedAt && (
              <div>
                <span style={{ fontWeight: 600 }}>Updated</span> {new Date(displayContent.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {displayContent.metadata && Object.keys(displayContent.metadata).length > 0 && (
          <div
            style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '20px',
              border: '1px solid var(--sage-light)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '0.85rem', 
              fontWeight: 800,
              color: 'var(--sage-dark)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Properties
            </h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {Object.entries(displayContent.metadata).map(([key, value]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>{key}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>{JSON.stringify(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
