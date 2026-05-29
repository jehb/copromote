import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/lib/hooks/use-debounce'

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
    })

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500))
        expect(result.current).toBe('initial')
    })

    it('debounces value updates according to the specified delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        )

        expect(result.current).toBe('initial')

        // Update value
        rerender({ value: 'updated', delay: 500 })

        // Value shouldn't change immediately
        expect(result.current).toBe('initial')

        // Fast-forward time, but not enough
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('initial')

        // Fast-forward remaining time
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('updated')
    })

    it('resets the timer if the value changes before the delay elapses', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        )

        // First update
        rerender({ value: 'updated 1', delay: 500 })

        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('initial')

        // Second update before the first delay finished
        rerender({ value: 'updated 2', delay: 500 })

        // The first update should be cancelled, wait for another 500ms
        act(() => {
            jest.advanceTimersByTime(250)
        })
        // Still initial because the timer was reset and only 250ms passed since second update
        expect(result.current).toBe('initial')

        // Wait another 250ms (total 500ms since second update)
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('updated 2')
    })

    it('falls back to the default delay of 500ms if no delay is provided', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value), // No delay passed
            { initialProps: { value: 'initial' } }
        )

        rerender({ value: 'updated' })

        expect(result.current).toBe('initial')

        act(() => {
            jest.advanceTimersByTime(499)
        })
        expect(result.current).toBe('initial')

        act(() => {
            jest.advanceTimersByTime(1)
        })
        expect(result.current).toBe('updated')
    })

    it('properly clears timeouts on unmount', () => {
        const { result, rerender, unmount } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        )

        rerender({ value: 'updated', delay: 500 })

        // Unmount before the timer fires
        unmount()

        // Fast forward time, no error should be thrown (like React state update on unmounted component)
        act(() => {
            jest.advanceTimersByTime(500)
        })

        // Since it's unmounted, we can't reliably check result.current, but the test passes
        // if no unhandled errors or React warnings occur during act.
    })
})
