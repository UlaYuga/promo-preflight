# Promo Preflight — Error Handling

## Exception hierarchy

```
PreflightException (abstract)
├── BadRequestException
│   ├── InvalidCampaignException       # Zod validation failure on input
│   └── UnprocessableEntityException   # Domain rule violation (valid shape, invalid state)
├── NotFoundException
│   ├── CampaignNotFoundException
│   └── RunNotFoundException
├── ConflictException
│   └── IdempotencyConflictException   # Same key, different body
├── ForbiddenException                 # Used when auth is added in a later sprint
└── SystemException
    └── NotReadyException              # DB unreachable or migrations not applied
```

Each exception carries an HTTP status code as a class constant. The global error handler in the API middleware maps `PreflightException` subclasses to HTTP responses automatically — see [docs/API.md — Error model](./API.md#error-model).

## How to throw

Use `domainRequire` for guard-style assertions inside domain and use-case code:

```ts
import { domainRequire } from '@domain/exception';

domainRequire(
  offer.wageringRequirement >= 1,
  () => new UnprocessableEntityException(
    'INVALID_WAGERING_REQUIREMENT',
    `wageringRequirement must be ≥ 1, got ${offer.wageringRequirement}`
  )
);
```

For explicit throws (e.g. in repository adapters when a row is missing):

```ts
throw new CampaignNotFoundException(campaignId);
```

## Rules

- Never throw raw `Error` or `TypeError` for business rule violations — always a `PreflightException` subclass.
- The **domain layer** throws only `PreflightException` subclasses and pure value errors (`domainRequire`).
- **Infrastructure adapters** may receive errors from external libraries (pg driver, Anthropic SDK, Telegram API). Wrap these at the adapter boundary into `SystemException` before re-throwing — never let external error types leak into the application layer.
- The **API layer** never catches `PreflightException` explicitly. The global middleware catches all `PreflightException` instances and serialises them to the standard error body shape.
- Zod parse errors from request validation are wrapped into `InvalidCampaignException` by the API route handler before reaching the bus.

## Adding a new exception

1. Create a class in `domain/exception/` that extends the appropriate parent:
   ```ts
   export class MyNewException extends BadRequestException {
     static readonly CODE = 'MY_NEW_ERROR';
     constructor(detail: string) {
       super(MyNewException.CODE, detail);
     }
   }
   ```
2. Export it from `domain/exception/index.ts`.
3. Add an entry to the error model table in [docs/API.md](./API.md#error-model) with the HTTP status and the condition that triggers it.
