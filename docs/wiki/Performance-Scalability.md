# Performance & Scalability

CMS is designed with performance, scalability, and extensibility as core principles.

## Design Objectives

### 1. Performance
- P95 latency under 200ms for the slowest APIs
- Throughput over 1,000 QPS per application node
- Support for complex queries (5-table joins over 1M rows)
- Efficient handling of large tables (100M+ records for user activities)

### 2. Scalability
- Handle millions of posts and users
- Support billions of user activities (views, likes, shares)
- Horizontal scaling for high-volume features
- CDN-friendly architecture for content delivery

### 3. Extensibility & Reusability
- Distributed as a **NuGet package** for easy integration
- Hook system for custom business logic
- Message broker for event-driven architecture
- Modular design with isolated features

---

## Performance Benchmarks

CMS achieves performance comparable to specialized GraphQL engines while maintaining full CMS functionality.

### Test Environment
- PostgreSQL + App Server (4 CPU, 4GB RAM each)
- Tables: post (1M), post_tag (3M), tag (100K), post_cat (2M), category (10K)

### Query Performance Comparison

| Platform | List 20 Posts (P95) | Throughput | Filter by Tag (P95) | Throughput |
|----------|---------------------|------------|---------------------|------------|
| **CMS** | 48 ms | 2,400 QPS | 55 ms | 2,165 QPS |
| Hasura | 48 ms | 2,458 QPS | 53 ms | 2,056 QPS |
| Orchard Core | 2.3 s | 30 QPS | — | — |

### High-Volume Activity Data (100M rows)

| Operation | P95 Latency | Throughput |
|-----------|-------------|------------|
| Read operations | 187 ms | ~1,000 QPS |
| Buffered writes | **19 ms** | **~4,200 QPS** |

---

## Performance Optimization Strategies

### 1. Normalized Data Modeling

Most CMS platforms use key-value storage or JSON documents for flexibility, sacrificing performance. CMS takes a different approach:

```
Traditional CMS (Key-Value Storage):
+------------------+
| ContentItemId    |
| PropertyName     |  ← No indexes, slow joins
| PropertyValue    |
+------------------+

CMS (Normalized Tables):
+------------------+
| id               |  ← Primary key
| title            |  ← Indexed
| publishedAt      |  ← Indexed
| categoryId       |  ← Foreign key
+------------------+
```

**Benefits**:
- Leverages database indexes for fast queries
- Maintains referential integrity
- Enables efficient joins and complex queries
- Standard SQL tools work out of the box

### 2. Intelligent Caching Strategy

**Schema Caching**:
- Entity and query definitions cached in memory
- Hybrid cache (local + distributed) for multi-node setups
- 20-second local expiration for consistency
- Automatic invalidation on schema changes

**Data Caching**:
- Output caching for query results and pages
- CDN-friendly GET requests for GraphQL queries
- Configurable expiration policies per query type

### 3. Write Buffering for High Volume

For user activity data (likes, views, shares):
- In-memory buffer collects writes for 1 minute
- Batch flush reduces database round trips
- ~30GB buffer handles 5,000 QPS for 10 minutes
- **Result**: 19ms P95 latency at 4,200+ QPS

### 4. Query Optimization

- Single optimized SQL query per GraphQL request
- Eliminates N+1 query problem
- Efficient JOIN strategies for related entities
- Unique key lookups to reduce redundant queries

---

## Scalability Architecture

CMS separates cacheable CMS content from high-volume user data for independent scaling.

### CMS Content (Scale via Caching)

```
CDN Layer
    ↓
App Nodes (with local cache)
    ↓
Distributed Cache (Redis)
    ↓
Primary Database
```

**Characteristics**:
- GraphQL queries converted to cacheable GET requests
- Static content served from CDN
- 1M posts × 10KB average = ~10GB cache size
- Easily handles hundreds of millions of monthly visits

### User Activity Data (Scale via Sharding)

```
App Nodes
    ↓
Shard Router (MD5 hash by userId)
    ↓
+----------+  +----------+  +----------+
| Shard 1  |  | Shard 2  |  | Shard N  |
| ~100M    |  | ~100M    |  | ~100M    |
| records  |  | records  |  | records  |
+----------+  +----------+  +----------+
```

**Characteristics**:
- 1M users × 10K activities = 10B records
- Shard by userId for data locality
- ~100M records per shard (~200GB with indexes)
- Real-time updates (not cacheable)
- Linear scaling with additional shards

---

## Scaling by Project Size

### For Small Projects
- Start with single database, no sharding
- Leverage CDN for free global scaling
- Add features incrementally as needed
- Low operational complexity

### For Medium Projects (100K - 1M users)
- Add Redis for distributed caching
- Enable write buffering for activities
- Use read replicas for database scaling
- Still manageable with small DevOps team

### For Large Projects (1M+ users)
- Shard high-volume features across databases
- Multi-region CDN deployment
- Dedicated search infrastructure
- Scales to billions of records

---

## Real-World Applicability

CMS architecture supports diverse use cases:

- **News Portals**: Handle millions of articles with CDN caching (e.g., NYT scale)
- **Online Courses**: Manage complex hierarchies with efficient queries (e.g., Udemy scale)
- **Video Platforms**: Process HLS video, track billions of views
- **E-commerce**: Product catalogs with dynamic pricing and inventory
- **Social Platforms**: User-generated content with engagement tracking
