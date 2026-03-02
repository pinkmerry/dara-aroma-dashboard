import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

// ===== RATE LIMITING =====
// Simple in-memory rate limiter (resets on server restart, which is fine for serverless)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;           // Max failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

function getClientIP(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record) return false;

    // Reset if window has passed
    if (now - record.firstAttempt > WINDOW_MS) {
        loginAttempts.delete(ip);
        return false;
    }

    return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
    } else {
        record.count++;
    }
}

function clearAttempts(ip: string): void {
    loginAttempts.delete(ip);
}

// ===== SECURE COMPARISON =====
function secureCompare(a: string, b: string): boolean {
    try {
        const bufA = Buffer.from(a, 'utf-8');
        const bufB = Buffer.from(b, 'utf-8');

        // timingSafeEqual requires same-length buffers
        // Hash both to ensure equal length and prevent timing leaks
        const hashA = createHmac('sha256', 'compare').update(bufA).digest();
        const hashB = createHmac('sha256', 'compare').update(bufB).digest();

        return timingSafeEqual(hashA, hashB);
    } catch {
        return false;
    }
}

// ===== SESSION TOKEN =====
function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        // Fallback: derive from admin credentials (not ideal, but works without extra env var)
        return createHmac('sha256', 'dara-aroma-fallback')
            .update(process.env.ADMIN_PASSWORD || 'default')
            .digest('hex');
    }
    return secret;
}

export function createSessionToken(username: string): string {
    const payload = {
        user: username,
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Sign the payload with HMAC-SHA256
    const signature = createHmac('sha256', getSessionSecret())
        .update(payloadBase64)
        .digest('base64url');

    return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return false;

        const [payloadBase64, signature] = parts;

        // Verify signature
        const expectedSignature = createHmac('sha256', getSessionSecret())
            .update(payloadBase64)
            .digest('base64url');

        const sigBuffer = Buffer.from(signature, 'base64url');
        const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

        if (sigBuffer.length !== expectedBuffer.length) return false;
        if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

        // Verify expiration
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
        if (Date.now() > payload.exp) return false;

        return true;
    } catch {
        return false;
    }
}

// ===== ROUTE HANDLER =====
export async function POST(request: NextRequest) {
    try {
        const ip = getClientIP(request);

        // Check rate limit
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again in 15 minutes.' },
                { status: 429 }
            );
        }

        const { username, password } = await request.json();

        // Validate input
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Trim and limit input length to prevent abuse
        const trimmedUsername = username.trim().substring(0, 100);
        const trimmedPassword = password.substring(0, 200);

        // Get credentials from environment variables
        const validUsername = process.env.ADMIN_USERNAME;
        const validPassword = process.env.ADMIN_PASSWORD;

        if (!validUsername || !validPassword) {
            console.error('ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Secure comparison (timing-safe)
        const usernameMatch = secureCompare(trimmedUsername, validUsername);
        const passwordMatch = secureCompare(trimmedPassword, validPassword);

        if (usernameMatch && passwordMatch) {
            // Clear failed attempts on success
            clearAttempts(ip);

            // Create signed session token
            const sessionToken = createSessionToken(trimmedUsername);

            const response = NextResponse.json(
                { success: true, message: 'Login successful' },
                { status: 200 }
            );

            // Set session cookie with security flags
            response.cookies.set('dara_session', sessionToken, {
                httpOnly: true,     // Prevent XSS from reading cookie
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: 'lax',    // Prevent CSRF
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            return response;
        } else {
            // Record failed attempt
            recordFailedAttempt(ip);

            // Generic error message (don't reveal which field is wrong)
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }
    } catch {
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        );
    }
}
