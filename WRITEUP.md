# Project Write-Up: Political Contribution Monitor

This document summarizes the key decisions, trade-offs, and future considerations for the Political Contribution Monitor application.

---

## 1. Decisions and Trade-offs

**Database vs. In-Memory Search:**
- The project began with SQLite FTS5 for search, but it was not well-suited for the required fuzzy/partial name matching. After much effort, I pivoted to an in-memory search approach using a JavaScript search library.
- **Trade-off:** This improved search quality and user experience but increased memory usage and startup time, as all data is now loaded into RAM at startup.

**Search Library Choice:**
- I initially tried FlexSearch.js for its speed, but it proved incompatible with Node.js in this context. I switched to Fuse.js, which is stable and well-documented.
- **Trade-off:** Fuse.js is slightly slower than FlexSearch in benchmarks, but its reliability and ease of use were more important for this project.

**Bulk Export Implementation:**
- To support CSV export after a bulk search, I used an in-memory cache (a Map) to store results by a unique search ID. This is simple and fast for a single-server setup.
- **Trade-off:** This approach is not robust for production, as the cache is lost on server restart and does not scale across multiple servers.

---

## 2. What I Would Do Differently with More Time

- **Testing:** I would add unit, integration, and end-to-end tests to ensure reliability and catch regressions.
- **UI/UX Polish:** I would improve loading states, error handling, and responsive design for a smoother user experience.
- **Configuration:** Move hardcoded values (like search thresholds and pagination limits) to environment variables or config files.
- **Performance:** Implement code-splitting and lazy loading in the frontend to improve initial load times.
- **Documentation:** Expand developer and API documentation for easier onboarding and maintenance.

---

## 3. Scaling for Production Use

- **Dedicated Search Engine:** For large datasets, I would migrate search to a dedicated engine like Elasticsearch or MeiliSearch. This would allow for scalable, distributed, and highly performant search across millions of records.
- **Asynchronous Data Ingestion:** Instead of loading all data at startup, I would build a pipeline to process and index new data files asynchronously, decoupling ingestion from the API server.
- **Distributed Caching:** Replace the in-memory export cache with a distributed cache like Redis, so export functionality works across multiple server instances.
- **Containerization & Orchestration:** Use Docker and Kubernetes for deployment, enabling horizontal scaling, rolling updates, and high availability.
- **CI/CD Pipeline:** Set up automated testing and deployment pipelines to ensure code quality and streamline releases.

---

This project demonstrates a pragmatic, user-focused approach to search and analytics on FEC data, with a clear path to production scalability. 