from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader
import re

def detect_content_type(text_chunk):
    """Detect what type of content this chunk contains"""
    
    # YAML frontmatter (highest priority)
    if re.match(r'^---\n.*?---', text_chunk.strip(), re.DOTALL):
        return 'frontmatter'
    
    # Code blocks (high priority - most specific)
    if re.search(r'```[\w]*\n.*?```', text_chunk, re.DOTALL):
        return 'code_block'
    
    # Headers with substantial content
    if re.match(r'^#{1,6}\s+', text_chunk.strip()) and len(text_chunk) > 100:
        return 'header_section'
    
    # Just headers (short)
    if re.match(r'^#{1,6}\s+', text_chunk.strip()):
        return 'header'
    
    # Tables (markdown tables)
    if re.search(r'\|.*\|.*\|', text_chunk) and text_chunk.count('|') >= 4:
        return 'table'
    
    # Lists (multiple list items)
    lines = text_chunk.split('\n')
    list_lines = [line for line in lines if re.match(r'^[-*+]\s+|^\d+\.\s+', line.strip())]
    if len(list_lines) >= 2:  # At least 2 list items
        return 'list'
    
    # Default to regular text
    return 'text'

def create_content_aware_splitter(content_type):
    """Create a splitter tailored to the content type"""
    
    if content_type == 'frontmatter':
        # Keep frontmatter intact
        return RecursiveCharacterTextSplitter(
            chunk_size=2000,  # Larger chunks for metadata
            chunk_overlap=0,   # No overlap needed
            separators=["\n---\n"]
        )
    
    elif content_type == 'code_block':
        # Smaller chunks for code, respect code structure
        return RecursiveCharacterTextSplitter(
            chunk_size=800,   # Smaller for focused code context
            chunk_overlap=100,
            separators=["\n```\n", "\n\n", "\n"]
        )
    
    elif content_type == 'header_section':
        # Medium chunks, keep headers with their content
        return RecursiveCharacterTextSplitter(
            chunk_size=1200,  # Slightly larger for header sections
            chunk_overlap=150,
            separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n"]
        )
    
    elif content_type == 'table':
        # Keep tables intact
        return RecursiveCharacterTextSplitter(
            chunk_size=1500,  # Larger to avoid breaking tables
            chunk_overlap=0,   # No overlap for tables
            separators=["\n\n"]
        )
    
    elif content_type == 'list':
        # Keep list items together
        return RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n- ", "\n* ", "\n+ "]
        )
    
    else:  # Default for 'text'
        # Standard chunking for regular text
        return RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " "]
        )

def hybrid_chunk_document(doc):
    """Apply hybrid chunking to a single document"""
    
    # First, do a rough split to identify content types
    initial_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,  # Larger initial chunks for analysis
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n\n", "\n"]
    )
    
    initial_chunks = initial_splitter.split_documents([doc])
    final_chunks = []
    
    for chunk in initial_chunks:
        # Detect content type
        content_type = detect_content_type(chunk.page_content)
        
        # Get appropriate splitter for this content type
        content_splitter = create_content_aware_splitter(content_type)
        
        # Re-split with content-aware strategy
        refined_chunks = content_splitter.split_documents([chunk])
        
        # Add content type to metadata
        for refined_chunk in refined_chunks:
            refined_chunk.metadata['content_type'] = content_type
        
        final_chunks.extend(refined_chunks)
    
    return final_chunks

def generate_docs_chunks(docs_path):
    loader = DirectoryLoader(docs_path, glob="**/*.mdx")  
    docs = loader.load()
    all_chunks = []
    for doc in docs:
        doc_chunks = hybrid_chunk_document(doc)
        all_chunks.extend(doc_chunks)
    return all_chunks
