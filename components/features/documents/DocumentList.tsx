"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Document } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Image,
  File,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface DocumentListProps {
  documents: Document[];
  onDelete: (docId: string) => Promise<void>;
  loading?: boolean;
}

export function DocumentList({
  documents,
  onDelete,
  loading = false,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileIcon = (doc: Document) => {
    const type = doc.mime_type || "";
    if (type.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (type.includes("word") || type.includes("document")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ja-JP");
  };

  const handleDownload = async (doc: Document) => {
    const supabase = createClient();

    // Extract path from URL
    const url = new URL(doc.file_url);
    const pathMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/documents\/(.+)/
    );
    if (!pathMatch) {
      window.open(doc.file_url, "_blank");
      return;
    }

    const path = decodeURIComponent(pathMatch[1]);

    // Get signed URL for download
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60); // 60 seconds

    if (error || !data) {
      window.open(doc.file_url, "_blank");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("この書類を削除しますか？")) return;

    setDeletingId(docId);
    try {
      await onDelete(docId);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">Ачааллаж байна...</div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <File className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2">書類がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {getFileIcon(doc)}
            <div>
              <p className="font-medium text-sm">{doc.file_name}</p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>{formatDate(doc.created_at)}</span>
              </div>
              {doc.description && (
                <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(doc)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(doc.file_url, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(doc.id)}
              disabled={deletingId === doc.id}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
