type ResponsiveImageProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

const LOCAL_PROJECT_IMAGE = /^\/images\/projects\/.*\.(?:png|jpe?g)$/i;

export function getResponsiveImageProps(
  src: string,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 576px",
): ResponsiveImageProps {
  if (!LOCAL_PROJECT_IMAGE.test(src)) return { src };

  const base = src.replace(/\.(?:png|jpe?g)$/i, "");
  return {
    src,
    srcSet: `${base}-480.webp 480w, ${base}-768.webp 768w, ${base}-1200.webp 1200w`,
    sizes,
  };
}
