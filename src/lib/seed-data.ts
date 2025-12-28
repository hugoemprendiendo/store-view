import type { Branch, Incident } from './types';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  return PlaceHolderImages.find((img) => img.id === id);
}

export function getInitialBranches(): Omit<Branch, 'id'>[] {
    return [
      { name: 'KFC Xalapa 1', region: 'Xalapa', brand: 'KFC', address: '123 Colonel St, Metropolis, USA', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'KFC Xalapa 2', region: 'Xalapa', brand: 'KFC', address: '789 Zinger Ln, Star City, USA', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'KFC Xalapa 3', region: 'Xalapa', brand: 'KFC', address: '212 Bucket Rd, Coast City, USA', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'KFC Xalapa 4', region: 'Xalapa', brand: 'KFC', address: '456 Gravy Ave, Gotham, USA', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'Dairy Queen Villa Magna', region: 'San Luis', brand: 'DQ', address: 'Av. Hernán Cortes, San Luis, SLP', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      { name: 'Dairy Queen Aconcagua', region: 'San Luis', brand: 'DQ', address: 'Aconcagua, San Luis, SLP', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'Dairy Queen Chapultepec', region: 'San Luis', brand: 'DQ', address: 'Chapultepec, San Luis, SLP', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'Dairy Queen - Centro', region: 'San Luis', brand: 'DQ', address: 'Av Himno Nacional, San Luis, SLP', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'Dairy Queen Sendero', region: 'San Luis', brand: 'DQ', address: 'Av Industrias, San Luis, SLP', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      // Merida
      { name: 'KFC Merida 1', region: 'Merida', brand: 'KFC', address: 'Calle 60, Merida, YUC', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'KFC Merida 2', region: 'Merida', brand: 'KFC', address: 'Paseo de Montejo, Merida, YUC', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'KFC Merida 3', region: 'Merida', brand: 'KFC', address: 'Av. Itzaes, Merida, YUC', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'KFC Merida 4', region: 'Merida', brand: 'KFC', address: 'Plaza Altabrisa, Merida, YUC', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      { name: 'KFC Merida 5', region: 'Merida', brand: 'KFC', address: 'Gran Plaza, Merida, YUC', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'DQ Merida 1', region: 'Merida', brand: 'DQ', address: 'City Center, Merida, YUC', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'DQ Merida 2', region: 'Merida', brand: 'DQ', address: 'Paseo 60, Merida, YUC', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'DQ Merida 3', region: 'Merida', brand: 'DQ', address: 'La Isla, Merida, YUC', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'DQ Merida 4', region: 'Merida', brand: 'DQ', address: 'Macroplaza, Merida, YUC', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'DQ Merida 5', region: 'Merida', brand: 'DQ', address: 'Galerias Merida, Merida, YUC', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      // Puebla
      { name: 'KFC Puebla 1', region: 'Puebla', brand: 'KFC', address: 'Angelopolis, Puebla, PUE', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'KFC Puebla 2', region: 'Puebla', brand: 'KFC', address: 'Zocalo, Puebla, PUE', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'KFC Puebla 3', region: 'Puebla', brand: 'KFC', address: 'Av. Juarez, Puebla, PUE', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'KFC Puebla 4', region: 'Puebla', brand: 'KFC', address: 'Plaza Dorada, Puebla, PUE', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'KFC Puebla 5', region: 'Puebla', brand: 'KFC', address: 'Galerias Serdan, Puebla, PUE', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'DQ Puebla 1', region: 'Puebla', brand: 'DQ', address: 'Explanada, Puebla, PUE', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      { name: 'DQ Puebla 2', region: 'Puebla', brand: 'DQ', address: 'Solesta, Puebla, PUE', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'DQ Puebla 3', region: 'Puebla', brand: 'DQ', address: 'Cruz del Sur, Puebla, PUE', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'DQ Puebla 4', region: 'Puebla', brand: 'DQ', address: 'Parque Puebla, Puebla, PUE', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'DQ Puebla 5', region: 'Puebla', brand: 'DQ', address: 'Plaza San Pedro, Puebla, PUE', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      // Veracruz
      { name: 'KFC Veracruz 1', region: 'Veracruz', brand: 'KFC', address: 'Plaza Las Americas, Boca del Rio, VER', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'KFC Veracruz 2', region: 'Veracruz', brand: 'KFC', address: 'Malecon, Veracruz, VER', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'KFC Veracruz 3', region: 'Veracruz', brand: 'KFC', address: 'Plaza Mocambo, Boca del Rio, VER', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'KFC Veracruz 4', region: 'Veracruz', brand: 'KFC', address: 'Av. Diaz Miron, Veracruz, VER', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      { name: 'KFC Veracruz 5', region: 'Veracruz', brand: 'KFC', address: 'Plaza Crystal, Veracruz, VER', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'KFC Veracruz 6', region: 'Veracruz', brand: 'KFC', address: 'Plaza El Dorado, Boca del Rio, VER', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'KFC Veracruz 7', region: 'Veracruz', brand: 'KFC', address: 'Av. Rafael Cuervo, Veracruz, VER', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'DQ Veracruz 1', region: 'Veracruz', brand: 'DQ', address: 'Plaza Andamar, Boca del Rio, VER', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'DQ Veracruz 2', region: 'Veracruz', brand: 'DQ', address: 'Plaza Vela, Boca del Rio, VER', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
      { name: 'DQ Veracruz 3', region: 'Veracruz', brand: 'DQ', address: 'Plaza Sol, Boca del Rio, VER', imageUrl: getImage('branch-4')?.imageUrl!, imageHint: getImage('branch-4')?.imageHint! },
      { name: 'DQ Veracruz 4', region: 'Veracruz', brand: 'DQ', address: 'Zocalo, Veracruz, VER', imageUrl: getImage('branch-5')?.imageUrl!, imageHint: getImage('branch-5')?.imageHint! },
      { name: 'DQ Veracruz 5', region: 'Veracruz', brand: 'DQ', address: 'Reforma, Veracruz, VER', imageUrl: getImage('branch-6')?.imageUrl!, imageHint: getImage('branch-6')?.imageHint! },
      { name: 'DQ Veracruz 6', region: 'Veracruz', brand: 'DQ', address: 'Costa de Oro, Boca del Rio, VER', imageUrl: getImage('branch-1')?.imageUrl!, imageHint: getImage('branch-1')?.imageHint! },
      { name: 'DQ Veracruz 7', region: 'Veracruz', brand: 'DQ', address: 'Plaza Rio, Boca del Rio, VER', imageUrl: getImage('branch-2')?.imageUrl!, imageHint: getImage('branch-2')?.imageHint! },
      { name: 'DQ Veracruz 8', region: 'Veracruz', brand: 'DQ', address: 'Av. Ejercito Mexicano, Boca del Rio, VER', imageUrl: getImage('branch-3')?.imageUrl!, imageHint: getImage('branch-3')?.imageHint! },
    ];
}

export function getInitialIncidents(branches: Branch[]): Omit<Incident, 'id' | 'createdAt'>[] {
    const xalapaKFC = branches.find(b => b.name === 'KFC Xalapa 1');
    const slpDQ = branches.find(b => b.name === 'Dairy Queen Villa Magna');
    const meridaKFC = branches.find(b => b.name === 'KFC Merida 1');

    const incidents: Omit<Incident, 'id' | 'createdAt'>[] = [];

    if (xalapaKFC) {
        incidents.push({
            title: 'Fuga de agua en el baño',
            branchId: xalapaKFC.id,
            description: 'Se reporta una fuga de agua constante en el baño de hombres, cerca del lavamanos.',
            photoUrl: getImage('incident-plumbing-1')?.imageUrl,
            photoHint: getImage('incident-plumbing-1')?.imageHint,
            category: 'Instalaciones',
            priority: 'Medium',
            status: 'Abierto',
        });
    }

    if (slpDQ) {
        incidents.push({
            title: 'Falla en máquina de helado',
            branchId: slpDQ.id,
            description: 'La máquina de helado suave no enfría correctamente y el producto sale derretido.',
            category: 'Equipo de Cocina',
            priority: 'High',
            status: 'En Progreso',
        });
    }
    
    if (meridaKFC) {
        incidents.push({
            title: 'Outlet quemado en la cocina',
            branchId: meridaKFC.id,
            description: 'El enchufe utilizado para la freidora de pollo principal está quemado y echando humo.',
            photoUrl: getImage('incident-electrical-1')?.imageUrl,
            photoHint: getImage('incident-electrical-1')?.imageHint,
            category: 'Instalaciones',
            priority: 'High',
            status: 'Abierto',
        });
    }

    return incidents;
}
