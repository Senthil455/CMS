# Performance & Scalability

CMS is designed for speed and scale, rivaling specialized GraphQL engines while providing full CMS functionality.

## Key Performance Metrics

| Metric | Performance |
|--------|-------------|
| **P95 Latency** | < 200ms (slowest APIs) |
| **Throughput** | 2,400+ QPS per node |
| **Complex Queries** | 5-table joins over 1M rows |
| **Activity Data** | 100M+ records supported |

---

## How We Achieve This

### Normalized Data (Not Key-Value)
Unlike traditional CMS platforms that use flexible but slow key-value storage, CMS uses normalized database tables with proper indexes. This enables fast queries and efficient JOINs.

### Smart Caching
- Schema definitions cached in memory
- Query results cached at CDN edge
- Hybrid cache (local + Redis) for multi-node setups

### Write Buffering
High-volume user activities (likes, views, shares) are buffered in memory and batch-flushed every minute—achieving 19ms P95 at 4,200 QPS.

---

## Scaling Strategy

| Project Size | Approach |
|--------------|----------|
| **Small** | Single DB + CDN caching |
| **Medium** (100K-1M users) | Add Redis + read replicas |
| **Large** (1M+ users) | Database sharding + multi-region CDN |

### Content vs Activity Data
- **CMS Content**: Scales via caching (CDN → App Cache → Redis → DB)
- **User Activity**: Scales via sharding (userId hash → distributed shards)

---

## Real-World Scale

CMS architecture supports:
- **News Portals**: Millions of articles with CDN caching
- **Online Courses**: Complex hierarchies with efficient queries
- **Video Platforms**: HLS video + billions of view tracking
- **Social Platforms**: User-generated content with engagement features
