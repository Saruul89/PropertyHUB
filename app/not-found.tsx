import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-4xl font-bold">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Хуудас олдсонгүй</h2>
        <p className="mt-2 text-muted-foreground">
          Уучлаарай, таны хайсан хуудас олдсонгүй.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "gap-2")}
          >
            <Home className="h-4 w-4" />
            Нүүр хуудас
          </Link>
          <Link
            href="javascript:history.back()"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
