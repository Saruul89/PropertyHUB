"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocumentDownloadUrl } from "@/hooks/queries";
import type { Document } from "@/types";
import { Download, X, FileText, Image, File } from "lucide-react";

export interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  return File;
};

const isImageFile = (mimeType?: string) => {
  return mimeType?.startsWith("image/");
};

const isPdfFile = (mimeType?: string) => {
  return mimeType === "application/pdf";
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentViewer({
  document,
  isOpen,
  onClose,
}: DocumentViewerProps) {
  const { data: downloadUrl, isLoading: loading } = useDocumentDownloadUrl(
    document?.id ?? null,
    isOpen && !!document
  );

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  if (!document) return null;

  const FileIcon = getFileIcon(document.mime_type);
  const isImage = isImageFile(document.mime_type);
  const isPdf = isPdfFile(document.mime_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            {document.file_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-gray-500">Ачааллаж байна...</div>
            </div>
          ) : downloadUrl ? (
            <>
              {isImage && (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={downloadUrl}
                    alt={document.file_name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
              )}

              {isPdf && (
                <div className="h-[60vh] w-full">
                  <iframe
                    src={downloadUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title={document.file_name}
                  />
                </div>
              )}

              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">
                    Энэ файлын төрлийг урьдчилан харах боломжгүй
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    {document.file_type ||
                      document.mime_type ||
                      "Тодорхойгүй файлын төрөл"}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Файлыг уншиж чадсангүй</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {document.description && (
              <p className="mb-1">{document.description}</p>
            )}
            {document.file_size && (
              <p>Хэмжээ: {formatFileSize(document.file_size)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Хаах
            </Button>
            <Button onClick={handleDownload} disabled={!downloadUrl}>
              <Download className="mr-2 h-4 w-4" />
              Татах
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
