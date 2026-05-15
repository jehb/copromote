import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial'))
        expect(result.current).toBe('initial')
    })

    it('should update the value after the default delay (500ms)', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
            initialProps: { value: 'initial' }
        })

        // Rerender with a new value
        rerender({ value: 'updated' })

        // Value shouldn't change immediately
        expect(result.current).toBe('initial')

        // Fast-forward time by 499ms
        act(() => {
            jest.advanceTimersByTime(499)
        })
        expect(result.current).toBe('initial')

        // Fast-forward time by 1ms (total 500ms)
        act(() => {
            jest.advanceTimersByTime(1)
        })
        expect(result.current).toBe('updated')
    })

    it('should update the value after a custom delay', () => {
        const customDelay = 1000
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: customDelay }
        })

        // Rerender with a new value
        rerender({ value: 'updated', delay: customDelay })

        // Value shouldn't change immediately
        expect(result.current).toBe('initial')

        // Fast-forward time by 999ms
        act(() => {
            jest.advanceTimersByTime(999)
        })
        expect(result.current).toBe('initial')

        // Fast-forward time by 1ms (total 1000ms)
        act(() => {
            jest.advanceTimersByTime(1)
        })
        expect(result.current).toBe('updated')
    })

    it('should cancel previous timer when value changes rapidly', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
            initialProps: { value: 'initial' }
        })

        // First update
        rerender({ value: 'update1' })
        act(() => {
            jest.advanceTimersByTime(250) // wait half the default delay
        })
        expect(result.current).toBe('initial')

        // Second rapid update, should reset the timer
        rerender({ value: 'update2' })
        act(() => {
            jest.advanceTimersByTime(250) // this would be 500ms since first update
        })
        // Still initial because the second update reset the timer
        expect(result.current).toBe('initial')

        // Wait another 250ms (total 500ms since second update)
        act(() => {
            jest.advanceTimersByTime(250)
        })
        expect(result.current).toBe('update2')
    })

    it('should clean up timeout on unmount', () => {
        const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout')

        const { unmount, rerender } = renderHook(({ value }) => useDebounce(value), {
            initialProps: { value: 'initial' }
        })

        rerender({ value: 'updated' })

        // The first timeout is created on mount, second on update
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

        unmount()

        // Another clearTimeout should be called on unmount
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)

        clearTimeoutSpy.mockRestore()
    })
})
