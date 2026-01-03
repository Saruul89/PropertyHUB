import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Inline admin check to avoid module resolution issues in middleware
function isSystemAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    const envValue = process.env.SYSTEM_ADMIN_EMAILS || '';
    const adminEmails = envValue
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);
    return adminEmails.includes(email.toLowerCase());
}

function isTenantEmail(email: string): boolean {
    const tenantDomain =
        process.env.NEXT_PUBLIC_TENANT_EMAIL_DOMAIN || 'tenant.propertyhub.mn';
    return email.endsWith(`@${tenantDomain}`);
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const path = request.nextUrl.pathname;
    const email = session?.user?.email || '';

    // Хамгаалагдсан замууд
    const protectedPaths = ['/dashboard', '/tenant', '/admin'];
    // Нэвтрэх замууд (admin-login хасагдсан - нэвтэрсэн ч хандах боломжтой)
    const authPaths = ['/login', '/register'];

    const isProtected = protectedPaths.some((p) => path.startsWith(p));
    const isAuthPath = authPaths.some((p) => path.startsWith(p));
    const isAdminPath = path.startsWith('/admin');

    // /admin-login нь нэвтрэлтийн төлөвөөс үл хамааран хандах боломжтой
    if (path.startsWith('/admin-login')) {
        return response;
    }

    // Нэвтрээгүй үед хамгаалагдсан зам руу хандах
    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Нэвтэрсэн үед нэвтрэх зам руу хандах - тохирох хяналтын самбар руу чиглүүлэх
    if (isAuthPath && session) {
        if (isTenantEmail(email)) {
            return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
        }
        if (isSystemAdminEmail(email)) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Админ замын хамгаалалт - админ биш хэрэглэгч хандах боломжгүй
    if (isAdminPath && session) {
        if (!isSystemAdminEmail(email)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Хяналтын самбарын хамгаалалт - админ /admin/dashboard руу чиглүүлэгдэнэ
    if (path.startsWith('/dashboard') && session && isSystemAdminEmail(email)) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Түрээслэгчийн замын хамгаалалт - зөвхөн түрээслэгч хандах боломжтой
    if (path.startsWith('/tenant') && session && !isTenantEmail(email)) {
        if (isSystemAdminEmail(email)) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
