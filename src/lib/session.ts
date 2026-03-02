import { SignJWT, jwtVerify } from 'jose';

// Get or derive session secret
function getSecretKey(): Uint8Array {
    let secret = process.env.SESSION_SECRET;

    // Fallback if not set
    if (!secret) {
        secret = (process.env.ADMIN_PASSWORD || 'default-fallback-secret') + '-secret-padding-must-be-long-enough-for-hs256';
    } else if (secret.length < 32) {
        // HS256 requires at least 256 bits (32 bytes)
        secret = secret.padEnd(32, '0');
    }

    return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string): Promise<string> {
    const secretKey = getSecretKey();

    return await new SignJWT({ user: username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<boolean> {
    try {
        const secretKey = getSecretKey();
        await jwtVerify(token, secretKey);
        return true;
    } catch {
        return false; // Invalid or expired
    }
}
