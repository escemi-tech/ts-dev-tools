declare module "bin-links" {
  function binLinks(options: {
    path: string;
    pkg: { name?: string; bin: Record<string, string> };
    force?: boolean;
  }): Promise<unknown>;

  namespace binLinks {
    function resetSeen(): void;
  }

  export = binLinks;
}
