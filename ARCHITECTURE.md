# CozyLife RPG - Application Architecture

## Overview

This application follows a clean, layered architecture based on modern Angular best practices. The architecture emphasizes separation of concerns, testability, and maintainability.

## Core Principles

1. **Separation of State, Logic, and Presentation**: Clear boundaries between data management, business logic, and UI components
2. **Facade Pattern**: Services provide clean APIs and orchestrate complex operations
3. **Signal-based State Management**: Using @ngrx/signals for fine-grained reactivity
4. **Feature-based Organization**: Code organized by domain features rather than technical type
5. **Thin Components**: Components focus on presentation and delegate logic to facades

## Directory Structure

```
src/app/
├── core/                       # Singleton services, guards, interceptors
│   ├── guards/                 # Route guards
│   │   └── auth.guard.ts
│   ├── interceptors/           # HTTP interceptors
│   │   └── auth.interceptor.ts
│   └── models/                 # Shared domain models
│       └── api-response.model.ts
│
├── features/                   # Feature modules (by domain)
│   └── auth/
│       ├── components/         # Feature components
│       │   └── login/
│       ├── services/
│       │   ├── auth.facade.ts      # Business logic orchestration
│       │   └── auth.repository.ts  # HTTP communication
│       ├── store/
│       │   └── auth.store.ts       # @ngrx/signals store
│       └── models/
│           └── auth.model.ts       # Domain models
│
├── shared/                     # Reusable components, pipes, directives
│   ├── components/
│   ├── pipes/
│   └── directives/
│
└── utils/                      # Pure utility functions
```

## Architectural Layers

### 1. Store Layer (State Management)

**Purpose**: Manage application state using @ngrx/signals

**Responsibilities**:
- Define state structure
- Provide getters and setters for state
- Expose signals for reactive access
- Keep state immutable

**Example**: `auth.store.ts`
```typescript
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setAuthenticated(user: User, token: string): void {
      patchState(store, { user, token, isAuthenticated: true });
    }
  }))
);
```

**Testing**: Unit tests verify state transitions and computed signals

### 2. Repository Layer (API Communication)

**Purpose**: Handle HTTP communication and data transformation

**Responsibilities**:
- Make HTTP requests
- Transform DTOs to domain models
- Handle API errors
- No business logic

**Example**: `auth.repository.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class AuthRepository {
  login(credentials: LoginCredentials): Observable<{ token: string; user: User }> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, request).pipe(
      map(response => this.transformToDomain(response))
    );
  }
}
```

**Testing**: Unit tests with mocked HttpClient

### 3. Facade Layer (Business Logic)

**Purpose**: Orchestrate between store, repositories, and provide clean APIs

**Responsibilities**:
- Coordinate complex operations
- Implement business rules
- Handle workflows (e.g., login flow)
- Expose signals from store
- Manage side effects (navigation, storage)

**Example**: `auth.facade.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  // Expose signals
  isAuthenticated = this.store.isAuthenticated;
  user = this.store.user;

  login(credentials: LoginCredentials): Observable<void> {
    this.store.setLoading(true);
    return this.repository.login(credentials).pipe(
      tap(({ token, user }) => {
        this.storeCredentials(token, user);
        this.store.setAuthenticated(user, token);
        this.router.navigate(['/main']);
      })
    );
  }
}
```

**Testing**: Unit tests with mocked repository, store, and router (80-90% coverage goal)

### 4. Component Layer (Presentation)

**Purpose**: Display UI and handle user interactions

**Responsibilities**:
- Render templates
- Bind to facade signals
- Delegate actions to facades
- Minimal logic (only UI-specific)

**Types**:
- **Feature/Smart Components**: Inject facades, manage feature state
- **Presentational/Dumb Components**: Only @Input/@Output, no services

**Example**: `login.component.ts`
```typescript
@Component({ ... })
export class LoginComponent {
  private authFacade = inject(AuthFacade);

  loading = this.authFacade.loading;
  error = this.authFacade.error;

  onSubmit(): void {
    this.authFacade.login({ username, password }).subscribe();
  }
}
```

**Testing**: Component tests using @testing-library/angular

## Testing Strategy

### High Priority (80-90% coverage)
- ✅ Facade services - business logic
- ✅ Store services - state management
- ✅ Backend services - business rules
- ✅ Backend API routes - integration tests

### Medium Priority (60-70% coverage)
- ⚠️ Repositories - HTTP communication
- ⚠️ Smart components - user interactions
- ⚠️ Backend database queries

### Lower Priority
- 📝 Presentational components - smoke tests
- 📝 Pipes/utilities - complex ones only
- 📝 Guards/interceptors - basic tests

### Test Commands
```bash
npm test                  # Run all tests
npm run test:frontend     # Run Angular tests only
npm run test:backend      # Run Node.js tests only
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

## Technology Stack

### Frontend
- **Angular 20** - Framework
- **@ngrx/signals** - State management
- **RxJS** - Reactive programming
- **Jest** - Testing framework
- **@testing-library/angular** - Component testing

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Jest + Supertest** - Testing

## Best Practices

### DO
- ✅ Keep facades focused (one per feature domain)
- ✅ Use signals for all reactive state
- ✅ Write tests for business logic first
- ✅ Keep components thin
- ✅ Use dependency injection
- ✅ Follow single responsibility principle

### DON'T
- ❌ Put business logic in components
- ❌ Access stores directly from components (use facades)
- ❌ Mix API calls with business logic (use repositories)
- ❌ Create god services (keep them focused)
- ❌ Share mutable state between features

## Adding a New Feature

1. Create feature folder structure:
   ```
   features/new-feature/
   ├── components/
   ├── services/
   │   ├── new-feature.facade.ts
   │   └── new-feature.repository.ts
   ├── store/
   │   └── new-feature.store.ts
   └── models/
       └── new-feature.model.ts
   ```

2. Implement in order:
   - Models (domain objects)
   - Store (state management)
   - Repository (API communication)
   - Facade (business logic)
   - Components (presentation)

3. Write tests:
   - Store tests (state transitions)
   - Facade tests (business logic)
   - Component tests (user interactions)

4. Update routes and navigation

## Future Enhancements

- Add more feature modules (inventory, player, quests, etc.)
- Implement error handling strategy
- Add loading state management utilities
- Create shared UI component library
- Add E2E tests with Playwright
- Implement CI/CD pipeline
