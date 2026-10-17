/** Referência independente de framework. Adapte ao registro de marcas existente. */
export type NextLevelSurface = 'light' | 'dark';
export type NextLevelTreatment = 'prisma' | 'interface' | 'mono';
export type NextLevelLayout = 'horizontal' | 'vertical' | 'symbol';

export interface NextLevelLogoOptions {
  surface: NextLevelSurface;
  treatment?: NextLevelTreatment;
  layout?: NextLevelLayout;
  supportLine?: boolean;
  assetBase?: string;
}

export function nextLevelLogoAsset(options: NextLevelLogoOptions): string {
  const {
    surface,
    treatment = 'interface',
    layout = 'horizontal',
    supportLine = true,
    assetBase = '/brands/nextlevel',
  } = options;
  const tone = surface === 'light' ? 'clara' : 'escura';
  let relative: string;
  if (layout === 'symbol') {
    relative = treatment === 'mono'
      ? `logos/monocromaticas/monograma-${surface === 'light' ? 'positivo' : 'negativo'}.png`
      : treatment === 'prisma'
        ? `logos/monogramas/monograma-${surface === 'light' ? 'claro' : 'escuro'}.png`
        : 'logos/monogramas/monograma-flat.png';
  } else if (layout === 'vertical') {
    relative = `logos/vertical/logo-vertical-${tone}.png`;
  } else if (treatment === 'mono') {
    relative = `logos/monocromaticas/logo-${surface === 'light' ? 'positiva' : 'negativa'}.png`;
  } else if (!supportLine) {
    relative = `logos/sem-apoio/logo-${tone}.png`;
  } else {
    relative = `logos/${treatment === 'interface' ? 'flat' : 'prisma'}/logo-${tone}.png`;
  }
  return `${assetBase.replace(/\/$/, '')}/${relative}`;
}

// As opções são uma matriz limitada, não combinações de exports inexistentes.
// vertical usa as versões prisma; supportLine=false usa o export prisma sem apoio.
// mono + layout=symbol resolve o monograma monocromático entregue.
