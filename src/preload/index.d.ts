declare global {
  interface Window {
    api: {
      getVersion: () => Promise<string>
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
