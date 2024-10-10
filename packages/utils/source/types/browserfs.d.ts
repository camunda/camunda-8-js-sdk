// Browserfs.d.ts
declare module 'browserfs' {
	export function configure(o: {fs: string; options: any}, onError: (error?: Error) => void): void;
	export function BFSRequire(system: string): any;
}
