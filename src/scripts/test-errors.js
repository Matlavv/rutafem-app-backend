#!/usr/bin/env node

/**
 * Script de test pour déclencher des erreurs et vérifier le monitoring
 * Usage: npm run test:errors
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Couleurs console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            headers: data ? { 'Content-Type': 'application/json' } : {},
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testEndpoint(method, path, description, data = null) {
    console.log(`${colors.yellow}▶ ${description}${colors.reset}`);
    console.log(`  ${method} ${path}`);

    try {
        const { status, body } = await makeRequest(method, path, data);
        const statusColor = status >= 400 ? colors.red : colors.green;
        console.log(
            `  ${statusColor}${status >= 400 ? '✗' : '✓'} Status: ${status}${colors.reset}`,
        );

        if (body) {
            try {
                const parsed = JSON.parse(body);
                console.log(`  Response: ${JSON.stringify(parsed).substring(0, 100)}...`);
            } catch {
                console.log(`  Response: ${body.substring(0, 100)}...`);
            }
        }
    } catch (error) {
        console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }

    console.log('');
    await sleep(1000);
}

async function runTests() {
    console.log('🧪 Test des erreurs et du monitoring RutaFem');
    console.log('==============================================\n');

    console.log('1️⃣  Test des erreurs HTTP standards');
    console.log('-----------------------------------');
    await testEndpoint('GET', '/api/test/error/400', '400 Bad Request');
    await testEndpoint('GET', '/api/test/error/404', '404 Not Found');
    await testEndpoint('GET', '/api/test/error/500', '500 Internal Server Error');

    console.log('\n2️⃣  Test des exceptions');
    console.log('-----------------------------------');
    await testEndpoint('GET', '/api/test/error/exception', 'Exception non gérée');
    await testEndpoint('GET', '/api/test/error/database', 'Erreur de base de données');

    console.log('\n3️⃣  Test de validation Zod');
    console.log('-----------------------------------');
    await testEndpoint('POST', '/api/test/error/validation', 'Données invalides', {
        name: '',
        age: 10,
    });

    console.log('\n4️⃣  Test de requête lente (>500ms)');
    console.log('-----------------------------------');
    await testEndpoint('GET', '/api/test/slow', 'Requête lente (800ms)');

    console.log("\n5️⃣  Test d'erreurs multiples");
    console.log('-----------------------------------');
    await testEndpoint('GET', '/api/test/error/batch', "Batch d'erreurs");

    console.log('\n✅ Tests terminés !\n');
    console.log('📊 Maintenant, vérifiez dans Grafana :');
    console.log('   🔗 http://localhost:3001\n');
    console.log('   Dashboard "RutaFem Backend Monitoring" :');
    console.log('   - Le graphique "Taux d\'erreurs 5xx" devrait afficher > 0%');
    console.log('   - Le graphique "HTTP p95 Latency" devrait montrer un pic\n');
    console.log('   Dashboard "RutaFem Logs & Errors" :');
    console.log('   - Le panneau "Erreurs (ERROR level)" devrait afficher les erreurs');
    console.log('   - Le panneau "Logs par niveau" devrait montrer des logs d\'erreur');
    console.log('   - Le panneau "Requêtes lentes" devrait afficher /api/test/slow\n');
    console.log('💡 Attendez 15-30 secondes pour que Prometheus collecte les métriques\n');
}

runTests().catch((error) => {
    console.error(`${colors.red}❌ Erreur: ${error.message}${colors.reset}`);
    process.exit(1);
});
