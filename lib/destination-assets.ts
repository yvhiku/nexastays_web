/**
 * Local destination imagery for the home page grid.
 * Source files live in `images/assets/` (design) and are served from `public/images/assets/`.
 * Render with `unoptimized` on next/image — pre-sized JPEGs; avoids flaky dev optimizer 500s.
 */
/** Shared low-res blur placeholder for remote/optimized hero images. */
export const DESTINATION_IMAGE_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

export const DESTINATION_IMAGES = {
  marrakech: "/images/assets/marrakesh.jpg",
  agadir: "/images/assets/agadir.jpg",
  tangier: "/images/assets/tangier.jpg",
  casablanca: "/images/assets/Casablanca-Finance-City-CFC.jpg",
  fes: "/images/assets/fes.jpg",
} as const;
