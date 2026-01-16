'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateBonumQr, generateTransactionId, type BonumQrData } from '@/hooks/queries';
import { X, Loader2, RefreshCw, QrCode, AlertCircle } from 'lucide-react';

type PaymentQrDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  billingId: string;
  amount: number;
  billingMonth: string;
};

export function PaymentQrDialog({ isOpen, onClose, billingId, amount, billingMonth }: PaymentQrDialogProps) {
  const [qrData, setQrData] = useState<BonumQrData | null>(null);
  const createQr = useCreateBonumQr();

  const generateQr = async () => {
    setQrData(null);
    const transactionId = generateTransactionId(billingId);

    createQr.mutate(
      {
        amount,
        transactionId,
        expiresIn: 600, // 10 minutes
        items: [
          {
            title: `${new Date(billingMonth).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' })} нэхэмжлэх`,
            amount,
            count: 1,
          },
        ],
      },
      {
        onSuccess: (data) => {
          setQrData(data);
        },
      }
    );
  };

  useEffect(() => {
    if (isOpen && !qrData && !createQr.isPending) {
      generateQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      createQr.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <Card
        className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <QrCode className="h-5 w-5 text-blue-600" />
            Банкны апп-аар төлөх
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 rounded-full p-0 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="max-h-[calc(90vh-80px)] space-y-4 overflow-y-auto p-4">
          {/* Amount Display */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center">
            <p className="text-sm text-blue-600">Төлөх дүн</p>
            <p className="text-2xl font-bold text-blue-700">₮{amount.toLocaleString()}</p>
          </div>

          {/* Loading State */}
          {createQr.isPending && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-4 text-sm text-slate-500">QR код үүсгэж байна...</p>
            </div>
          )}

          {/* Error State */}
          {createQr.isError && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-center text-sm text-red-600">
                {createQr.error?.message || 'QR код үүсгэхэд алдаа гарлаа'}
              </p>
              <Button variant="outline" className="mt-4" onClick={generateQr}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Дахин оролдох
              </Button>
            </div>
          )}

          {/* QR Code Display */}
          {qrData && (
            <>
              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="rounded-2xl border-4 border-white bg-white p-2 shadow-lg">
                  <img
                    src={`data:image/png;base64,${qrData.qrImage}`}
                    alt="Payment QR Code"
                    width={200}
                    height={200}
                    className="h-[200px] w-[200px]"
                  />
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">QR кодыг банкны апп-аар уншуулна уу</p>

              {/* Bank Apps */}
              {qrData.links && qrData.links.length > 0 && (
                <div>
                  <p className="mb-3 text-center text-sm font-medium text-slate-700">Эсвэл банкны апп сонгох</p>
                  <div className="grid grid-cols-4 gap-3">
                    {qrData.links.map((link) => (
                      <a
                        key={link.name}
                        href={link.link}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-slate-100"
                      >
                        <img
                          src={link.logo}
                          alt={link.name}
                          className="h-10 w-10 rounded-xl shadow-sm"
                        />
                        <span className="line-clamp-1 text-center text-[10px] text-slate-600">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={generateQr} className="text-slate-500">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  QR код шинэчлэх
                </Button>
              </div>

              <p className="text-center text-xs text-slate-400">QR код 10 минутын дотор хүчинтэй</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
