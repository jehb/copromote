import { render, screen } from "@testing-library/react"
import { UserAvatar } from "@/components/ui/user-avatar"
import * as gravatarModule from "@/lib/gravatar"

// Mock getGravatarUrl
jest.mock("@/lib/gravatar", () => ({
    getGravatarUrl: jest.fn(),
}))

// Mock AvatarImage so it doesn't try to use Radix primitives which hide the image until loaded
jest.mock("@/components/ui/avatar", () => {
    const originalModule = jest.requireActual("@/components/ui/avatar")
    return {
        ...originalModule,
        AvatarImage: ({ src, alt, ...props }: any) => (
            <img data-testid="mock-avatar-image" src={src} alt={alt} {...props} />
        )
    }
})

describe("UserAvatar", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders with avatarUrl if provided", () => {
        render(<UserAvatar avatarUrl="https://example.com/avatar.jpg" />)

        const avatarImage = screen.getByTestId("mock-avatar-image")
        expect(avatarImage).toHaveAttribute("src", "https://example.com/avatar.jpg")
    })

    it("renders with gravatar if email is provided but no avatarUrl", () => {
        (gravatarModule.getGravatarUrl as jest.Mock).mockReturnValue("https://example.com/gravatar.jpg")

        render(<UserAvatar email="test@example.com" />)

        const avatarImage = screen.getByTestId("mock-avatar-image")
        expect(avatarImage).toHaveAttribute("src", "https://example.com/gravatar.jpg")
        expect(gravatarModule.getGravatarUrl).toHaveBeenCalledWith("test@example.com", 200)
    })

    it("prioritizes avatarUrl over email gravatar", () => {
        (gravatarModule.getGravatarUrl as jest.Mock).mockReturnValue("https://example.com/gravatar.jpg")

        render(<UserAvatar email="test@example.com" avatarUrl="https://example.com/avatar.jpg" />)

        const avatarImage = screen.getByTestId("mock-avatar-image")
        expect(avatarImage).toHaveAttribute("src", "https://example.com/avatar.jpg")
    })

    it("renders correct initials when name is provided", () => {
        render(<UserAvatar name="John Doe" />)

        const fallback = screen.getByText("JD")
        expect(fallback).toBeInTheDocument()
    })

    it("renders fallback '??' when name is empty", () => {
        render(<UserAvatar />)

        const fallback = screen.getByText("??")
        expect(fallback).toBeInTheDocument()
    })

    it("renders initials up to 2 characters uppercase", () => {
        render(<UserAvatar name="alice bob charlie" />)

        const fallback = screen.getByText("AB")
        expect(fallback).toBeInTheDocument()
    })

    it("applies custom size to gravatar", () => {
        (gravatarModule.getGravatarUrl as jest.Mock).mockReturnValue("https://example.com/gravatar-100.jpg")

        render(<UserAvatar email="test@example.com" size={100} />)

        expect(gravatarModule.getGravatarUrl).toHaveBeenCalledWith("test@example.com", 100)
    })

    it("applies custom className", () => {
        const { container } = render(<UserAvatar className="custom-class" />)

        // The container's first child is the Avatar which gets the className
        expect(container.firstChild).toHaveClass("custom-class")
    })
})
