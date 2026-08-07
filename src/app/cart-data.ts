// fotos reais das bebidas (algumas ainda sem foto — aparecem com ícone genérico até o
// dono mandar fotos das latas específicas, ver comentário no array DRINKS mais abaixo)
import imgGuaranaAntarctica from "@/imports/bebidas/guarana-antarctica.jpg";
import imgRedBull from "@/imports/bebidas/red-bull.jpg";
import imgHeineken from "@/imports/bebidas/heineken.jpg";
import imgItubaina from "@/imports/bebidas/itubaina.jpg";
import imgCocaCola from "@/imports/bebidas/coca-cola.jpg";
import imgCocaColaZero from "@/imports/bebidas/coca-cola-zero.jpg";
import imgFantaLaranja from "@/imports/bebidas/fanta-laranja.jpg";
import imgFantaUva from "@/imports/bebidas/fanta-uva.jpg";
import imgGuaranaAntarcticaZero from "@/imports/bebidas/guarana-antarctica-zero.jpg";
import imgSkol from "@/imports/bebidas/skol.jpg";
import imgAguaMineral from "@/imports/bebidas/agua-mineral.jpg";
import imgDelValleUva from "@/imports/bebidas/del-valle-uva.jpg";
import imgDelValleManga from "@/imports/bebidas/del-valle-manga.jpg";
import imgDelVallePessego from "@/imports/bebidas/del-valle-pessego.jpg";
import imgDelValleGoiaba from "@/imports/bebidas/del-valle-goiaba.jpg";
import { FAR_DELIVERY_KM_THRESHOLD } from "@/app/delivery";

export type CartLine = {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  extras?: string[];
};

// preços placeholder — ajuste os valores reais antes de publicar
export const EXTRAS = [
  { name: "Shoyu", price: 0 },
  { name: "Gengibre", price: 0 },
  { name: "Wasabi", price: 0 },
  { name: "Molho tarê", price: 2 },
];

// só o 1º molho grátis escolhido sai sem custo — a partir do 2º, cobra essa taxa por unidade
export const FREE_SAUCE_NAMES = ["Shoyu", "Gengibre", "Wasabi"];
export const EXTRA_SAUCE_FEE = 2;

// preços placeholder (cerveja e Red Bull) — ajuste os valores reais antes de publicar.
// Refrigerantes em lata já confirmados em R$ 7 pelo dono.
// `img` é opcional — enquanto não tivermos foto real de cada lata, o card aparece
// só com o nome (ver DrinkThumb em OrderModal.tsx). Assim que o dono mandar as
// fotos das bebidas, é só importar e preencher aqui, igual foi feito com os pratos.
export type Drink = { name: string; price: number; img?: string };

export const DRINKS: Drink[] = [
  { name: "Itubaina Lata 350ml", price: 7, img: imgItubaina },
  { name: "Coca-Cola Lata 350ml", price: 7, img: imgCocaCola },
  { name: "Coca-Cola Zero Lata 350ml", price: 7, img: imgCocaColaZero },
  { name: "Fanta Laranja Lata 350ml", price: 7, img: imgFantaLaranja },
  { name: "Fanta Uva Lata 350ml", price: 7, img: imgFantaUva },
  { name: "Guaraná Antarctica Lata 350ml", price: 7, img: imgGuaranaAntarctica },
  { name: "Guaraná Antarctica Zero Lata 350ml", price: 7, img: imgGuaranaAntarcticaZero },
  { name: "Skol Lata 350ml", price: 9, img: imgSkol },
  { name: "Heineken Lata 350ml", price: 9, img: imgHeineken },
  { name: "Água Mineral 500ml", price: 4, img: imgAguaMineral },
  { name: "Del Valle Uva Lata 290ml", price: 6, img: imgDelValleUva },
  // "Maçã" e "Frutas Vermelhas" (lata 290ml) não existem no catálogo real da Del Valle —
  // trocados por Pêssego e Goiaba, que são sabores reais nesse mesmo formato de lata.
  { name: "Del Valle Pêssego Lata 290ml", price: 6, img: imgDelVallePessego },
  { name: "Del Valle Néctar de Manga Lata 290ml", price: 6, img: imgDelValleManga },
  { name: "Del Valle Goiaba Lata 290ml", price: 6, img: imgDelValleGoiaba },
  { name: "Red Bull Energético 250ml", price: 12, img: imgRedBull },
];

export const DELIVERY_FEE = 7;
export type DeliveryMode = "delivery" | "pickup";

export function parsePrice(priceStr: string): number {
  return Number(priceStr.replace(/[^\d,]/g, "").replace(",", "."));
}

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function extraPrice(name: string): number {
  return EXTRAS.find((e) => e.name === name)?.price ?? 0;
}

// cada unidade do item leva seu próprio potinho de cada molho marcado — então a quantidade
// multiplica quantos potinhos grátis seriam necessários. No total da linha, só o 1º potinho
// grátis (contando todas as unidades) sai sem custo; todos os demais saem a EXTRA_SAUCE_FEE.
function extrasChargeForLine(extras: string[], qty: number): number {
  const freeSauceSelections = extras.filter((name) => FREE_SAUCE_NAMES.includes(name));
  const paidExtras = extras.filter((name) => !FREE_SAUCE_NAMES.includes(name));

  const totalFreeSaucePackets = freeSauceSelections.length * qty;
  const chargeablePackets = Math.max(0, totalFreeSaucePackets - 1);
  const freeSauceCharge = chargeablePackets * EXTRA_SAUCE_FEE;

  const paidExtrasCharge = paidExtras.reduce((sum, name) => sum + extraPrice(name), 0) * qty;

  return freeSauceCharge + paidExtrasCharge;
}

export function lineTotal(line: CartLine): number {
  return line.unitPrice * line.qty + extrasChargeForLine(line.extras || [], line.qty);
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + lineTotal(line), 0);
}

export type PaymentInfo = { method: "pix" | "cartao"; id: string };

// Forma de pagamento na entrega — o cliente escolhe no final do formulário de
// pedido, pra gente já saber se precisa levar maquininha (e de qual tipo) ou não.
export const DELIVERY_PAYMENT_METHODS = ["Dinheiro", "Crédito", "Débito", "VR/Voucher", "Pix"] as const;
export type DeliveryPaymentMethod = (typeof DELIVERY_PAYMENT_METHODS)[number];

export function buildOrderMessage(
  cart: CartLine[],
  customerName: string,
  deliveryMode: DeliveryMode,
  address?: string,
  etaMinutes?: number,
  scheduledFor?: string,
  paymentInfo?: PaymentInfo,
  deliveryPaymentMethod?: DeliveryPaymentMethod,
  changeInfo?: string,
  distanceKm?: number,
  distanceUnknown?: boolean
): string {
  const lines = cart.map((line) => {
    const extrasText = line.extras && line.extras.length ? ` (${line.extras.join(", ")})` : "";
    return `${line.qty}x ${line.name}${extrasText} - ${formatPrice(lineTotal(line))}`;
  });

  // Acima do raio padrão (ou quando não deu pra confirmar a distância), a taxa fixa não
  // vale — o frete é combinado à parte com o cliente, então não soma um valor de entrega
  // que pode estar errado no total.
  const isFarDelivery = deliveryMode === "delivery" && !!distanceKm && distanceKm > FAR_DELIVERY_KM_THRESHOLD;
  const needsManualFreight = isFarDelivery || (deliveryMode === "delivery" && !!distanceUnknown);

  const itemsTotal = cartTotal(cart);
  const deliveryFee = deliveryMode === "delivery" && !needsManualFreight ? DELIVERY_FEE : 0;
  const grandTotal = itemsTotal + deliveryFee;

  const deliveryFeeLine = isFarDelivery
    ? `Taxa de entrega: A combinar — endereço a ~${String(distanceKm).replace(".", ",")}km do restaurante (acima do raio padrão de ${FAR_DELIVERY_KM_THRESHOLD}km). Falar com o cliente antes de confirmar o frete.`
    : distanceUnknown
    ? `Taxa de entrega: A combinar — não foi possível localizar esse endereço automaticamente no mapa pra calcular a distância. Confirmar com o cliente antes do frete.`
    : `Taxa de entrega: ${formatPrice(DELIVERY_FEE)}`;

  const modeBlock =
    deliveryMode === "pickup"
      ? `\n\nRetirada no local: ${address} (sem taxa de entrega)`
      : `\n\nEndereço de entrega: ${address}\n${deliveryFeeLine}`;

  const etaBlock = etaMinutes ? `\nTempo estimado de entrega: ~${etaMinutes} min (já com o preparo)` : "";
  const scheduledBlock = scheduledFor
    ? `\n⏰ PEDIDO AGENDADO — fora do horário de funcionamento. Preparar a partir de ${scheduledFor}.\n`
    : "";

  const changeBlock = changeInfo ? `\n${changeInfo}` : "";

  const paymentBlock = paymentInfo
    ? `\n\n✅ Pagamento já realizado online via ${paymentInfo.method === "pix" ? "Pix" : "Cartão"} (ID ${paymentInfo.id})`
    : deliveryPaymentMethod
    ? `\n\nPagamento na entrega: ${deliveryPaymentMethod}${changeBlock}`
    : "\n\nPagamento: na entrega (dinheiro ou cartão com o motoboy)";

  const totalLabel = needsManualFreight ? `Total (itens, frete a combinar)` : "Total";

  return `Novo pedido pelo site:\n${scheduledBlock}\nCliente: ${customerName}\n\n${lines.join("\n")}\n\nSubtotal: ${formatPrice(itemsTotal)}${modeBlock}${paymentBlock}\n\n${totalLabel}: ${formatPrice(grandTotal)}${etaBlock}`;
}
