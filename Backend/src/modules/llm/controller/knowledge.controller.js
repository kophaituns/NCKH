// modules/llm/controller/knowledge.controller.js
const llmService = require('../service/llm.service');
const logger = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');

class KnowledgeController {
    /**
     * Upload and ingest documents into the Knowledge Base
     */
    async ingestDocuments(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files were uploaded.'
                });
            }

            logger.info(`Received ${req.files.length} files for ingestion.`);

            // Move files to the AI server's user_data directory
            // Note: In a production environment with separate servers, we would use a shared volume or cloud storage.
            // For this local setup, we move them to d:\NCKH\form-agent-AI-project\user_data
            const aiServerUserData = 'd:\\NCKH\\form-agent-AI-project\\user_data';
            
            if (!fs.existsSync(aiServerUserData)) {
                fs.mkdirSync(aiServerUserData, { recursive: true });
            }

            const { category, workspaceId } = req.body;
            
            for (const file of req.files) {
                const targetPath = path.join(aiServerUserData, file.originalname);
                fs.copyFileSync(file.path, targetPath);
                // We keep the original in source or clean it up after ingestion
            }

            // Trigger Ingestion and Save to DB via Service
            const result = await llmService.ingestDocuments({
                files: req.files,
                workspaceId,
                category
            });

            res.status(200).json({
                success: true,
                message: 'Files uploaded and ingestion triggered.',
                data: result
            });
        } catch (error) {
            logger.error('Ingestion error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error ingesting documents'
            });
        }
    }

    /**
     * Get knowledge base status
     */
    async getStatus(req, res) {
        try {
            const status = await llmService.getAIStatus();
            res.status(200).json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Get status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching knowledge base status'
            });
        }
    }

    /**
     * Ingest from URL
     */
    async ingestUrl(req, res) {
        try {
            const { url, workspaceId, promoteToGlobal, category } = req.body;
            const result = await llmService.ingestUrl({
                url,
                workspaceId,
                promoteToGlobal,
                category
            });

            res.status(200).json({
                success: true,
                message: 'URL ingestion complete.',
                data: result
            });
        } catch (error) {
            logger.error('URL ingestion controller error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error ingesting URL'
            });
        }
    }

    /**
     * Ingest from YouTube
     */
    async ingestYoutube(req, res) {
        try {
            const { url, workspaceId, promoteToGlobal, category } = req.body;
            const result = await llmService.ingestYoutube({
                url,
                workspaceId,
                promoteToGlobal,
                category
            });

            res.status(200).json({
                success: true,
                message: 'YouTube ingestion complete.',
                data: result
            });
        } catch (error) {
            logger.error('YouTube ingestion controller error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error ingesting YouTube video'
            });
        }
    }

    /**
     * Ingest from Text
     */
    async ingestText(req, res) {
        try {
            const { title, text, workspaceId, promoteToGlobal, category } = req.body;
            const result = await llmService.ingestText({
                title,
                text,
                workspaceId,
                promoteToGlobal,
                category
            });

            res.status(200).json({
                success: true,
                message: 'Text ingestion complete.',
                data: result
            });
        } catch (error) {
            logger.error('Text ingestion controller error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update a knowledge source (rename)
     */
    async updateSource(req, res) {
        try {
            const { id } = req.params;
            const { name, category } = req.body;
            const { KnowledgeSource } = require('../../../models');

            const source = await KnowledgeSource.findByPk(id);
            if (!source) {
                return res.status(404).json({ success: false, error: 'Source not found' });
            }

            const oldName = source.name;
            await source.update({ name, category });

            // Sync with AI Server if name changed
            if (name && name !== oldName) {
                try {
                    await llmService.callTrainedModel('/api/workspace/update-source', 'POST', {
                        workspace_id: String(source.workspace_id),
                        old_name: oldName,
                        new_name: name
                    });
                    logger.info(`AI Metadata sync: Renamed source "${oldName}" to "${name}"`);
                } catch (syncErr) {
                    logger.warn(`AI Metadata sync failed for source rename: ${syncErr.message}`);
                }
            }

            return res.json({ success: true, data: source });
        } catch (error) {
            logger.error('Update source controller error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete a knowledge source
     */
    async deleteSource(req, res) {
        try {
            const { id } = req.params;
            const { KnowledgeSource } = require('../../../models');

            const source = await KnowledgeSource.findByPk(id);
            if (!source) {
                return res.status(404).json({ success: false, error: 'Source not found' });
            }

            // 1. Inform AI Server to remove vectors
            try {
                await llmService.callTrainedModel('/api/delete-source', 'POST', {
                    source_title: source.name,
                    workspace_id: String(source.workspace_id)
                });
            } catch (aiErr) {
                logger.warn(`Failed to remove vectors for source ${id} from AI Server: ${aiErr.message}`);
                // Continue anyway to allow DB cleanup
            }

            await source.destroy();
            return res.json({ success: true, message: 'Source deleted successfully from DB and AI Memory' });
        } catch (error) {
            logger.error('Delete source controller error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new KnowledgeController();
