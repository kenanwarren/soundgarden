declare global {
  interface Window {
    api: {
      getVersion: () => Promise<string>
      loadData: (relativePath: string) => Promise<unknown>
      runtime: {
        e2e: {
          enabled: boolean
          audioMode: string | null
        }
      }
    }
  }
}

export {}
