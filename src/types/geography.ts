/**
 * GhanaBuild 2.0 Geographic & Administrative Reference Data
 * 16 Regions of Ghana, representative MMDCE Districts, and Local Communities.
 */

export interface RegionData {
  id: string;
  name: string;
  code: string;
  capital: string;
  slug?: string;
}

export interface DistrictData {
  id: string;
  region_id: string;
  name: string;
  district_type: 'Metropolitan' | 'Municipal' | 'District';
  capital?: string;
  slug?: string;
}

export interface CommunityData {
  id: string;
  district_id: string;
  name: string;
}

export const GHANA_REGIONS: RegionData[] = [
  { id: 'REG-GAR-01', name: 'Greater Accra', code: 'GAR', capital: 'Accra' },
  { id: 'REG-ASHANTI-01', name: 'Ashanti', code: 'ASH', capital: 'Kumasi' },
  { id: 'REG-WR-01', name: 'Western', code: 'WR', capital: 'Sekondi-Takoradi' },
  { id: 'REG-WN-01', name: 'Western North', code: 'WN', capital: 'Sefwi Wiawso' },
  { id: 'REG-CR-01', name: 'Central', code: 'CR', capital: 'Cape Coast' },
  { id: 'REG-ER-01', name: 'Eastern', code: 'ER', capital: 'Koforidua' },
  { id: 'REG-VOLTA-01', name: 'Volta', code: 'VR', capital: 'Ho' },
  { id: 'REG-OTI-01', name: 'Oti', code: 'OR', capital: 'Dambai' },
  { id: 'REG-NR-01', name: 'Northern', code: 'NR', capital: 'Tamale' },
  { id: 'REG-SR-01', name: 'Savannah', code: 'SR', capital: 'Damongo' },
  { id: 'REG-NE-01', name: 'North East', code: 'NE', capital: 'Nalerigu' },
  { id: 'REG-UE-01', name: 'Upper East', code: 'UE', capital: 'Bolgatanga' },
  { id: 'REG-UW-01', name: 'Upper West', code: 'UW', capital: 'Wa' },
  { id: 'REG-BR-01', name: 'Bono', code: 'BR', capital: 'Sunyani' },
  { id: 'REG-BE-01', name: 'Bono East', code: 'BE', capital: 'Techiman' },
  { id: 'REG-AH-01', name: 'Ahafo', code: 'AH', capital: 'Goaso' },
];

export const GHANA_DISTRICTS: DistrictData[] = [
  // Greater Accra
  { id: 'DIST-ACCRA-METRO', region_id: 'REG-GAR-01', name: 'Accra Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-TEMA-METRO', region_id: 'REG-GAR-01', name: 'Tema Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-GA-EAST', region_id: 'REG-GAR-01', name: 'Ga East Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-GA-SOUTH', region_id: 'REG-GAR-01', name: 'Ga South Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-KROWOR', region_id: 'REG-GAR-01', name: 'Krowor Municipal Assembly', district_type: 'Municipal' },

  // Ashanti
  { id: 'DIST-KUMASI-METRO', region_id: 'REG-ASHANTI-01', name: 'Kumasi Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-ASOKWA', region_id: 'REG-ASHANTI-01', name: 'Asokwa Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-EJISU', region_id: 'REG-ASHANTI-01', name: 'Ejisu Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-OBUASI', region_id: 'REG-ASHANTI-01', name: 'Obuasi Municipal Assembly', district_type: 'Municipal' },

  // Western
  { id: 'DIST-STMA', region_id: 'REG-WR-01', name: 'Sekondi-Takoradi Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-TARKWA-NSUAEM', region_id: 'REG-WR-01', name: 'Tarkwa-Nsuaem Municipal Assembly', district_type: 'Municipal' },

  // Central
  { id: 'DIST-CAPE-COAST', region_id: 'REG-CR-01', name: 'Cape Coast Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-KOMENDA-EDINA', region_id: 'REG-CR-01', name: 'Komenda-Edina-Eguafo-Abirem Municipal', district_type: 'Municipal' },

  // Eastern
  { id: 'DIST-NEW-JUABEN', region_id: 'REG-ER-01', name: 'New Juaben South Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-AKUAPEM-NORTH', region_id: 'REG-ER-01', name: 'Akuapem North Municipal Assembly', district_type: 'Municipal' },

  // Volta
  { id: 'DIST-HO-01', region_id: 'REG-VOLTA-01', name: 'Ho Municipal Assembly', district_type: 'Municipal' },
  { id: 'DIST-KETA-01', region_id: 'REG-VOLTA-01', name: 'Keta Municipal Assembly', district_type: 'Municipal' },

  // Northern
  { id: 'DIST-TAMALE-METRO', region_id: 'REG-NR-01', name: 'Tamale Metropolitan Assembly', district_type: 'Metropolitan' },
  { id: 'DIST-SAGNARIGU-01', region_id: 'REG-NR-01', name: 'Sagnarigu Municipal Assembly', district_type: 'Municipal' },

  // Upper East
  { id: 'DIST-BOLGA-01', region_id: 'REG-UE-01', name: 'Bolgatanga Municipal Assembly', district_type: 'Municipal' },

  // Upper West
  { id: 'DIST-WA-01', region_id: 'REG-UW-01', name: 'Wa Municipal Assembly', district_type: 'Municipal' },

  // Bono
  { id: 'DIST-SUNYANI-01', region_id: 'REG-BR-01', name: 'Sunyani Municipal Assembly', district_type: 'Municipal' },

  // Bono East
  { id: 'DIST-TECHIMAN-01', region_id: 'REG-BE-01', name: 'Techiman Municipal Assembly', district_type: 'Municipal' },
];

export const GHANA_COMMUNITIES: CommunityData[] = [
  // Accra Metro
  { id: 'COMM-ACC-01', district_id: 'DIST-ACCRA-METRO', name: 'Jamestown' },
  { id: 'COMM-ACC-02', district_id: 'DIST-ACCRA-METRO', name: 'Osu Klottey' },
  { id: 'COMM-ACC-03', district_id: 'DIST-ACCRA-METRO', name: 'Adabraka' },
  { id: 'COMM-ACC-04', district_id: 'DIST-ACCRA-METRO', name: 'Makola / Central Business District' },
  { id: 'COMM-ACC-05', district_id: 'DIST-ACCRA-METRO', name: 'Ridge' },

  // Tema Metro
  { id: 'COMM-TEMA-01', district_id: 'DIST-TEMA-METRO', name: 'Community 1 Commercial Centre' },
  { id: 'COMM-TEMA-02', district_id: 'DIST-TEMA-METRO', name: 'Tema Harbour Industrial Area' },

  // Kumasi Metro
  { id: 'COMM-KUM-01', district_id: 'DIST-KUMASI-METRO', name: 'Bantama' },
  { id: 'COMM-KUM-02', district_id: 'DIST-KUMASI-METRO', name: 'Adum Central' },
  { id: 'COMM-KUM-03', district_id: 'DIST-KUMASI-METRO', name: 'Asafo' },
  { id: 'COMM-KUM-04', district_id: 'DIST-KUMASI-METRO', name: 'Nhyiaeso' },

  // Sekondi-Takoradi
  { id: 'COMM-STMA-01', district_id: 'DIST-STMA', name: 'Takoradi Market Circle' },
  { id: 'COMM-STMA-02', district_id: 'DIST-STMA', name: 'Sekondi Old Town' },

  // Tamale Metro
  { id: 'COMM-TAM-01', district_id: 'DIST-TAMALE-METRO', name: 'Tamale Central' },
  { id: 'COMM-TAM-02', district_id: 'DIST-TAMALE-METRO', name: 'Aboabo' },

  // Sagnarigu
  { id: 'COMM-SAG-01', district_id: 'DIST-SAGNARIGU-01', name: 'Choggu' },
  { id: 'COMM-SAG-02', district_id: 'DIST-SAGNARIGU-01', name: 'Kanvili' },

  // Ho Municipal
  { id: 'COMM-HO-01', district_id: 'DIST-HO-01', name: 'Bankoe' },
  { id: 'COMM-HO-02', district_id: 'DIST-HO-01', name: 'Ahoe' },
  { id: 'COMM-HO-03', district_id: 'DIST-HO-01', name: 'Kpodzi' },
];

export const PROJECT_CATEGORIES_DATA = [
  { id: 'CAT-ROADS', name: 'Roads & Highways', slug: 'roads', description: 'Trunk roads, urban bypasses, and feeder road rehabilitation', icon: 'Route' },
  { id: 'CAT-SCHOOLS', name: 'Education & Schools', slug: 'schools', description: 'Primary schools, STEM academies, and tertiary classroom blocks', icon: 'GraduationCap' },
  { id: 'CAT-HOSPITALS', name: 'Hospitals & Healthcare', slug: 'hospitals', description: 'District hospitals, Agenda 111 blocks, and surgical wards', icon: 'HeartPulse' },
  { id: 'CAT-HEALTH-CENTRES', name: 'CHPS Compounds & Clinics', slug: 'health-centres', description: 'Community Health Planning and Services compounds', icon: 'Stethoscope' },
  { id: 'CAT-MARKETS', name: 'Markets & Commerce', slug: 'markets', description: 'Modern commercial markets, lock-up stores, and transit stalls', icon: 'Store' },
  { id: 'CAT-WATER', name: 'Water & Piped Systems', slug: 'water', description: 'Small-town piped water systems, community boreholes, and treatment plants', icon: 'Droplets' },
  { id: 'CAT-SANITATION', name: 'Sanitation & Drainage', slug: 'sanitation', description: 'Storm drainage channels, recycling centers, and public sanitation blocks', icon: 'Trash2' },
  { id: 'CAT-ELECTRICITY', name: 'Rural Electrification & Power', slug: 'electricity', description: 'Grid extensions, transformer sub-stations, and solar mini-grids', icon: 'Zap' },
  { id: 'CAT-HOUSING', name: 'Affordable Housing', slug: 'housing', description: 'Civil servant accommodations and national housing projects', icon: 'Home' },
  { id: 'CAT-BRIDGES', name: 'Bridges & Culverts', slug: 'bridges', description: 'River crossings, footbridges, and heavy reinforced concrete culverts', icon: 'Landmark' },
  { id: 'CAT-AGRICULTURE', name: 'Agriculture & Irrigation', slug: 'agriculture', description: 'Dams, irrigation canals, processing centres, and warehouses', icon: 'Wheat' },
  { id: 'CAT-GOVT', name: 'Government & Civic Buildings', slug: 'government-buildings', description: 'District Assembly administrative blocks, police stations, and courts', icon: 'Building2' },
  { id: 'CAT-OTHER', name: 'Other Infrastructure', slug: 'other', description: 'Community parks, sports centers, and general infrastructure', icon: 'Layers' },
];
