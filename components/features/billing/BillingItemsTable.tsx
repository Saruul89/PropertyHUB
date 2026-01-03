'use client';

import { BillingItem } from '@/types';

interface BillingItemsTableProps {
    items: BillingItem[];
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    paidAmount?: number;
    showPaymentInfo?: boolean;
}

export function BillingItemsTable({
    items,
    subtotal,
    taxAmount = 0,
    totalAmount,
    paidAmount = 0,
    showPaymentInfo = true,
}: BillingItemsTableProps) {
    const remainingAmount = totalAmount - paidAmount;

    return (
        <table className="w-full">
            <thead className="border-b">
                <tr>
                    <th className="pb-2 text-left text-sm font-medium text-gray-500">項目</th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">数量</th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">単価</th>
                    <th className="pb-2 text-right text-sm font-medium text-gray-500">金額</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {items.map((item) => (
                    <tr key={item.id}>
                        <td className="py-3">
                            <p className="font-medium">{item.fee_name}</p>
                            {item.description && (
                                <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                        </td>
                        <td className="py-3 text-right">
                            {item.quantity !== 1 ? item.quantity.toLocaleString() : ''}
                        </td>
                        <td className="py-3 text-right">₮{item.unit_price.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium">
                            ₮{item.amount.toLocaleString()}
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="border-t">
                <tr>
                    <td colSpan={3} className="py-3 text-right font-medium">小計</td>
                    <td className="py-3 text-right font-medium">
                        ₮{subtotal.toLocaleString()}
                    </td>
                </tr>
                {taxAmount > 0 && (
                    <tr>
                        <td colSpan={3} className="py-3 text-right font-medium">税額</td>
                        <td className="py-3 text-right font-medium">
                            ₮{taxAmount.toLocaleString()}
                        </td>
                    </tr>
                )}
                <tr className="text-lg">
                    <td colSpan={3} className="py-3 text-right font-bold">合計</td>
                    <td className="py-3 text-right font-bold">
                        ₮{totalAmount.toLocaleString()}
                    </td>
                </tr>
                {showPaymentInfo && paidAmount > 0 && (
                    <>
                        <tr className="text-green-600">
                            <td colSpan={3} className="py-3 text-right font-medium">支払済み</td>
                            <td className="py-3 text-right font-medium">
                                -₮{paidAmount.toLocaleString()}
                            </td>
                        </tr>
                        {remainingAmount > 0 && (
                            <tr className="text-red-600">
                                <td colSpan={3} className="py-3 text-right font-bold">未払い残高</td>
                                <td className="py-3 text-right font-bold">
                                    ₮{remainingAmount.toLocaleString()}
                                </td>
                            </tr>
                        )}
                    </>
                )}
            </tfoot>
        </table>
    );
}
