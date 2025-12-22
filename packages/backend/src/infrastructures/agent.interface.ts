export interface GenerateOptions {
    requirements: string;
    prompt: string;
    schemas: { name: string; content: string }[];
}

export interface IAgent {
    generate(options: GenerateOptions): Promise<any[]>;
}
