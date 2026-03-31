interface FooterProps {
    isFullWidth?: boolean;
}

export default function Footer({ isFullWidth = false }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t bg-background/80">
            <div
                className={
                    isFullWidth
                        ? "flex items-center justify-between px-4 py-3 text-xs text-muted-foreground md:px-6"
                        : "mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 text-xs text-muted-foreground md:px-6"
                }
            >
                <span>Frappify Workspace</span>
                <span>© {year}</span>
            </div>
        </footer>
    );
}