# RAG System Implementation TODOs

## 1. Document Chunking & Metadata
- [x] Refine and test the chunking logic for MDX files.
- [x] Implement full metadata enrichment (id, path, chunkIndex, contentType, heading, keywords) in the chunking/processing pipeline.
- [x] Write unit tests for chunking and metadata extraction.

## 2. Keyword Extraction
- [x] Implement LLM-based keyword extraction for each chunk.
- [x] Write tests to validate keyword extraction quality.
- [ ] Integrate keyword in document processing pipeline

## 3. Embedding Generation
- [x] Implement embedding function for batch processing of chunk texts (using OpenAI SDK or Agentuity vector store as appropriate).
- [x] Integrate embedding generation into the chunk processing pipeline.
- [ ] Write tests to ensure embeddings are generated and stored correctly.

## 4. Vector Store Integration
- [x] Set up Agentuity vector database integration.
- [x] Store chunk content, metadata, keywords, and embeddings.

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

## 11. Sync/Processor Workflow Design
- [x] Design the documentation sync workflow:
    - [x] Primary: Trigger sync via CI/CD or GitHub Action after merges to main/deploy branch.
    - [x] Optional: Implement a webhook endpoint for manual or CMS-triggered syncs.
    - [x] Ensure the sync process is idempotent and efficient (only updates changed docs/chunks).
    - [x] Plan for operational workflow implementation after core modules are complete.
