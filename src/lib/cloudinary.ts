

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: { event: string; info?: { secure_url: string } }
        ) => void
      ) => { open: () => void };
    };
  }
}

type SignResult = {
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
  cloudName: string;
};

async function fetchSignature(): Promise<SignResult> {
  const res = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Signature Cloudinary refusée");
  }
  return res.json();
}

const WIDGET_STYLES = {
  palette: {
    window: "#18181b",
    sourceBg: "#09090b",
    windowBorder: "#27272a",
    tabIcon: "#E5A922",
    inactiveTabIcon: "#71717a",
    menuIcons: "#E5A922",
    link: "#E5A922",
    action: "#E5A922",
    inProgress: "#E5A922",
    complete: "#22c55e",
    error: "#ef4444",
    textDark: "#fafafa",
    textLight: "#a1a1aa",
  },
};


export async function openSignedUploadWidget(
  onUrl: (url: string) => void
): Promise<void> {
  const win = window as Window & { cloudinary?: Window["cloudinary"] };

  if (!win.cloudinary?.createUploadWidget) {
    throw new Error("Le widget Cloudinary n'est pas encore chargé.");
  }

  const sign = await fetchSignature();

  const widget = win.cloudinary.createUploadWidget(
    {
      cloudName: sign.cloudName,
      apiKey: sign.apiKey,
      uploadSignatureTimestamp: sign.timestamp,
      uploadSignature: sign.signature,
      folder: sign.folder,
      sources: ["local", "url", "camera"],
      multiple: true,
      maxFiles: 10,
      maxFileSize: 10 * 1024 * 1024, 
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
      showAdvancedOptions: false,
      styles: WIDGET_STYLES,
    },
    (error, result) => {
      if (!error && result?.event === "success" && result.info?.secure_url) {
        onUrl(result.info.secure_url);
      }
      if (error) {
        console.error("Cloudinary upload error:", error);
      }
    }
  );

  widget.open();
}


export function loadCloudinaryWidgetScript(): void {
  if (document.getElementById("cloudinary-widget-script")) return;
  const script = document.createElement("script");
  script.id = "cloudinary-widget-script";
  script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
  script.async = true;
  document.head.appendChild(script);
}
