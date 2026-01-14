import { sendLeaseExpiryEmail, sendBillingReminderEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/test-email?type=lease&email=your@email.com
// This is for testing only - remove in production
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'lease';
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email parameter required' }, { status: 400 });
  }

  let success = false;

  if (type === 'lease') {
    success = await sendLeaseExpiryEmail({
      toEmail: email,
      tenantName: 'Тест Хэрэглэгч',
      propertyName: 'Тест Байр',
      unitNumber: '101',
      endDate: '2025-02-15',
      daysRemaining: 7,
      companyName: 'PropertyHub Test',
    });
  } else if (type === 'billing') {
    success = await sendBillingReminderEmail({
      toEmail: email,
      tenantName: 'Тест Хэрэглэгч',
      propertyName: 'Тест Байр',
      unitNumber: '101',
      billingMonth: '2025 оны 1-р сар',
      totalAmount: 500000,
      dueDate: '2025-01-20',
      daysUntilDue: 3,
      companyName: 'PropertyHub Test',
    });
  }

  return NextResponse.json({
    success,
    type,
    email,
    message: success ? 'Email sent!' : 'Failed to send email',
  });
}
