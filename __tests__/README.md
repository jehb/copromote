# Testing Guide

## Overview
This project uses **Jest** and **React Testing Library** for comprehensive testing coverage.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for utilities
│   ├── utils.test.ts
│   └── offline/
│       └── action-registry.test.ts
├── components/              # Component tests
│   ├── layout/
│   │   ├── sidebar.test.tsx
│   │   └── connection-status.test.tsx
│   └── social/
│       └── social-filter-bar.test.tsx
└── integration/             # Integration tests (future)
```

## Test Coverage

### Unit Tests
- ✅ `lib/utils.ts` - Class name merging utility
- ✅ `lib/offline/action-registry.ts` - FormData conversion

### Component Tests
- ✅ **Sidebar** - Mobile menu, navigation, responsive behavior
- ✅ **ConnectionStatus** - Online/offline states, sync status
- ✅ **SocialFilterBar** - Collapsible filters, filter updates

## Writing Tests

### Component Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Unit Test Example
```typescript
import { myFunction } from '@/lib/utils'

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction('input')).toBe('output')
  })
})
```

## Mocks

The following are automatically mocked in `jest.setup.ts`:
- `next/navigation` (useRouter, useSearchParams, usePathname)
- `IndexedDB` (for offline tests)
- `crypto.randomUUID` (for UUID generation)

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Component Tests**: All user-facing components
- **Integration Tests**: Critical user workflows

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test -- --ci --coverage
```

## Troubleshooting

### Tests failing with "Cannot find module"
- Ensure `@/` path alias is configured in `jest.config.ts`
- Check that the module exists and is exported

### Component tests timing out
- Use `screen.findBy*` for async elements
- Increase timeout with `jest.setTimeout(10000)`

### Mock not working
- Ensure mock is defined before import
- Use `jest.clearAllMocks()` in `beforeEach`
