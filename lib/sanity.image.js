// ─── lib/sanity.image.js ─────────────────────────────────────────────────────
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/lib/client';

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  return builder.image(source);
}

export function urlForWidth(source, width) {
  return builder.image(source).width(width).auto('format').url();
}

export function urlForSize(source, width, height) {
  return builder.image(source).width(width).height(height).fit('crop').auto('format').url();
}
