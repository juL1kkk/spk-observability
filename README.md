# SPK Observability

Monorepo for:
- Next.js frontend
- NestJS backend
- shared contracts
- OpenAPI documentation

## Structure

apps/
  web/        - Next.js UI
  api/        - NestJS backend

packages/
  shared/     - shared types

docs/
  openapi/    - OpenAPI spec

## Data modes

mock mode:
NEXT_PUBLIC_DATA_MODE=mock

api mode:
NEXT_PUBLIC_DATA_MODE=api
