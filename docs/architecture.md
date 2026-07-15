# Architecture

Flutter / React PWA → api/urls.py (versioned: /api/v1/) → apps/<name>/views.py
(thin) → services/<domain>/*.py (business logic) → apps/<name>/selectors.py
(reads) + models.py (persistence) → PostgreSQL

`integrations/` wraps third-party APIs behind a small client class, so
services never call an external SDK directly.