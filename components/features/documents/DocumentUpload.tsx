'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface DocumentUploadProps {
    leaseId?: string;
    propertyId?: string;
    unitId?: string;
    tenantId?: string;
    onUploadComplete: (doc: { id: string; file_name: string; file_url: string }) => void;
    onError: (error: string) => void;
    maxSizeBytes?: number;
}

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({
    leaseId,
    propertyId,
    unitId,
    tenantId,
    onUploadComplete,
    onError,
    maxSizeBytes = MAX_FILE_SIZE,
}: DocumentUploadProps) {
    const { companyId } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return 'Дэмжигдээгүй файлын төрөл. PDF, Word эсвэл зургийн файл сонгоно уу.';
        }
        if (file.size > maxSizeBytes) {
            return `Файлын хэмжээ ${maxSizeBytes / 1024 / 1024}MB-ээс бага байх ёстой.`;
        }
        return null;
    };

    const handleFileSelect = (file: File) => {
        const error = validateFile(file);
        if (error) {
            onError(error);
            return;
        }
        setSelectedFile(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !companyId) return;

        setUploading(true);
        try {
            const supabase = createClient();
            const timestamp = Date.now();
            const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `documents/${companyId}/${leaseId || 'general'}/${timestamp}-${safeName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(storagePath);

            // Create document record
            const { data: doc, error: insertError } = await supabase
                .from('documents')
                .insert({
                    company_id: companyId,
                    lease_id: leaseId || null,
                    property_id: propertyId || null,
                    unit_id: unitId || null,
                    tenant_id: tenantId || null,
                    file_name: selectedFile.name,
                    file_url: urlData.publicUrl,
                    file_type: selectedFile.name.split('.').pop()?.toLowerCase(),
                    file_size: selectedFile.size,
                    mime_type: selectedFile.type,
                    description: description || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            onUploadComplete(doc);
            setSelectedFile(null);
            setDescription('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Байршуулахад алдаа гарлаа';
            onError(message);
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return <Image className="h-8 w-8 text-blue-500" />;
        }
        if (file.type === 'application/pdf') {
            return <FileText className="h-8 w-8 text-red-500" />;
        }
        return <File className="h-8 w-8 text-gray-500" />;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {selectedFile ? (
                    <div className="flex items-center justify-center gap-4">
                        {getFileIcon(selectedFile)}
                        <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                            Файлаа чирж тавих эсвэл
                        </p>
                        <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Файл сонгох
                        </Button>
                        <p className="mt-2 text-xs text-gray-500">
                            PDF, Word, Зураг (Дээд хэмжээ {maxSizeBytes / 1024 / 1024}MB)
                        </p>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ALLOWED_MIME_TYPES.join(',')}
                    onChange={handleInputChange}
                />
            </div>

            {/* Description */}
            {selectedFile && (
                <div>
                    <Label htmlFor="description">Тайлбар (заавал биш)</Label>
                    <Input
                        id="description"
                        placeholder="Баримт бичгийн тайлбарыг оруулна уу"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            )}

            {/* Upload Button */}
            {selectedFile && (
                <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Байршуулж байна...' : 'Байршуулах'}
                </Button>
            )}
        </div>
    );
}
