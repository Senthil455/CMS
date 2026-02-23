import { PrismaClient } from '@prisma/client';
import type { ChatMessage } from '@cms/shared';
import type { IChatRepository } from './chat-repository.interface';

export class SqliteChatRepository implements IChatRepository {
    constructor(private prisma: PrismaClient) { }

    async save(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
        const saved = await this.prisma.chatMessage.create({
            data: {
                userId: message.userId,
                content: message.content,
                role: message.role,
                payload: message.payload ? JSON.stringify(message.payload) : null,
            },
        });
        return {
            ...saved,
            role: saved.role as 'user' | 'assistant',
            createdAt: saved.createdAt.toISOString(),
            payload: saved.payload ? JSON.parse(saved.payload) : undefined,
        };
    }

    async findAll(userId: string, limit: number, beforeId?: number): Promise<ChatMessage[]> {
        const where: any = { userId };
        if (beforeId) {
            where.id = { lt: beforeId };
        }

        const messages = await this.prisma.chatMessage.findMany({
            where,
            orderBy: { id: 'desc' },
            take: limit,
        });
        return messages.reverse().map((m: any) => ({
            ...m,
            role: m.role as 'user' | 'assistant',
            createdAt: m.createdAt.toISOString(),
            payload: m.payload ? JSON.parse(m.payload) : undefined,
        }));
    }

    async saveAiResponseLog(handler: string, response: string, providerName?: string, schemaId?: string, input?: string): Promise<void> {
        await this.prisma.aiResponseLog.create({
            data: {
                handler,
                response,
                providerName: providerName || null,
                schemaId: schemaId || null,
                input: input || null,
            },
        });
    }

    async findAllAiResponseLogs(): Promise<any[]> {
        return this.prisma.aiResponseLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
    }

    async findAiResponseLogById(id: number): Promise<any | null> {
        return this.prisma.aiResponseLog.findUnique({
            where: { id },
        });
    }

    async deleteAiResponseLog(id: number): Promise<void> {
        await this.prisma.aiResponseLog.delete({
            where: { id },
        });
    }

    // ==================== Design Styles ====================

    async getAllDesignStyles(): Promise<any[]> {
        return this.prisma.designStyle.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async getDesignStyleByName(name: string): Promise<any | null> {
        return this.prisma.designStyle.findUnique({
            where: { name },
        });
    }

    async createDesignStyle(data: { name: string; displayName: string; description?: string; listPrompt?: string; detailPrompt?: string }): Promise<any> {
        return this.prisma.designStyle.create({ data });
    }

    async updateDesignStyle(id: number, data: { name?: string; displayName?: string; description?: string; listPrompt?: string; detailPrompt?: string }): Promise<any> {
        return this.prisma.designStyle.update({
            where: { id },
            data,
        });
    }

    async deleteDesignStyle(id: number): Promise<void> {
        await this.prisma.designStyle.delete({
            where: { id },
        });
    }

    async seedDefaultStyles(): Promise<void> {
        const count = await this.prisma.designStyle.count();
        if (count > 0) return; // Already seeded

        const defaults = [
            {
                name: 'modern',
                displayName: 'Modern Editorial',
                description: 'Best for articles, magazines, and product showcases. Uses bold typography and bento grids.',
                listPrompt: `DESIGN STYLE INSTRUCTION: Modern Editorial (List View)\n\n- Layout: Use Bento Grid layout for Hero section (large feature left, smaller stacked right). Below, use grid-cols-3.\n- Cards: No visible borders. Large rounded-xl images. Text below image. Hover scale effect.\n- Aesthetic: Bold/black headings (Inter/Manrope).\n- Details: Add colorful 'Category Pills' (e.g. bg-blue-100 text-blue-800 rounded-full) above headlines.\n- Footer: Large dark background.`,
                detailPrompt: `DESIGN STYLE INSTRUCTION: Modern Editorial (Detail View)\n\n- Layout: Hero Header with large background image or split screen (Image Left, Title Right).\n- Content: Clean single-column text or 2-column (Content + Sticky Table of Contents).\n- Headers: Bold, heavy fonts for section headers.\n- Aesthetic: Bold/black headings (Inter/Manrope).\n- Details: Add colorful 'Category Pills' (e.g. bg-blue-100 text-blue-800 rounded-full) above headlines.\n- Footer: Large dark background.`,
            },
            {
                name: 'classic',
                displayName: 'Classic Newspaper',
                description: 'Best for text-heavy content. Uses serif fonts, bylines, and high information density.',
                listPrompt: `DESIGN STYLE INSTRUCTION: Classic Newspaper (List View)\n\n- Layout: Use a classic 2/3 + 1/3 column layout. Main content on left, sidebar on right. Separate articles with distinct borders.\n- Density: High information density. Show excerpts and metadata.\n- Typography: Use Serif font for all Headings (e.g. 'Merriweather'). Sans-serif for UI elements.\n- Colors: Strict Black & White with one deep accent color (e.g. text-red-700). Background white or subtle stone-50.\n- Visuals: Rectangular, sharp images (no rounded corners).`,
                detailPrompt: `DESIGN STYLE INSTRUCTION: Classic Newspaper (Detail View)\n\n- Layout: Default to standard article layout. Center column for text, optional sidebar for metadata/related links.\n- Header: Large Serif Headline. Explicit Byline and Date separation (border-b, border-t).\n- Content: Drop-cap for the first letter if possible. Readable serif body font (e.g. Georgia style).\n- Visuals: Rectangular, sharp images (no rounded corners). Captions with italic small text under images.\n- Typography: Use Serif font for all Headings (e.g. 'Merriweather'). Sans-serif for UI elements.\n- Colors: Strict Black & White with one deep accent color (e.g. text-red-700). Background white or subtle stone-50.`,
            },
            {
                name: 'minimal',
                displayName: 'Minimalist Visual',
                description: 'Best for portfolios and photography. Focuses on large images and whitespace.',
                listPrompt: `DESIGN STYLE INSTRUCTION: Minimalist Visual (List View)\n\n- Layout: Masonry or uniform grid with massive whitespace (gap-y-16).\n- Cards: COMPLETELY CLEAN. No borders, no shadows, no background colors. Just Image + Title + Subtitle.\n- Typography: Large, airy headings. text-gray-900 for title, text-gray-500 for summary.\n- Images: Tall aspect ratios (portrait or 4:3).\n- Navigation: Minimal header. No sticky headers.`,
                detailPrompt: `DESIGN STYLE INSTRUCTION: Minimalist Visual (Detail View)\n\n- Layout: Single column, extremely focused. Max-width-3xl centered. Massive whitespace around content.\n- Header: Huge title defined by whitespace, not boldness. Thin, elegant fonts.\n- Content: Distraction-free. Large legible serif or clean sans-serif body text.\n- Images: Full width or large distinct visual blocks.\n- Navigation: Minimal header. No sticky headers.`,
            },
        ];

        for (const style of defaults) {
            await this.prisma.designStyle.create({ data: style });
        }
    }
}
