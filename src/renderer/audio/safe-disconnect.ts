export function safeDisconnect(node: AudioNode): void {
  try {
    node.disconnect()
  } catch {
    // disconnect() throws if the node was never connected — expected
  }
}
