# Runnable starters

Each child directory is a self-contained application with its own dependencies, environment
template, Dockerfile, tests, and README. Copy the directory as-is into a new repository; no internal
folder renaming or source rearrangement is required.

| Directory | Runtime | OAuth client type |
| --- | --- | --- |
| [`react`](react/) | React + Vite | Public client with PKCE S256 |
| [`express`](express/) | Node.js + Express | Confidential client with PKCE S256 |
| [`django`](django/) | Python + Django | Confidential client with PKCE S256 |

The repository-root Compose workflow is for evaluating these applications together. After copying a
single starter, use its README and Dockerfile as the application-level source of truth.
