import { IToolDefinition } from '@/core/contracts/toolDefinition';
import { ToolManifest } from '@/core/types/tool';

class ToolRegistry {
  private tools: Map<string, IToolDefinition> = new Map();

  /**
   * Registers a tool definition into the platform registry.
   */
  public register(tool: IToolDefinition): void {
    if (this.tools.has(tool.manifest.id)) {
      console.warn(`[ToolRegistry] Tool "${tool.manifest.id}" already registered. Updating.`);
    }
    this.tools.set(tool.manifest.id, tool);
  }

  /**
   * Retrieves a tool definition by ID.
   */
  public get(id: string): IToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * Checks whether a tool is registered and available.
   */
  public has(id: string): boolean {
    return this.tools.has(id);
  }

  /**
   * Returns all registered tool manifests.
   */
  public getAllManifests(): ToolManifest[] {
    return Array.from(this.tools.values()).map((t) => t.manifest);
  }

  /**
   * Returns all registered tool definitions.
   */
  public getAll(): IToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();

