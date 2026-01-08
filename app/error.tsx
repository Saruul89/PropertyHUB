"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-2xl font-bold">Алдаа гарлаа</h1>
        <p className="mt-2 text-muted-foreground">
          Уучлаарай, ямар нэг алдаа гарлаа. Дахин оролдоно уу.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-4 max-w-full overflow-auto rounded bg-muted p-4 text-left text-sm">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Дахин оролдох
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <Home className="h-4 w-4" />
            Нүүр хуудас
          </Link>
        </div>
      </div>
    </div>
  );
}
