import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CmsClient } from '../infrastructures/cms-client';
import { config } from '../config';

const cmsPlugin: FastifyPluginAsync = async (fastify) => {
    const cmsClient = new CmsClient(config.CMS_BASE_URL);
    fastify.decorate('cms', cmsClient);
};

export default fp(cmsPlugin, {
    name: 'cms'
});
