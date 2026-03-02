import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/app/api/auth/login/route';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow access to login page and auth API routes without authentication
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico')
    ) {
        // Add security headers to all responses
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
    }

    // Check for session cookie
    const sessionCookie = request.cookies.get('dara_session');

    if (!sessionCookie || !sessionCookie.value) {
        // No session cookie found — redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Validate session token signature and expiration
    if (!verifySessionToken(sessionCookie.value)) {
        // Invalid or expired token — clear cookie and redirect to login
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set('dara_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        return response;
    }

    // Valid session — allow access with security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
}

function addSecurityHeaders(response: NextResponse): void {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable browser XSS filter
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Control referrer information leak
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent embedding in iframes (modern replacement for X-Frame-Options)
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'none'"
    );

    // Ensure HTTPS (only in production)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        );
    }
}

export const config = {
    // Apply middleware to all routes except static files
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
