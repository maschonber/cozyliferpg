# Testing Principles

## Test What Matters

**High priority (must have tests):**

- Domain services (game logic, calculations)
- Application services (use case orchestration)
- Facades (frontend business logic)
- Stores (state management)

**Medium priority:**

- Repositories (data transformation)
- Integration tests (API endpoints)

**Lower priority:**

- Presentational components
- Utilities with trivial logic

## Test Design

**One assertion per behavior:**

- Test names describe the behavior
- Each test verifies one thing
- Failing test immediately identifies the problem

**Arrange-Act-Assert structure:**

```typescript
it('should calculate difficulty with relationship modifier', () => {
  // Arrange
  const relationship = { trust: 50, affection: 30, desire: 20 };

  // Act
  const result = calculateDifficulty(baseDifficulty, relationship);

  // Assert
  expect(result).toBe(expectedValue);
});
```

**Test behavior, not implementation:**

- Test public API, not private methods
- Mock dependencies at boundaries
- Refactoring should not break tests

## Test Isolation

**Unit tests are isolated:**

- No database, no HTTP, no filesystem
- Mock external dependencies
- Fast execution (milliseconds)

**Integration tests verify boundaries:**

- Test API endpoints end-to-end
- Use test database when needed
- Reset state between tests

## Test Maintenance

**Tests must pass before commit:**

- Run full test suite locally
- Fix failing tests immediately
- No skipped tests without documented reason

**Tests are first-class code:**

- Apply same quality standards
- Refactor tests when refactoring code
- Delete tests for deleted features

## Naming Convention

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // test
    });
  });
});
```
