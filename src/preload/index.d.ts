declare global {
  interface Window {
    api: {
      getVersion: () => Promise<string>
    }
  }
}

export {}
