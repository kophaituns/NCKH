
require('dotenv').config();
const { KnowledgeSource } = require('../models');

async function checkKnowledge() {
    try {
        const workspaceId = process.env.DEBUG_WORKSPACE_ID || '18';
        console.log(`\n🔍 QUERYING MYSQL FOR WORKSPACE: ${workspaceId}`);
        
        const sources = await KnowledgeSource.findAll({
            where: { workspace_id: workspaceId }
        });
        
        if (sources.length === 0) {
            console.log(`⚠️ No knowledge sources found for workspace ${workspaceId} in MySQL.`);
            process.exit(0);
        }

        console.log(`✅ Found ${sources.length} sources in Database:\n`);
        
        sources.forEach((s, i) => {
            console.log(`--- [Source ${i+1}] ---`);
            console.log(`Name: ${s.name}`);
            console.log(`Type: ${s.source_type}`);
            console.log(`Path: ${s.source_path}`);
            console.log(`Status: ${s.status}`);
            console.log(`Vector Count: ${s.vector_count}`);
            console.log(`Created At: ${s.created_at}`);
            console.log("-".repeat(40));
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error querying database:', error);
        process.exit(1);
    }
}

checkKnowledge();
