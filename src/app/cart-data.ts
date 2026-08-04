export type CartLine = {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  extras?: string[];
};

// preços placeholder — ajuste os valores reais antes de publicar
export const EXTRAS = [
  { name: "Shoyu extra", price: 0 },
  { name: "Gengibre extra", price: 0 },
  { name: "Wasabi extra", price: 0 },
  { name: "Molho tarê", price: 2 },
  { name: "Molho agridoce", price: 2 },
  { name: "Cream cheese extra", price: 3 },
  { name: "Gergelim extra", price: 1 },
];

// só o 1º molho grátis escolhido sai sem custo — a partir do 2º, cobra essa taxa por unidade
export const FREE_SAUCE_NAMES = ["Shoyu extra", "Gengibre extra", "Wasabi extra"];
export const EXTRA_SAUCE_FEE = 2;

// preços placeholder — ajuste os valores reais antes de publicar
export const DRINKS = [
  { name: "Coca-Cola Lata 350ml", price: 6 },
  { name: "Guaraná Antarctica Lata 350ml", price: 6 },
  { name: "Água Mineral 500ml", price: 4 },
  { name: "Suco de Uva 300ml", price: 7 },
  { name: "Heineken Long Neck", price: 9 },
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

export function buildOrderMessage(
  cart: CartLine[],
  customerName: string,
  deliveryMode: DeliveryMode,
  address?: string,
  etaMinutes?: number,
  scheduledFor?: string
): string {
  const lines = cart.map((line) => {
    const extrasText = line.extras && line.extras.length ? ` (${line.extras.join(", ")})` : "";
    return `${line.qty}x ${line.name}${extrasText} - ${formatPrice(lineTotal(line))}`;
  });

  const itemsTotal = cartTotal(cart);
  const deliveryFee = deliveryMode === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = itemsTotal + deliveryFee;

  const modeBlock =
    deliveryMode === "pickup"
      ? `\n\nRetirada no local: ${address} (sem taxa de entrega)`
      : `\n\nEndereço de entrega: ${address}\nTaxa de entrega: ${formatPrice(DELIVERY_FEE)}`;

  const etaBlock = etaMinutes ? `\nTempo estimado de entrega: ~${etaMinutes} min (já com o preparo)` : "";
  const scheduledBlock = scheduledFor
    ? `\n⏰ PEDIDO AGENDADO — fora do horário de funcionamento. Preparar a partir de ${scheduledFor}.\n`
    : "";

  return `Novo pedido pelo site:\n${scheduledBlock}\nCliente: ${customerName}\n\n${lines.join("\n")}\n\nSubtotal: ${formatPrice(itemsTotal)}${modeBlock}\n\nTotal: ${formatPrice(grandTotal)}${etaBlock}`;
}
