# Documentation RAG System - Design Document

## 1. System Overview
A Retrieval-Augmented Generation (RAG) system for Agentuity's documentation, enabling users to search for relevant documentation pages, get direct answers, and discover code examples efficiently.

---

## 2. Document Chunking & Metadata

### 2.1 Chunking
- Documents (MDX files) are split into semantically meaningful chunks (steps, paragraphs, code blocks, etc.) using custom logic.
- Each chunk is enriched with metadata for effective retrieval and navigation.

### 2.2 Metadata Structure
```typescript
interface DocumentMetadata {
  id: string;            
  path: string;          
  chunkIndex: number;    
  contentType: string;
  heading?: string;    
  keywords?: string;  
}
```

#### Field Rationale & Use Cases
- **id**: Unique retrieval, deduplication, updates.
- **path**: Navigation, linking, analytics.
- **chunkIndex**: Context window, document flow.
- **contentType**: Result presentation, filtering.
- **keywords**: Hybrid search, filtering, boosting, related content, highlighting.

---

## 3. [Optional] Keyword Extraction
- **Purpose:** Boost search accuracy, enable hybrid search, support filtering, and improve UI.
- **Approach:**
  - Start with simple extraction (headings, code, links, bolded text).
  - For best results, use an LLM (e.g., GPT-4o) to extract 5-10 important keywords/phrases per chunk.
  - Store keywords as a separate field in the metadata.

---

## 4. Embedding Generation
- **Only the main content of each chunk is embedded** (not keywords or metadata).
- Use a dedicated embedding model (e.g., OpenAI's `text-embedding-3-small`).
- Store the resulting vector alongside the chunk's metadata and keywords.

---

## 5. Vector Store
- Use Agentuity built in Vector storage
- Store for each chunk:
  - Embedding vector
  - Main content
  - Metadata (id, path, chunkIndex, contentType, heading)
  - Keywords

---

## 6. Retrieval & Hybrid Search
- **User query flow:**
  1. Embed the user query.
  2. Search for similar vectors (semantic search).
  3. Check for keyword matches in the `keywords` field.
  4. Combine results (hybrid search), boosting those with both high semantic similarity and keyword matches.
  5. Use metadata for context and navigation in the UI.

- **Why not embed keywords/metadata?**
  - Embedding only the main content ensures high-quality semantic search.
  - Keywords/metadata are used for filtering, boosting, and UI, not for semantic similarity.

---

## 7. [Optional] Keyword Boosting and Highlighting

### 7.1 Keyword Boosting in Retrieval

**Definition:** Boosting means giving extra weight to chunks that contain keywords matching the user's query, so they appear higher in the search results—even if their semantic similarity score is not the highest.

**How It Works:**
- When a user submits a query:
  1. **Semantic Search:** Embed the query and retrieve the top-N most similar chunks from the vector store.
  2. **Keyword Match:** Check which of these chunks have keywords that match (exactly or fuzzily) terms in the user's query.
  3. **Score Adjustment:** Increase the score (or ranking) of chunks with keyword matches. Optionally, also include chunks that have strong keyword matches but were not in the top-N semantic results.
  4. **Hybrid Ranking:** Combine the semantic similarity score and the keyword match score to produce a final ranking.

**Technical Example:**
- For each chunk, compute:  
  `final_score = semantic_score + (keyword_match ? boost_value : 0)`
- Tune `boost_value` based on how much you want to favor keyword matches.

**Why?**
- Ensures that highly relevant technical results (e.g., containing exact function names, CLI commands, or jargon) are not missed by the embedding model.
- Improves recall for precise, technical queries.

---

### 7.2 Keyword Highlighting in the UI

**Definition:** Highlighting means visually emphasizing the keywords in the search results that match the user's query, making it easier for users to spot why a result is relevant.

**How It Works:**
- When displaying a result chunk:
  1. Compare the user's query terms to the chunk's keywords.
  2. In the displayed snippet, bold or color the matching keywords.
  3. Optionally, also highlight those keywords in the context of the chunk's content.

**User Experience Example:**
- User searches for: `install CLI on Linux`
- Result snippet:
  ```
  The **Agentuity CLI** is a cross-platform command-line tool for working with Agentuity Cloud. It supports **Windows** (using WSL), **MacOS**, and **Linux**.
  ```
- The keywords "Agentuity CLI" and "Linux" are highlighted, helping the user quickly see the match.

**Why?**
- Increases user trust in the search system by making relevance transparent.
- Helps users scan results faster, especially in technical documentation with dense information.

---

### 7.3 Summary Table

| Feature      | Purpose                                 | Technical Step                        | User Benefit                        |
|--------------|-----------------------------------------|---------------------------------------|-------------------------------------|
| Boosting     | Improve ranking of keyword matches      | Adjust score/rank in retrieval        | More relevant results at the top    |
| Highlighting | Make matches visible in the UI          | Bold/color keywords in result display | Easier, faster result comprehension |

---

### 7.4 Optional Enhancements
- Allow users to filter results by keyword/facet.
- Show a "Why this result?" tooltip listing matched keywords.

---

## 8. Reranker Integration

### 8.1 What is a Reranker?
A reranker is a model (often a cross-encoder or LLM) that takes a set of candidate results (retrieved by semantic/keyword/hybrid search) and scores them for relevance to the user's query, often with much higher accuracy than the initial retrieval.

### 8.2 Where Does It Fit?
- The reranker is applied **after** the hybrid retrieval (semantic + keyword boosting) step.
- It takes the top-N candidate chunks and the user query, and produces a new, more accurate ranking.
- The final answer generated based on the top n context after reranked.

### 8.3 Retrieval Pipeline with Reranker

1. **User Query**
2. **Hybrid Retrieval** (semantic + keyword search, with boosting)
3. **Top-N Candidates**
4. **Reranker Model** (scores each candidate for true relevance)
5. **Final Generated Answer** (displayed to user)

### 8.4 Example Models
- OpenAI GPT-4o or GPT-3.5-turbo (with a ranking prompt)
- Cohere Rerank API
- bge-reranker (open-source, HuggingFace)
- ColBERT, MonoT5, or other cross-encoders

### 8.5 Benefits
- **Higher Precision:** Deeply understands context and technical terms.
- **Better Handling of Ambiguity:** Picks the best answer among similar candidates.
- **Improved User Trust:** More relevant answers at the top.

### 8.6 Why Keep Keyword Search?
- Keyword search ensures exact matches for technical terms are not missed.
- Hybrid search provides the reranker with the best possible candidate set.
- Removing keyword search would reduce recall and technical accuracy.

### 8.7 Updated Retrieval Flow Diagram

```mermaid
graph TD
  A[User Query] --> B[Hybrid Retriever (Embeddings + Keywords)]
  B --> C[Top-N Candidates]
  C --> D[Reranker Model]
  D --> E[Final Answer]
```

---

## 9. UI Integration
- Add a search bar and results display to the documentation site.
- Show direct answers, code snippets, and links to full docs, with keyword highlighting and breadcrumb navigation.

---

## 10. Technology Stack
| Step                | Technology/Tool                | Notes                                              |
|---------------------|-------------------------------|----------------------------------------------------|
| Chunking            | TypeScript logic               | `chunk-mdx.ts`                                     |
| Keyword Extraction  | LLM (GPT-4o, GPT-3.5-turbo)   | API call per chunk; can batch for efficiency       |
| Embedding           | OpenAI Embedding API           | `text-embedding-3-small` or similar                |
| Vector Store        | pgvector, Pinecone, Weaviate   | Choose based on infra preference                   |
| Retrieval API       | Next.js API route              | Combines vector and keyword search                 |
| UI                  | Next.js/React                  | Search bar, results, highlighting, navigation      |

---

## 11. Example Metadata for a Chunk
```json
{
  "id": "introduction-getting-started-1",
  "path": "/introduction/getting-started",
  "chunkIndex": 1,
  "contentType": "step",
  "heading": "Install the CLI",
  "keywords": "Agentuity CLI, CLI installation, command-line tool, cross-platform, Windows, WSL, MacOS, Linux, curl, installation"
}
```

---

## 12. Summary
- Only main content is embedded; keywords and metadata are stored separately.
- Hybrid search (semantic + keyword) provides the best retrieval experience.
- Metadata supports navigation, filtering, and UI context.
- LLM-powered keyword extraction is recommended for technical accuracy. 