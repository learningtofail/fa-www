/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Contact form POST target. Defaults to the production API when unset. */
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
