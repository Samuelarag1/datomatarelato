import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode } from "react";
import type { TopicStat, TopicSummary } from "@/lib/data/resumen";
import type { Place } from "@/lib/places";
import { SITE } from "@/lib/site";

// Las imágenes que aparecen al compartir un enlace. Colores neutros: ninguna cifra se pinta de bueno o malo.
const BACKGROUND = "#121417";
const INK = "#f4f5f6";
const INK_2 = "#c2c7cc";
const INK_3 = "#979da4";

export const SHARE_SIZE = { width: 1200, height: 630 };
export const SHARE_TYPE = "image/png";

const fontFile = (weight: number) => readFile(join(process.cwd(), `assets/fonts/ibm-plex-sans-latin-${weight}-normal.woff`));
const [regular, semibold] = await Promise.all([fontFile(400), fontFile(600)]);

function render(children: ReactNode, size: { width: number; height: number } = SHARE_SIZE) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: BACKGROUND,
          color: INK,
          fontFamily: "IBM Plex Sans",
        }}
      >
        {children}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "IBM Plex Sans", data: regular, weight: 400, style: "normal" },
        { name: "IBM Plex Sans", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}

const SiteName = ({ style }: { style?: CSSProperties }) => (
  <div style={{ fontSize: 30, fontWeight: 600, color: INK_2, ...style }}>{SITE.name}</div>
);

const Heading = ({ title, place }: { title: string; place: string }) => (
  <div style={{ display: "flex", marginTop: 20, fontSize: 50, letterSpacing: -0.5 }}>
    <span style={{ fontWeight: 600 }}>{title}</span>
    <span style={{ color: INK_3, whiteSpace: "pre" }}>{` · ${place}`}</span>
  </div>
);

/** La imagen del sitio: el nombre, en grande y en el centro para que sobreviva a los recortes. */
export function siteImage() {
  return render(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 64 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 128, fontWeight: 600, lineHeight: 1.02, letterSpacing: -3 }}>
        <span>Argentina</span>
        <span>al Desnudo</span>
      </div>
      <div style={{ marginTop: 40, fontSize: 38, color: INK_2 }}>{SITE.slogan}</div>
    </div>,
  );
}

/** Una página sin cifra: un título y una frase. */
export function textImage(title: string, text: string) {
  return render(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 64 }}>
      <SiteName />
      <div style={{ marginTop: 24, fontSize: 88, fontWeight: 600, lineHeight: 1.1, letterSpacing: -2 }}>{title}</div>
      <div style={{ marginTop: 32, maxWidth: 960, fontSize: 38, lineHeight: 1.3, color: INK_2, textWrap: "balance" }}>{text}</div>
    </div>,
  );
}

/** Un tema en un lugar: la cifra con su frase, su cobertura y su período, para que se entienda sin abrir el enlace. */
export function topicImage(title: string, place: Place, stat: TopicStat | null, fallback: string) {
  if (!stat) return textImage(`${title} · ${place.name}`, fallback);

  return render(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "44px 64px 40px" }}>
      <SiteName />
      <Heading title={title} place={place.name} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
        <div style={{ fontSize: stat.value.length > 6 ? 150 : 190, fontWeight: 600, lineHeight: 1, letterSpacing: -5 }}>{stat.value}</div>
        <div style={{ marginTop: 16, maxWidth: 1040, fontSize: stat.text.length > 110 ? 30 : 36, lineHeight: 1.3, color: INK_2, textWrap: "balance" }}>{stat.text}</div>
      </div>
      <div style={{ fontSize: 25, color: INK_3 }}>{stat.source}</div>
    </div>,
  );
}

function PlaceStat({ stat }: { stat: TopicStat | null }) {
  const column: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", width: 340 };
  if (!stat) return <div style={{ ...column, fontSize: 28, color: INK_3 }}>Sin dato por ahora</div>;
  return (
    <div style={column}>
      {/* Alto fijo: una cifra más chica no desalinea los textos de las tres columnas. */}
      <div style={{ display: "flex", alignItems: "center", height: 104, fontSize: stat.value.length > 6 ? 66 : 92, fontWeight: 600, letterSpacing: -2 }}>{stat.value}</div>
      <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1.25, color: INK_2, textWrap: "balance" }}>{stat.short}</div>
      <div style={{ marginTop: 10, fontSize: 22, color: INK_3 }}>{stat.period}</div>
    </div>
  );
}

/** El resumen de un lugar: una cifra por tema. */
export function placeImage(place: Place, summary: TopicSummary) {
  return render(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "44px 40px 40px" }}>
      <SiteName />
      <div style={{ marginTop: 16, fontSize: 68, fontWeight: 600, letterSpacing: -1.5 }}>{place.name}</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 36, flexGrow: 1, paddingTop: 48 }}>
        <PlaceStat stat={summary.precios} />
        <PlaceStat stat={summary.alcanza} />
        <PlaceStat stat={summary.pobreza} />
      </div>
      <div style={{ fontSize: 25, color: INK_3 }}>Fuente: INDEC y organismos oficiales</div>
    </div>,
  );
}

/** El ícono para la pantalla de inicio del celular. */
export function appleIcon() {
  return render(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 120, fontWeight: 600 }}>A</div>,
    { width: 180, height: 180 },
  );
}
