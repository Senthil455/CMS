# Building a System with CMS

This guide outlines the end-to-end workflow for building features in CMS. The philosophy is data-driven: you start with the data structure and build upwards to the user interface.

## Core Workflow

The standard development lifecycle follows this path:

`Entity` -> `Seed Data` -> `Query` -> `Page`

### 1. Entity Definition
Everything starts with the **Scheme** (Entity). This defines the shape of your data in the database.
- Defined in the Backend/Database layer.
- Example: Defining a `Product`, `Course`, or `Article` entity with fields like `title`, `price`, `author`.

#### Relationships
Defining how entities connect is essential for a rich data model.
- **Lookup**: One-to-Many relationship (e.g., A `Product` belongs to a `Category`).
- **Junction**: Many-to-Many relationship (e.g., A `Student` takes many `Courses`).
- **Collection**: One-to-Many relationship (e.g., An `Order` has multiple `OrderItems`).

### 2. Seed Data
**Crucial Step**: Before building the UI, you must have data.
- The **Page Builder** relies on existing data to infer schemas and provide live previews.
- Without seed data, it is difficult to visualize layout components or test queries.
- **Action**: Populate your local database with mock data or initial entries immediately after defining your entities.

### 3. Query Generation
Detailed data fetching is handled via **GraphQL**.
- Once entities and data exist, you generate queries to fetch exactly what the UI needs.
- **Leverage Relationships**: You can nest queries to fetch related data in a single request.
- Use the **AI Query Generator** or write GraphQL manually.

**Example**: Fetch a course with its instructor and enrolled students:
```graphql
query {
  course(id: 123) {
    title
    description
    instructor {       # Lookup relationship
      name
      avatar
    }
    students {         # Junction relationship
      name
      enrolledAt
    }
  }
}
```

### 4. Page Construction
Finally, you build the visual interface using the **Page Builder** (Orchestrator).
- **Binding**: Connect your GraphQL queries to UI components.
- **Layout**: Arrange components on the canvas.
- **SSR & SEO**: Pages are **Server-Side Rendered** by default, ensuring optimal performance and search engine visibility.
- **Tech Stack**: Uses **Handlebars** (templating) and **Alpine.js** (interactivity). *See [Page Templates & Interactivity](./Page-Templates-Interactivity.md) for details.*

#### Component Library
CMS provides a rich set of pre-built components to accelerate development:

**Core Components**
- **Lists & Tables**: These are standard UI patterns. The AI can easily generate these views for displaying collections of entities.

**Advanced & Engagement Components**
- **Engagement Bar**: Tools for user interaction (likes, shares, comments).
- **User Avatar**: Standardized user profile display.
- **Toplist**: specialized list for ranking items (e.g., "Trending Posts", "Top Users").
- **Tracking**: Built-in analytics and event tracking integrations.
