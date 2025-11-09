-- Add performance indexes for filtering and querying
-- Note: Table names match the actual database schema (Ride with capital R)

-- Profile indexes (for filtering verified users and drivers)
CREATE INDEX IF NOT EXISTS "profile_isVerified_idx" ON "profile"("isVerified");
CREATE INDEX IF NOT EXISTS "profile_isDriverVerified_idx" ON "profile"("isDriverVerified");

-- Ride indexes (for filtering rides by city, date, status)
-- Note: Using "Ride" (capital R) to match existing table name from initial migration
CREATE INDEX IF NOT EXISTS "Ride_status_idx" ON "Ride"("status");
CREATE INDEX IF NOT EXISTS "Ride_departureDatetime_idx" ON "Ride"("departureDatetime");
CREATE INDEX IF NOT EXISTS "Ride_departureCity_idx" ON "Ride"("departureCity");
CREATE INDEX IF NOT EXISTS "Ride_arrivalCity_idx" ON "Ride"("arrivalCity");
CREATE INDEX IF NOT EXISTS "Ride_createdAt_idx" ON "Ride"("createdAt");
-- Composite index for common query pattern: search by departure/arrival city and date
CREATE INDEX IF NOT EXISTS "Ride_departureCity_arrivalCity_departureDatetime_idx" ON "Ride"("departureCity", "arrivalCity", "departureDatetime");

-- Session indexes (for session management and cleanup)
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_expiresAt_idx" ON "session"("expiresAt");
-- Composite index for finding user sessions that are expired
CREATE INDEX IF NOT EXISTS "session_userId_expiresAt_idx" ON "session"("userId", "expiresAt");

-- Account indexes (for OAuth provider lookups)
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
-- Composite index for finding account by provider
CREATE INDEX IF NOT EXISTS "account_providerId_accountId_idx" ON "account"("providerId", "accountId");

-- Verification indexes (for token verification)
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");
-- Composite index for finding valid verification tokens
CREATE INDEX IF NOT EXISTS "verification_identifier_expiresAt_idx" ON "verification"("identifier", "expiresAt");


