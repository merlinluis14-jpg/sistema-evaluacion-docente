const UPTEX_LOGO_PUBLIC_PATH = "/uptexlogo.png";
const UPTEX_LOGO_ASPECT_RATIO = 328 / 499;

let cachedLogoDataUrlPromise: Promise<string> | null = null;

export function getUptexLogoDimensions(width: number) {
  return {
    width,
    height: width * UPTEX_LOGO_ASPECT_RATIO,
  };
}

export function getUptexLogoPublicPath() {
  return UPTEX_LOGO_PUBLIC_PATH;
}

export function getUptexLogoDataUrl() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("El logo UPTex solo se puede cargar en el navegador."));
  }

  if (!cachedLogoDataUrlPromise) {
    cachedLogoDataUrlPromise = new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("No se pudo preparar el logo UPTex para el PDF."));
          return;
        }

        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error("No se pudo cargar el logo UPTex."));
      image.src = UPTEX_LOGO_PUBLIC_PATH;
    });
  }

  return cachedLogoDataUrlPromise;
}
