declare module 'dotenv-flow' {
  interface DotenvFlowOptions {
    node_env?: string;
    default_node_env?: string;
    path?: string;
    purge_dotenv?: boolean;
    silent?: boolean;
  }
  const dotenvFlow: {
    config(options?: DotenvFlowOptions): void;
  };
  export default dotenvFlow;
}
