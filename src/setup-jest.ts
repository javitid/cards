import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(async () => new Response()) as unknown as typeof fetch;
}

if (!globalThis.Response) {
  globalThis.Response = class {} as unknown as typeof Response;
}

if (!globalThis.Request) {
  globalThis.Request = class {} as unknown as typeof Request;
}

if (!globalThis.Headers) {
  globalThis.Headers = class {} as unknown as typeof Headers;
}