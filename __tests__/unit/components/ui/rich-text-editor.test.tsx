import { render } from '@testing-library/react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

jest.mock('next/dynamic', () => () => {
  return function MockQuill(props: any) {
    return <textarea data-testid="quill" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
  }
})

describe('RichTextEditor', () => {
    it('renders without crashing', () => {
        const { getByTestId } = render(<RichTextEditor value="test" onChange={() => {}} />)
        expect(getByTestId('quill')).toBeInTheDocument()
    })
})
