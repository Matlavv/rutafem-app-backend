const { PrismaClient } = require('../prisma/generated/prisma');

async function checkIndexes() {
    const prisma = new PrismaClient();

    try {
        console.log('📊 Index de la base de données :\n');

        const indexes = await prisma.$queryRaw`
      SELECT 
        tablename, 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE '%_idx'
      ORDER BY tablename, indexname;
    `;

        let currentTable = '';
        indexes.forEach(idx => {
            if (idx.tablename !== currentTable) {
                currentTable = idx.tablename;
                console.log(`\n📋 Table: ${currentTable}`);
            }
            console.log(`  ✓ ${idx.indexname}`);
        });

        console.log(`\n\n✅ Total: ${indexes.length} index trouvés\n`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

checkIndexes();

