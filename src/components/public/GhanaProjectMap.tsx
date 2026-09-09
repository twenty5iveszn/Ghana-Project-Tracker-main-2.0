import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ProjectStatus } from '../../types/project';
import { formatGHS } from '../../lib/utils';
import {
  Layers,
  MapPin,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowUpRight,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface MapProjectMarker {
  id: string;
  title: string;
  slug: string;
  category: { name: string; slug: string; icon: string | null };
  region: { id: string; name: string; code: string };
  district: { id: string; name: string };
  location_name: string;
  latitude: number;
  longitude: number;
  project_status: ProjectStatus;
  progress_percentage: number;
  budget: number;
  currency: string;
  contractor_name?: string | null;
  cover_image_url?: string | null;
  has_valid_coordinates: boolean;
}

interface GhanaProjectMapProps {
  height?: string;
  selectedRegion?: string;
  selectedCategory?: string;
  onProjectClick?: (slug: string) => void;
  interactiveFilters?: boolean;
}

export const GhanaProjectMap: React.FC<GhanaProjectMapProps> = ({
  height = '560px',
  selectedRegion = '',
  selectedCategory = '',
  onProjectClick,
  interactiveFilters = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [projects, setProjects] = useState<MapProjectMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState(selectedRegion);
  const [districtFilter, setDistrictFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory);
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected project for sidebar inspection
  const [selectedProject, setSelectedProject] = useState<MapProjectMarker | null>(null);

  // Geographic metadata options
  const [regionsList, setRegionsList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [unlocatedCount, setUnlocatedCount] = useState(0);

  // Ghana Geographic Bounds
  const GHANA_CENTER: [number, number] = [7.9465, -1.0232];
  const DEFAULT_ZOOM = 7;

  // Status color mapping
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'COMPLETED':
        return '#059669'; // emerald-600
      case 'ONGOING':
        return '#0284c7'; // sky-600
      case 'PLANNED':
        return '#d97706'; // amber-600
      case 'ON_HOLD':
        return '#ea580c'; // orange-600
      case 'ABANDONED':
      case 'CANCELLED':
        return '#dc2626'; // red-600
      default:
        return '#475569';
    }
  };

  // Fetch initial geography lists
  useEffect(() => {
    fetch('/api/geography/regions')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setRegionsList(resData.data);
      })
      .catch((err) => console.error('Failed to load regions:', err));

    fetch('/api/geography/categories')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setCategoriesList(resData.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch districts when region changes
  useEffect(() => {
    if (regionFilter) {
      fetch(`/api/geography/districts?region_id=${regionFilter}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) setDistrictsList(resData.data);
        })
        .catch((err) => console.error('Failed to load districts:', err));
    } else {
      setDistrictsList([]);
      setDistrictFilter('');
    }
  }, [regionFilter]);

  // Fetch map data from server
  const fetchMapMarkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (regionFilter) params.append('region', regionFilter);
      if (districtFilter) params.append('district', districtFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      if (progressFilter === '0-25') {
        params.append('min_progress', '0');
        params.append('max_progress', '25');
      } else if (progressFilter === '26-50') {
        params.append('min_progress', '26');
        params.append('max_progress', '50');
      } else if (progressFilter === '51-75') {
        params.append('min_progress', '51');
        params.append('max_progress', '75');
      } else if (progressFilter === '76-99') {
        params.append('min_progress', '76');
        params.append('max_progress', '99');
      } else if (progressFilter === '100') {
        params.append('min_progress', '100');
        params.append('max_progress', '100');
      }

      const res = await fetch(`/api/projects/map?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
        if (data.meta) {
          setUnlocatedCount(data.meta.unlocated || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load project map coordinates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapMarkers();
  }, [regionFilter, districtFilter, categoryFilter, statusFilter, progressFilter, searchQuery]);

  // Sync external filter props if they change
  useEffect(() => {
    if (selectedRegion !== regionFilter) setRegionFilter(selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedCategory !== categoryFilter) setCategoryFilter(selectedCategory);
  }, [selectedCategory]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: GHANA_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 6,
        maxZoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Clean, professional CartoDB Positron light tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      // Add custom scale
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on data change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (projects.length === 0) return;

    const bounds = L.latLngBounds([]);

    projects.forEach((prj) => {
      if (
        !prj.has_valid_coordinates ||
        typeof prj.latitude !== 'number' ||
        typeof prj.longitude !== 'number' ||
        isNaN(prj.latitude) ||
        isNaN(prj.longitude)
      ) {
        return;
      }

      const color = getStatusColor(prj.project_status);

      // Create distinctive SVG circle marker
      const customIcon = L.divIcon({
        className: 'custom-project-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            <span style="display:block; width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></span>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([prj.latitude, prj.longitude], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 240px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="background: #f1f5f9; color: #0f172a; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${prj.category.name}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: ${color};">
              ● ${prj.project_status}
            </span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3;">
            ${prj.title}
          </h4>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${prj.region.name} • ${prj.district.name || prj.location_name}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <span style="color: #64748b;">Budget:</span>
            <strong style="color: #0f172a;">${formatGHS(prj.budget)}</strong>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #64748b;">Progress:</span>
              <strong style="color: #0f172a;">${prj.progress_percentage}%</strong>
            </div>
            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
              <div style="width: ${prj.progress_percentage}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
          </div>
          <button id="map-inspect-${prj.id}" 
             style="display: block; width: 100%; text-align: center; background: #065f46; color: #ffffff; font-size: 11px; font-weight: 700; padding: 6px 0; border-radius: 6px; border: none; cursor: pointer;">
            Inspect Project Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 290 });

      marker.on('click', () => {
        setSelectedProject(prj);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-inspect-${prj.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            setSelectedProject(prj);
          };
        }
      });

      markersLayer.addLayer(marker);
      bounds.extend([prj.latitude, prj.longitude]);
    });

    // Fit bounds if markers exist
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [projects]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(GHANA_CENTER, DEFAULT_ZOOM);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const geocodedProjects = projects.filter((p) => p.has_valid_coordinates);
  const totalFilteredBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 flex flex-col">
      {/* Interactive Controls Overlay Header */}
      {interactiveFilters && (
        <div className="z-20 bg-white/95 backdrop-blur-md p-3 border-b border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search map by title or town..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Region Dropdown */}
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setDistrictFilter('');
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Regions</option>
              {regionsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* District Dropdown (enabled when region is selected) */}
            {districtsList.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Districts</option>
                {districtsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Sectors</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNED">Planned</option>
              <option value="ON_HOLD">On Hold</option>
            </select>

            {/* Progress Range Filter */}
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Any Progress</option>
              <option value="0-25">0% – 25%</option>
              <option value="26-50">26% – 50%</option>
              <option value="51-75">51% – 75%</option>
              <option value="76-99">76% – 99%</option>
              <option value="100">100% Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600 font-medium hidden sm:block">
              <span className="font-bold text-slate-900">{geocodedProjects.length}</span> Geotagged Sites •{' '}
              <span className="font-bold text-slate-900">{formatGHS(totalFilteredBudget)}</span>
            </div>

            <button
              onClick={() => {
                setRegionFilter('');
                setDistrictFilter('');
                setCategoryFilter('');
                setStatusFilter('');
                setProgressFilter('');
                setSearchQuery('');
                setSelectedProject(null);
                handleResetView();
              }}
              title="Reset Filters"
              className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 cursor-pointer flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative flex-1" style={{ minHeight: height }}>
        {/* Actual Map Canvas */}
        <div ref={mapContainerRef} style={{ height: '100%', minHeight: height, width: '100%' }} className="z-10" />

        {/* Floating Zoom & Centering Controls */}
        <div className="absolute bottom-5 right-5 z-[400] flex flex-col gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Recenter Ghana Map"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Status Color Legend */}
        <div className="absolute bottom-5 left-5 z-[400] hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-600 inline-block shadow-xs" /> Ongoing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600 inline-block shadow-xs" /> Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-600 inline-block shadow-xs" /> On Hold
          </span>
        </div>

        {/* Project Spatial Inspector Drawer */}
        {selectedProject && (
          <div className="absolute top-4 right-4 bottom-4 z-[400] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="space-y-4">
              {/* Header with Close */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {selectedProject.category.name}
                    </Badge>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedProject.project_status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedProject.project_status === 'ONGOING'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedProject.project_status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {selectedProject.title}
              </h3>

              {/* Geographic metadata */}
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {selectedProject.region.name} • {selectedProject.district.name || selectedProject.location_name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pl-5 font-mono">
                  GPS: {selectedProject.latitude?.toFixed(4)}, {selectedProject.longitude?.toFixed(4)}
                </div>
              </div>

              {/* Budget & Progress */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Budget
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {formatGHS(selectedProject.budget)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Physical Progress
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedProject.progress_percentage}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${selectedProject.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Contractor Entity */}
              {selectedProject.contractor_name && (
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400">Assigned Contractor: </span>
                  <strong className="text-slate-800">{selectedProject.contractor_name}</strong>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
              <Button
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5"
                onClick={() => {
                  if (onProjectClick) {
                    onProjectClick(selectedProject.slug || selectedProject.id);
                  } else {
                    window.location.href = `/projects/${selectedProject.slug || selectedProject.id}`;
                  }
                }}
              >
                <span>View Full Project Dossier</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-slate-600"
                onClick={() => setSelectedProject(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-[500] bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xl">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Querying verified infrastructure coordinates...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
