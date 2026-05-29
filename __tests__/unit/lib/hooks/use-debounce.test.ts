import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/lib/hooks/use-debounce'

describe('useDebounce', () => {
    beforeAll(() => {
        jest.useFakeTimers()
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500))
        expect(result.current).toBe('initial')
    })

    it('debounces value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        )

        // Change value
        rerender({ value: 'changed', delay: 500 })

        // Value should not be updated immediately
        expect(result.current).toBe('initial')

        // Fast-forward half the delay
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('initial')

        // Fast-forward the rest of the delay
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('changed')
    })

    it('cancels the previous timeout if value changes before delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        )

        rerender({ value: 'first change', delay: 500 })

        act(() => {
            jest.advanceTimersByTime(300)
        })
        
        rerender({ value: 'second change', delay: 500 })
        
        act(() => {
            jest.advanceTimersByTime(300)
        })
        // The first change should have been cancelled, so it's still initial
        expect(result.current).toBe('initial')
        
        act(() => {
            jest.advanceTimersByTime(200)
        })
        // Now the second change's timer is done
        expect(result.current).toBe('second change')
    })

    it('uses 500ms as default delay if none provided', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value),
            { initialProps: { value: 'initial' } }
        )

        rerender({ value: 'changed' })
        expect(result.current).toBe('initial')

        act(() => {
            jest.advanceTimersByTime(499)
        })
        expect(result.current).toBe('initial')

        act(() => {
            jest.advanceTimersByTime(1)
        })
        expect(result.current).toBe('changed')
    })
})
