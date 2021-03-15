export interface RModal {
  namespace: string; // 命名空间
  openSeamlessImmutable?: boolean;
  state: {
    [key: string]: any;
  };
  action?: {
    [key: string]: ({
      dispatch,
      getState,
      currentAction,
      commit,
      call,
    }) => void;
  };
  reducers?: {
    [key: string]: any;
  };
}
