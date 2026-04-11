import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { EntityOperator } from '../operators/entity-operator';
import { PageOperator } from '../operators/page-operator';
import { TaskOperator } from '../operators/task-operator';
import { config } from '../config';

const operatorsPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.log.info('Starting operators plugin...');

    const modelLogger = fastify.log.child({ component: 'MODEL' }, { level: config.LOG_LEVEL_MODEL });
    const serviceLogger = fastify.log.child({ component: 'SERVICE' }, { level: config.LOG_LEVEL_SERVICE });

    const cmsClient = fastify.cms;
    const systemSettingRepository = fastify.systemSettingRepository;
    const agentTaskRepository = fastify.agentTaskRepository;

    const entityOperator = new EntityOperator(cmsClient, modelLogger);
    const pageOperator = new PageOperator(cmsClient, modelLogger, systemSettingRepository);
    const taskOperator = new TaskOperator(agentTaskRepository, serviceLogger);

    fastify.decorate('entityOperator', entityOperator);
    fastify.decorate('pageOperator', pageOperator);
    fastify.decorate('taskOperator', taskOperator);
};

export default fp(operatorsPlugin, {
    name: 'operators',
    dependencies: ['infrastructure', 'repositories']
});
