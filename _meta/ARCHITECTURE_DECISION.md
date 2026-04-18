---
name: Architecture Decision - Modular 6-Stage Pipeline
description: Design-to-Code pipeline chosen for framer-exporter Next.js intelligence layer
date: 2026-04-18
---

# Architecture Decision: Modular 6-Stage Pipeline

## Decision
**Chosen: Approach B (Modular Pipeline)** over monolithic or AST-first

## Why
- **Quality + Architectural Purity** as constraints
- Each stage testable independently
- Clear interfaces between stages
- Faster iteration in real life (initial setup slower, but debugging/changes faster)
- Matches industry standard (Builder.io, Locofy, Anima all use heuristic-based modular approaches)

## Pipeline Stages

```
HTMLParser → Normalizer → SectionDetector → ComponentExtractor → SemanticNamer → CodeGenerator
```

### Stage Responsibilities

1. **HTMLParser** - Parse Framer HTML → RawDOM tree
2. **Normalizer** - Clean junk, flatten nesting, deduplicate styles → CleanTree
3. **SectionDetector** - Identify section boundaries, label semantically → AnnotatedTree
4. **ComponentExtractor** - Find repeated patterns (2+ occurrences) → ComponentTree
5. **SemanticNamer** - Replace generic names with semantic ones → NamedTree
6. **CodeGenerator** - Convert to Next.js project + README_FOR_AI.md

## Key Constraints
- Output must be: dev-readable, TS conventions, LLM-editable, works immediately, renders correctly
- Keep current web app untouched
- Clone to new folder for intelligence layer
