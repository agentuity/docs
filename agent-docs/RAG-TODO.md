# RAG System Implementation TODOs

## 1. Document Chunking & Metadata
- [x] Refine and test the chunking logic for MDX files.
- [ ] Implement full metadata enrichment (id, path, chunkIndex, contentType, heading, breadcrumbs, keywords) in the chunking/processing pipeline.
- [x] Write unit tests for chunking and metadata extraction.

## 2. Keyword Extraction
- [x] Implement LLM-based keyword extraction for each chunk.
- [x] Write tests to validate keyword extraction quality.

## 3. Embedding Generation
- [x] Implement embedding function for batch processing of chunk texts (using OpenAI SDK or Agentuity vector store as appropriate).
- [ ] Integrate embedding generation into the chunk processing pipeline.
- [ ] Write tests to ensure embeddings are generated and stored correctly.

## 4. Vector Store Integration
- [ ] Set up Agentuity vector database integration.
- [ ] Store chunk content, metadata, keywords, and embeddings.
- [ ] Write integration tests for storage and retrieval.

## 5. Hybrid Retrieval Logic
- [ ] Implement hybrid search (semantic + keyword boosting).
- [ ] Write tests to ensure correct ranking and recall.

## 6. Reranker Integration
- [ ] Integrate reranker model (API or local).
- [ ] Implement reranking step after hybrid retrieval.
- [ ] Write tests to validate reranker improves result quality.

## 7. API Layer
- [ ] Build modular API endpoints for search and retrieval.
- [ ] Ensure endpoints are stateless and testable.
- [ ] Write API tests (unit and integration).

## 8. UI Integration
- [ ] Add search bar and results display to documentation site.
- [ ] Implement keyword highlighting and breadcrumb navigation.
- [ ] Write UI tests for search and result presentation.

## 9. Monitoring & Analytics
- [ ] Add logging for search queries and result quality.
- [ ] Implement feedback mechanism for users to rate results.

## 10. Documentation & Developer Experience
- [ ] Document each module and its tests.
- [ ] Provide clear setup and usage instructions.

---

## 11. Sync/Processor Workflow Design
- [ ] Design the documentation sync workflow:
    - [ ] Primary: Trigger sync via CI/CD or GitHub Action after merges to main/deploy branch.
    - [ ] Optional: Implement a webhook endpoint for manual or CMS-triggered syncs.
    - [ ] Ensure the sync process is idempotent and efficient (only updates changed docs/chunks).
    - [ ] Plan for operational workflow implementation after core modules are complete.

---

## 12. Docs Processor Implementation (Next Focus)
- [ ] Implement a docs processor that:
    - [ ] Loops over all docs in the /content directory
    - [ ] Chunks each doc
    - [ ] Enriches each chunk with id, path, chunkIndex, contentType, heading, breadcrumbs, and keywords
    - [ ] Prepares enriched chunks for embedding and storage 