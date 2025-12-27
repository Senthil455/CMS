import { describe, it, expect, vi } from 'vitest';
import { CmsClient } from '../cms-client';
import { config } from '../../config';

describe('CmsClient', () => {
    const client = new CmsClient(config.CMS_BASE_URL);
    const externalCookie = process.env.CMS_COOKIE || '.AspNetCore.Identity.Application=CfDJ8NoankRzbIZFpmO-cjQUAAX0flqpdOGoTjQqFvdii85m2WYzjMHNpZMJUJuo57-fplHrTEWExJ71HU3NaQALo6Gs0UPgIW-5-S5dV9qVs8g4ibrqahQi_4EcsF_BUq5AnwGskoBGGPts016N4guJRXhkUmZfapGd4U-so6hlHhq-WsVsBvBIvqSLDcsRW8gp9FtjJChCMfBx01i_M6t-yRqqc6cXvwb6SCijcmlW3c8aGFI52ZUWLco0UFLOl5rCoeDSqXVtQqe8GLZlvfXvVpy2BmwAEMqpbxrRlCLBkuoactoyk-CrV5zCoYe4LbOBLgzTZM_N6kmDI1pvTf6jbKMkWVqCipgGwskVzuaBJYD16772g9gtzj_hd9u-rW0nrTSPMHGpDNoZtYN4jK21FYv_yFg3Fn1iT0aVRASvt05y3c3xLwXDjwmE3TKfjIDE1gxBB_gL25solnx5gNjU1vuAk2fTEaTnCGKjBOkgPZN2uZVZRPlGaaxA3spOKUyRb3tacs7Fw6yVuJCAIYNpytttmLZaLlE-qdiMPIKfsmfAnL4kBq9l-kXYL-oEYxkesGo5E_ggkC4DARfb8qUIQTVd5LbfB2aEFebCBkUVA4YGr7Uk-ftTZkTZmbNb2ZIDjnhCycKmJRG9StfCWfG2McDBAXH1801qMqKqXYCtE50hEajqEGGVykaBbJCCz1-jp_njE0NSQfqVonVQmeNTEEWyR8PMMg_OlLiEcyDbtpAPug-yYxOrmIPAjS3U16Q7BU406gDLgIom27ByHfikLfBYx7oxbfJB2rGPgqcHrWedwwF2EBRYVQ-rdvxwoV-_yA; expires=Sat, 10 Jan 2026 15:20:06 GMT; path=/; samesite=lax; httponly';

    describe('generateSDL', () => {
        it('should fetch introspection and return SDL from real CMS', async () => {
            if (!externalCookie) {
                console.warn('Skipping real CMS test because CMS_COOKIE is not set in env');
                return;
            }

            const result = await client.generateSDL(externalCookie);

            expect(result).toContain('type Query');
            expect(result.length).toBeGreaterThan(0);
            console.log('SDL generated successfully:', result);
        });

        it('should throw error if axios request fails (invalid cookie)', async () => {
            await expect(client.generateSDL('invalid-cookie')).rejects.toThrow();
        });
    });
});
