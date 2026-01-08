import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fullPage?: boolean;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
};

export function Loading({
    text = 'Ачааллаж байна...',
    size = 'md',
    className,
    fullPage = false,
}: LoadingProps) {
    const content = (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
            {text && <span className="text-muted-foreground">{text}</span>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
}

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
    return (
        <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)} />
    );
}

export function LoadingOverlay({ text = 'Ачааллаж байна...' }: { text?: string }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loading text={text} size="lg" />
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="animate-pulse space-y-4 rounded-lg border p-6">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-8 w-full rounded bg-muted" />
        </div>
    );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="animate-pulse space-y-2">
            <div className="h-10 w-full rounded bg-muted" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-12 w-full rounded bg-muted/50" />
            ))}
        </div>
    );
}
