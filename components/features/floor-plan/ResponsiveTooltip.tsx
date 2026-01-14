"use client";

import { ReactNode, useState } from "react";
import { useMediaQuery } from "@/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type ResponsiveTooltipProps = {
  children: ReactNode;
  content: ReactNode;
  title?: string;
};

export const ResponsiveTooltip = ({
  children,
  content,
  title = "Мэдээлэл",
}: ResponsiveTooltipProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {children}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[90vw] max-w-sm p-0 rounded-xl">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            {content}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="p-0 w-64 z-50">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
