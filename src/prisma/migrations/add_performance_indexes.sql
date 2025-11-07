-- Index de performance pour améliorer les requêtes

-- Ride: table critique pour les recherches
CREATE INDEX IF NOT EXISTS "Ride_status_idx" ON "Ride"("status");
CREATE INDEX IF NOT EXISTS "Ride_departureDatetime_idx" ON "Ride"("departureDatetime");
CREATE INDEX IF NOT EXISTS "Ride_departureCity_idx" ON "Ride"("departureCity");
CREATE INDEX IF NOT EXISTS "Ride_arrivalCity_idx" ON "Ride"("arrivalCity");
CREATE INDEX IF NOT EXISTS "Ride_createdAt_idx" ON "Ride"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Ride_departureCity_arrivalCity_departureDatetime_idx" 
    ON "Ride"("departureCity", "arrivalCity", "departureDatetime");

-- Session: authentification
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_expiresAt_idx" ON "session"("expiresAt");
CREATE INDEX IF NOT EXISTS "session_userId_expiresAt_idx" ON "session"("userId", "expiresAt");

-- Account: OAuth
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "account_providerId_accountId_idx" ON "account"("providerId", "accountId");

-- Profile: filtres de vérification
CREATE INDEX IF NOT EXISTS "profile_isVerified_idx" ON "profile"("isVerified");
CREATE INDEX IF NOT EXISTS "profile_isDriverVerified_idx" ON "profile"("isDriverVerified");

-- Verification: codes de vérification
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX IF NOT EXISTS "verification_identifier_expiresAt_idx" 
    ON "verification"("identifier", "expiresAt");

