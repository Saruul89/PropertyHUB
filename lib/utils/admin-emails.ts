/**
 * Get the list of system admin emails from environment variable
 * Works both on server (SYSTEM_ADMIN_EMAILS) and client (NEXT_PUBLIC_SYSTEM_ADMIN_EMAILS)
 */
function getSystemAdminEmails(): string[] {
    const envValue =
        process.env.SYSTEM_ADMIN_EMAILS ||
        process.env.NEXT_PUBLIC_SYSTEM_ADMIN_EMAILS ||
        '';

    return envValue
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);
}

/**
 * Check if an email belongs to a system admin
 * Synchronous check using environment variable - no database query
 */
export function isSystemAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    const adminEmails = getSystemAdminEmails();
    return adminEmails.includes(email.toLowerCase());
}
