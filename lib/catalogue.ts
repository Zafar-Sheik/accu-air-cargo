export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  active: boolean;
  variants: {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    active: boolean;
  }[];
  source?: string;
};
export const catalogue: CatalogProduct[] = [
  {
    id: "product-1",
    slug: "black-cling-400mmx400mx20mic",
    name: "Black cling 400mmx400mx20mic",
    description:
      "Black cling 400mmx400mx20mic. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/black-cling-400mmx400mx20mic.png",
    active: true,
    variants: [
      {
        id: "catalog-1",
        sku: "AAC-001",
        name: "Standard",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/black-cling-400mmx400mx20mic/",
  },
  {
    id: "product-2",
    slug: "bubble-mailers-white",
    name: "Bubble Mailers White",
    description:
      "Bubble Mailers White. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/bubble-mailers-white.png",
    active: true,
    variants: [
      {
        id: "3772",
        sku: "10001A4",
        name: "A4",
        price: 40000,
        stock: 0,
        active: true,
      },
      {
        id: "3773",
        sku: "10001A3",
        name: "A3",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/bubble-mailers-white/",
  },
  {
    id: "product-3",
    slug: "buff-tape-48mm-x-100m",
    name: "Buff Tape – 48mm x 100m",
    description:
      "Buff Tape – 48mm x 100m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/buff-tape-48mm-x-100m.png",
    active: true,
    variants: [
      {
        id: "catalog-3",
        sku: "AAC-003",
        name: "Standard",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/buff-tape-48mm-x-100m/",
  },
  {
    id: "product-4",
    slug: "bulpak-c100-bubble-wrap-1-25m-x-100m",
    name: "Bulpak C100 bubble wrap 1.25m x 100m",
    description:
      "Bulpak C100 bubble wrap 1.25m x 100m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/bulpak-c100-bubble-wrap-1-25m-x-100m.png",
    active: true,
    variants: [
      {
        id: "catalog-4",
        sku: "AAC-004",
        name: "Standard",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/bulpak-c100-bubble-wrap-1-25m-x-100m/",
  },
  {
    id: "product-5",
    slug: "bulpak-c100-bubble-wrap-per-meter",
    name: "Bulpak C100 bubble wrap per meter",
    description:
      "Bulpak C100 bubble wrap per meter. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/bulpak-c100-bubble-wrap-per-meter.png",
    active: true,
    variants: [
      {
        id: "catalog-5",
        sku: "AAC-005",
        name: "Standard",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/bulpak-c100-bubble-wrap-per-meter/",
  },
  {
    id: "product-6",
    slug: "clear-cling-450mm-x-400m-x-20mic",
    name: "Clear Cling 450mm x 400m x 20mic",
    description:
      "Clear Cling 450mm x 400m x 20mic. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/clear-cling-450mm-x-400m-x-20mic.png",
    active: true,
    variants: [
      {
        id: "catalog-6",
        sku: "AAC-006",
        name: "Standard",
        price: 49853,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/clear-cling-450mm-x-400m-x-20mic/",
  },
  {
    id: "product-7",
    slug: "clear-tape-48mm-x-100m",
    name: "Clear Tape – 48mm x 100m",
    description:
      "Clear Tape – 48mm x 100m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/clear-tape-48mm-x-100m.png",
    active: true,
    variants: [
      {
        id: "catalog-7",
        sku: "AAC-007",
        name: "Standard",
        price: 3980,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/clear-tape-48mm-x-100m/",
  },
  {
    id: "product-8",
    slug: "crimping-tool",
    name: "Crimping Tool",
    description:
      "Crimping Tool. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Strapping & tools",
    image: "/images/crimping-tool.png",
    active: true,
    variants: [
      {
        id: "3795",
        sku: "100071",
        name: "13mm",
        price: 41100,
        stock: 0,
        active: true,
      },
      {
        id: "3796",
        sku: "100072",
        name: "16mm",
        price: 42550,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/crimping-tool/",
  },
  {
    id: "product-9",
    slug: "cushion-kraft-1300mmx-77m",
    name: "Cushion Kraft 1300mmx 77m",
    description:
      "Cushion Kraft 1300mmx 77m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/cushion-kraft-1300mmx-77m.png",
    active: true,
    variants: [
      {
        id: "catalog-9",
        sku: "AAC-009",
        name: "Standard",
        price: 104000,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/cushion-kraft-1300mmx-77m/",
  },
  {
    id: "product-10",
    slug: "document-window",
    name: "Document Window (1000)",
    description:
      "Document Window (1000). Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/document-window.png",
    active: true,
    variants: [
      {
        id: "catalog-10",
        sku: "AAC-010",
        name: "Standard",
        price: 92742,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/document-window/",
  },
  {
    id: "product-11",
    slug: "duct-tape-48mm-x-25m",
    name: "Duct Tape 48mm x 25m",
    description:
      "Duct Tape 48mm x 25m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/duct-tape-48mm-x-25m.png",
    active: true,
    variants: [
      {
        id: "3775",
        sku: "10010G",
        name: "Grey",
        price: 7280,
        stock: 0,
        active: true,
      },
      {
        id: "3776",
        sku: "10010R",
        name: "Red",
        price: 7280,
        stock: 0,
        active: true,
      },
      {
        id: "3777",
        sku: "10010B",
        name: "Black",
        price: 7280,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/duct-tape-48mm-x-25m/",
  },
  {
    id: "product-12",
    slug: "edge-board-40mm-x-40mm-x-4m-x-1m",
    name: "Edge Board – 40mm x 40mm x 4m x 1m",
    description:
      "Edge Board – 40mm x 40mm x 4m x 1m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Protective packaging",
    image: "/images/edge-board-40mm-x-40mm-x-4m-x-1m.png",
    active: true,
    variants: [
      {
        id: "catalog-12",
        sku: "AAC-012",
        name: "Standard",
        price: 780,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/edge-board-40mm-x-40mm-x-4m-x-1m/",
  },
  {
    id: "product-13",
    slug: "filament-tape",
    name: "Filament Tape",
    description:
      "Filament Tape. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/filament-tape.png",
    active: true,
    variants: [
      {
        id: "3788",
        sku: "100121",
        name: "36mm x 40m",
        price: 2100,
        stock: 0,
        active: true,
      },
      {
        id: "3789",
        sku: "100122",
        name: "48mm x 40m",
        price: 2900,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/filament-tape/",
  },
  {
    id: "product-14",
    slug: "fragile-printed-tape-48mm-x-50m",
    name: "Fragile Printed Tape 48mm x 50m",
    description:
      "Fragile Printed Tape 48mm x 50m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/fragile-printed-tape-48mm-x-50m.png",
    active: true,
    variants: [
      {
        id: "catalog-14",
        sku: "AAC-014",
        name: "Standard",
        price: 3250,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/fragile-printed-tape-48mm-x-50m/",
  },
  {
    id: "product-15",
    slug: "masking-tape-80-degree",
    name: "Masking Tape – 80 Degree",
    description:
      "Masking Tape – 80 Degree. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/masking-tape-80-degree.png",
    active: true,
    variants: [
      {
        id: "3790",
        sku: "100141",
        name: "18mm x 40m",
        price: 2600,
        stock: 0,
        active: true,
      },
      {
        id: "3791",
        sku: "100142",
        name: "36mm x 40m",
        price: 3000,
        stock: 0,
        active: true,
      },
      {
        id: "3792",
        sku: "100143",
        name: "48mm x 40m",
        price: 3900,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/masking-tape-80-degree/",
  },
  {
    id: "product-16",
    slug: "poly-buckle-12mm",
    name: "Poly Buckle 12mm",
    description:
      "Poly Buckle 12mm. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Strapping & tools",
    image: "/images/poly-buckle-12mm.png",
    active: true,
    variants: [
      {
        id: "catalog-16",
        sku: "AAC-016",
        name: "Standard",
        price: 21900,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/poly-buckle-12mm/",
  },
  {
    id: "product-17",
    slug: "poly-tensioner-tool-12-to-19mm",
    name: "Poly Tensioner Tool – 12 to 19mm",
    description:
      "Poly Tensioner Tool – 12 to 19mm. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Strapping & tools",
    image: "/images/poly-tensioner-tool-12-to-19mm.png",
    active: true,
    variants: [
      {
        id: "catalog-17",
        sku: "AAC-017",
        name: "Standard",
        price: 16600,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/poly-tensioner-tool-12-to-19mm/",
  },
  {
    id: "product-18",
    slug: "poly-woven-strapping",
    name: "Poly Woven Strapping",
    description:
      "Poly Woven Strapping. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Strapping & tools",
    image: "/images/poly-woven-strapping.png",
    active: true,
    variants: [
      {
        id: "3793",
        sku: "100171",
        name: "13mm x 1000m",
        price: 40000,
        stock: 0,
        active: true,
      },
      {
        id: "3794",
        sku: "100172",
        name: "16mm x 1000m",
        price: 92300,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/poly-woven-strapping/",
  },
  {
    id: "product-19",
    slug: "stop-sign-sealing-tape-48mm-x-50m",
    name: "Stop Sign Sealing Tape – 48mm x 50m",
    description:
      "Stop Sign Sealing Tape – 48mm x 50m. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/stop-sign-sealing-tape-48mm-x-50m.png",
    active: true,
    variants: [
      {
        id: "catalog-19",
        sku: "AAC-019",
        name: "Standard",
        price: 40000,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/stop-sign-sealing-tape-48mm-x-50m/",
  },
  {
    id: "product-20",
    slug: "tape-dispenser-48mm",
    name: "Tape Dispenser – 48mm",
    description:
      "Tape Dispenser – 48mm. Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Tapes & dispensers",
    image: "/images/tape-dispenser-48mm.png",
    active: true,
    variants: [
      {
        id: "catalog-20",
        sku: "AAC-020",
        name: "Standard",
        price: 19500,
        stock: 0,
        active: true,
      },
    ],
    source: "https://accuaircargo.co.za/product/tape-dispenser-48mm/",
  },
  {
    id: "product-21",
    slug: "up-metal-seals-2000-pack-for-pp-strapping",
    name: "UP Metal Seals – 2000 Pack (For PP Strapping)",
    description:
      "UP Metal Seals – 2000 Pack (For PP Strapping). Packaging material available from Accu Air Cargo. Confirm suitability and required quantity before ordering.",
    category: "Strapping & tools",
    image: "/images/up-metal-seals-2000-pack-for-pp-strapping.png",
    active: true,
    variants: [
      {
        id: "3797",
        sku: "100201",
        name: "13mm",
        price: 40000,
        stock: 0,
        active: true,
      },
      {
        id: "3798",
        sku: "100202",
        name: "16mm",
        price: 45591,
        stock: 0,
        active: true,
      },
    ],
    source:
      "https://accuaircargo.co.za/product/up-metal-seals-2000-pack-for-pp-strapping/",
  },
];
