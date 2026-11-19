/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly PUBLIC_SITE_DOMAIN?: string;
  readonly PUBLIC_DL_DOMAIN?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
