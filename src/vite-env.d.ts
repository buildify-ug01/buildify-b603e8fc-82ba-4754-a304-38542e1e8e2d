/// <reference types="vite/client" />

declare module 'jszip' {
  export default class JSZip {
    file(path: string, content: string): this;
    generateAsync(options: { type: string }): Promise<Blob>;
  }
}
