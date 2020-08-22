// 单个 model interface
export interface IModelProps {
  namespace: string
  state: {
    [key: string]: any
  }
  action?: {
    [key: string]: any
  }
  reducers?: {
    [key: string]: any
  }
  openSeamlessImmutable?: boolean
}

export interface IParentModelProps {
  [key: string]: IModelProps
}
