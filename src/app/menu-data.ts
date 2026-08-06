// ─── CARDÁPIO COMPLETO ────────────────────────────────────────
// Fonte única dos pratos: usada pelo site público (App.tsx) e pelo painel
// de promoções (/admin), pra nunca ficarem duas listas desalinhadas.

// fotos reais dos pratos (mapeadas e conferidas contra o cardápio do sushi-do-cabeça)
import imgBarcaHot from "@/imports/pratos/barca-hot.jpeg";
import imgBarcaSalmao from "@/imports/pratos/barca-salmao.jpeg";
import imgMiniBarcaSalmao from "@/imports/pratos/mini-barca-salmao.jpeg";
import imgCombinadoCasal from "@/imports/pratos/combinado-casal.jpeg";
import imgCombinadoJoy from "@/imports/pratos/combinado-joy.jpeg";
import imgCombinadoJoyNiguiri from "@/imports/pratos/combinado-joy-niguiri.jpeg";
import imgCombinadoTemakiJoy from "@/imports/pratos/combinado-temaki-joy.jpeg";
import imgCombinadoTemakiNiguiri from "@/imports/pratos/combinado-temaki-niguiri.jpeg";
import imgCombinadoTemakiSashimi from "@/imports/pratos/combinado-temaki-sashimi.jpeg";
import imgCombinadoTemakiHot from "@/imports/pratos/combinado-temaki-hot.jpeg";
import imgCombinadoSushiUramaki from "@/imports/pratos/combinado-sushi-uramaki.jpeg";
import imgTemakiHot from "@/imports/pratos/temaki-hot.jpeg";
import imgTemakiGrill from "@/imports/pratos/temaki-grill.jpeg";
import imgTemakiSkin from "@/imports/pratos/temaki-skin.jpeg";
import imgTemakiCalifornia from "@/imports/pratos/temaki-california.jpeg";
import imgHotRollSalmao from "@/imports/pratos/hot-roll-salmao.jpeg";
import imgHotRollDoritosEspecial from "@/imports/pratos/hot-roll-doritos-especial.jpeg";
import imgHotRollEspecial from "@/imports/pratos/hot-roll-especial.jpeg";
import imgSashimi from "@/imports/pratos/sashimi.jpeg";
import imgHossomakiPepino from "@/imports/pratos/hossomaki-pepino.jpeg";
import imgHossomakiSalmao from "@/imports/pratos/hossomaki-salmao.jpeg";
import imgJoySalmao from "@/imports/pratos/joy-salmao.jpeg";
import imgUramakiCalifornia from "@/imports/pratos/uramaki-california.jpeg";
import imgUramakiSalmao from "@/imports/pratos/uramaki-salmao.jpeg";
import imgUramakiFiladelfia from "@/imports/pratos/uramaki-filadelfia.jpeg";
import imgSushiFiladelfia from "@/imports/pratos/sushi-filadelfia.jpeg";

export type MenuItem = {
  name: string;
  desc?: string;
  price: string;
  oldPrice?: string | null;
  img?: string;
};

export const BARCAS: MenuItem[] = [
  {
    name: "Barca Hot",
    desc: "4 Joy grelhados · 4 Niguiri grelhados · 4 Sushi Uramaki Skin · 4 Hot Especial · 4 Hot Doritos · 4 Hot Salmão",
    price: "R$ 94,90",
    img: imgBarcaHot,
  },
  {
    name: "Barca Salmão",
    desc: "10 Sashimis · 4 Filadélfia · 4 Skin · 4 Hot Especial · 6 Uramaki Salmão · 6 Hossomaki Salmão",
    price: "R$ 99,90",
    img: imgBarcaSalmao,
  },
  {
    name: "Mini Barca Salmão",
    desc: "05 Sashimis · 06 Uramaki Salmão · 06 Hossomaki Salmão",
    price: "R$ 59,90",
    img: imgMiniBarcaSalmao,
  },
];

export const COMBINADOS: MenuItem[] = [
  { name: "Combinado Califórnia", desc: "1 Temaki Califórnia · 4 Uramaki Califórnia · 2 Niguiri de Kani", price: "R$ 39,90" },
  { name: "Combinado Casal", desc: "02 Temaki Salmão Completo · 04 Filadélfia · 04 Uramaki Filadélfia", price: "R$ 74,90", img: imgCombinadoCasal },
  { name: "Combinado Casal Hot", desc: "02 Temaki Hot · 04 Sushi Filadélfia · 04 Uramaki Filadélfia", price: "R$ 76,90" },
  { name: "Combinado Hot + Filadélfia", desc: "4 Hot Roll Salmão · 4 Sushi Filadélfia", price: "R$ 25,90" },
  { name: "Combinado Joy", desc: "04 Joy Salmão · 04 Joy Pepino · 04 Joy Salmão Grelhado", price: "R$ 58,90", img: imgCombinadoJoy },
  { name: "Combinado Joy + Niguiri", desc: "04 Joy Salmão · 04 Niguiri", price: "R$ 28,90", img: imgCombinadoJoyNiguiri },
  { name: "Combinado Misto Hossomaki", desc: "6 Hossomaki Skin · 6 Hossomaki Pepino · 6 Hossomaki Kani · 6 Mini Hot Roll · 6 Uramaki Salmão · 6 Hossomaki Salmão", price: "R$ 79,90" },
  { name: "Combinado Nachos", desc: "1 Temaki Salmão Grelhado · 4 Hot Roll Doritos Especial", price: "R$ 42,90" },
  { name: "Combinado Sushi Uramaki", desc: "08 Uramaki Filadélfia · 08 Uramaki Califórnia · 06 Uramaki Skin", price: "R$ 59,90", img: imgCombinadoSushiUramaki },
  { name: "Combinado Temaki + Hot", desc: "01 Temaki Salmão · 04 Hot Roll", price: "R$ 39,90", img: imgCombinadoTemakiHot },
  { name: "Combinado Temaki + Joy", desc: "01 Temaki Salmão Completo · 04 Joy Salmão", price: "R$ 41,90", img: imgCombinadoTemakiJoy },
  { name: "Combinado Temaki + Niguiri", desc: "01 Temaki Salmão Completo · 04 Niguiri", price: "R$ 38,90", img: imgCombinadoTemakiNiguiri },
  { name: "Combinado Temaki + Sashimi", desc: "01 Temaki Salmão Completo · 05 Sashimis", price: "R$ 41,90", img: imgCombinadoTemakiSashimi },
  { name: "Temaki Hot + Hot", desc: "01 Temaki Hot · 04 Hot Roll", price: "R$ 41,90" },
];

export const TEMAKIS: MenuItem[] = [
  { name: "Temaki Califórnia", desc: "Arroz, kani, manga e pepino", price: "R$ 26,90", img: imgTemakiCalifornia },
  { name: "Temaki Grill", desc: "Arroz, salmão grelhado, cream cheese e cebolinha", price: "R$ 29,90", img: imgTemakiGrill },
  { name: "Temaki Hot", desc: "Salmão, cream cheese, cebolinha, arroz e panko", price: "R$ 31,90", img: imgTemakiHot },
  { name: "Temaki Salmão Completo", desc: "Arroz, salmão, cream cheese e cebolinha", price: "R$ 28,90" },
  { name: "Temaki Skin", desc: "Arroz, pele de salmão frita e cream cheese", price: "R$ 25,90", img: imgTemakiSkin },
];

export const HOT_ROLLS: MenuItem[] = [
  { name: "Hot Roll Doritos Especial", desc: "Arroz, salmão grelhado, cream cheese, cebolinha e doritos · 8 unidades", price: "R$ 35,90", img: imgHotRollDoritosEspecial },
  { name: "Hot Roll Especial", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 35,90", img: imgHotRollEspecial },
  { name: "Hot Roll Salmão", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 29,90", img: imgHotRollSalmao },
];

export const URAMAKIS: MenuItem[] = [
  { name: "Sushi Filadélfia", desc: "Arroz, salmão, cream cheese e cebolinha · 8 unidades", price: "R$ 24,90", img: imgSushiFiladelfia },
  { name: "Sushi Uramaki Califórnia", desc: "Arroz com gergilim, kani, manga e pepino · 8 unidades", price: "R$ 24,90", img: imgUramakiCalifornia },
  { name: "Sushi Uramaki Filadélfia", desc: "Arroz com gergilim, cream cheese e cebolinha · 8 unidades", price: "R$ 25,90", img: imgUramakiFiladelfia },
  { name: "Sushi Uramaki Skin", desc: "Arroz com gergilim, pele de salmão frita, cream cheese e cebolinha · 8 unidades", price: "R$ 22,90" },
  { name: "Uramaki Salmão", desc: "Arroz com gergelim e salmão · 8 unidades", price: "R$ 17,90", img: imgUramakiSalmao },
  { name: "Uramaki Skin", desc: "Arroz com gergelim, pele de salmão frita, cream cheese e cebolinha · 8 unidades", price: "R$ 22,90" },
  { name: "Hossomaki de Pepino", desc: "Arroz e pepino · 6 unidades", price: "R$ 12,90", img: imgHossomakiPepino },
  { name: "Hossomaki de Salmão", desc: "Arroz e salmão · 6 unidades", price: "R$ 16,90", img: imgHossomakiSalmao },
];

export const HOSSOMAKIS_OUTROS: MenuItem[] = [
  { name: "Joy de Salmão", desc: "Arroz, salmão, cream cheese e cebolinha · 6 unidades", price: "R$ 35,90", img: imgJoySalmao },
  { name: "Niguiri Salmão", desc: "Salmão e arroz · 4 unidades", price: "R$ 14,90" },
  { name: "Sashimi", desc: "20 unidades", price: "R$ 69,90", img: imgSashimi },
];

export type PromoConfig = Record<string, { active: boolean; price: string }>;

// Promoções padrão — usadas enquanto o dono nunca configurou nada pelo painel /admin,
// ou se o Worker estiver fora do ar. Assim que ele salva pelo painel, isso é substituído
// pelo que ele escolheu (ver PROMOTIONS_API em App.tsx). Chaveado pelo nome exato do
// prato-base (mesmo formato que o painel /admin salva no Worker) — assim o nome exibido
// nunca carrega "Promoção"/"Promo" grudado, é sempre o nome limpo do prato.
export const DEFAULT_PROMO_CONFIG: PromoConfig = {
  "Combinado Casal": { active: true, price: "R$ 68,90" },
  "Combinado Casal Hot": { active: true, price: "R$ 69,90" },
  "Hot Roll Salmão": { active: true, price: "R$ 25,90" },
  "Mini Barca Salmão": { active: true, price: "R$ 49,90" },
  "Sushi Uramaki Skin": { active: true, price: "R$ 18,90" },
  "Temaki Hot": { active: true, price: "R$ 26,90" },
  "Temaki Hot + Hot": { active: true, price: "R$ 37,90" },
};

// Categorias que o painel /admin lista pro dono escolher o que entra em promoção.
// (as "Promoções" em si não entram aqui — são geradas a partir destes pratos-base.)
export const MENU_CATEGORIES: { title: string; items: MenuItem[] }[] = [
  { title: "Barcas", items: BARCAS },
  { title: "Combinados", items: COMBINADOS },
  { title: "Temakis", items: TEMAKIS },
  { title: "Hot Rolls", items: HOT_ROLLS },
  { title: "Uramakis", items: URAMAKIS },
  { title: "Outros", items: HOSSOMAKIS_OUTROS },
];

export const ALL_MENU_ITEMS: MenuItem[] = MENU_CATEGORIES.flatMap((c) => c.items);

// reaproveitada na seção "Sobre" do site (substitui uma foto de banco de imagens antiga)
export { imgBarcaSalmao };
