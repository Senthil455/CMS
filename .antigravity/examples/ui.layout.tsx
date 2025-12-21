export function PageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="
        min-h-screen
        bg-yellow-50 text-gray-900
        dark:bg-gray-900 dark:text-gray-100
        px-4 py-6
        md:px-8
      "
        >
            {children}
        </div>
    )
}
