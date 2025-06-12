import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { useMasterData } from '../../hooks/useMasterData';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { fetchLoadPerUnit, saveLoadPerUnit, type LoadPerUnit } from '../../lib/capacity';

type LoadValue = {
  processId: string;
  plantId: string;
  value: number;
  saving?: boolean;
  saved?: boolean;
};

export default function LoadPerUnit() {
  const { masterData, loading: loadingMasterData } = useMasterData();
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loadValues, setLoadValues] = useState<LoadValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchLoadPerUnit();
        
        // Convert to our internal format
        const values = data.map(item => ({
          processId: item.process_id,
          plantId: item.plant_id,
          value: item.hours_per_unit
        }));
        
        setLoadValues(values);
      } catch (err) {
        console.error('Error loading load per unit values:', err);
        setError('Failed to load load per unit values');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    setSelectedSite('');
  }, [selectedDivision]);

  if (loadingMasterData || !masterData) {
    return <LoadingSpinner />;
  }

  // Get unique divisions
  const divisions = Array.from(new Set(
    masterData.SITE.map(site => site.DIVISION_NAME)
  )).sort();

  // Get sites for selected division
  const sites = masterData.SITE
    .filter(site => site.DIVISION_NAME === selectedDivision)
    .map(site => site.SITE_NAME)
    .sort();

  // Get plants and their processes for selected site
  const plantsAndProcesses = selectedSite ? 
    masterData['EXISTING PROCESS']
      .filter(ep => {
        const plant = masterData.PLANT.find(p => p.PLANT_NAME === ep.PLANT_NAME);
        return plant && plant.SITE_NAME === selectedSite;
      })
      .sort((a, b) => a.PLANT_NAME.localeCompare(b.PLANT_NAME)) : [];

  const getProcessId = (processName: string) => {
    const process = masterData.PROCESS.find(p => p.STANDARD_PROCESS === processName);
    if (!process) throw new Error(`Process not found: ${processName}`);
    return process.id;
  };

  const getPlantId = (plantName: string) => {
    const plant = masterData.PLANT.find(p => p.PLANT_NAME === plantName);
    if (!plant) throw new Error(`Plant not found: ${plantName}`);
    return plant.id;
  };

  const handleLoadValueChange = (processName: string, plantName: string, newValue: number) => {
    try {
      const processId = getProcessId(processName);
      const plantId = getPlantId(plantName);

      setLoadValues(prev => {
        const existingIndex = prev.findIndex(v => v.processId === processId && v.plantId === plantId);
        if (existingIndex >= 0) {
          const newValues = [...prev];
          newValues[existingIndex] = { 
            ...newValues[existingIndex], 
            value: newValue,
            saved: false 
          };
          return newValues;
        }
        return [...prev, { 
          processId, 
          plantId, 
          value: newValue,
          saved: false 
        }];
      });
    } catch (err) {
      console.error('Error updating load value:', err);
      setError(err instanceof Error ? err.message : 'Failed to update load value');
    }
  };

  const handleSave = async (processName: string, plantName: string) => {
    try {
      const processId = getProcessId(processName);
      const plantId = getPlantId(plantName);
      const value = getLoadValue(processName, plantName);

      // Update saving state
      setLoadValues(prev => prev.map(v => 
        v.processId === processId && v.plantId === plantId
          ? { ...v, saving: true }
          : v
      ));

      // Save to database
      await saveLoadPerUnit(processId, plantId, value);

      // Update saved state
      setLoadValues(prev => prev.map(v => 
        v.processId === processId && v.plantId === plantId
          ? { ...v, saving: false, saved: true }
          : v
      ));

      // Reset saved state after 2 seconds
      setTimeout(() => {
        setLoadValues(prev => prev.map(v => 
          v.processId === processId && v.plantId === plantId
            ? { ...v, saved: false }
            : v
        ));
      }, 2000);

    } catch (err) {
      console.error('Error saving load value:', err);
      setError(err instanceof Error ? err.message : 'Failed to save load value');
      
      // Reset saving state on error
      setLoadValues(prev => prev.map(v => 
        v.processId === processId && v.plantId === plantId
          ? { ...v, saving: false }
          : v
      ));
    }
  };

  const getLoadValue = (processName: string, plantName: string) => {
    try {
      const processId = getProcessId(processName);
      const plantId = getPlantId(plantName);
      return loadValues.find(v => v.processId === processId && v.plantId === plantId)?.value || 0;
    } catch {
      return 0;
    }
  };

  const getLoadState = (processName: string, plantName: string) => {
    try {
      const processId = getProcessId(processName);
      const plantId = getPlantId(plantName);
      return loadValues.find(v => v.processId === processId && v.plantId === plantId);
    } catch {
      return undefined;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Load per Unit (ROM Estimate)</h2>
        
        {/* Division Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Division
          </label>
          <div className="grid grid-cols-3 gap-4">
            {divisions.map((division) => (
              <label key={division} className={`
                flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${selectedDivision === division 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}
              `}>
                <input
                  type="radio"
                  name="division"
                  value={division}
                  checked={selectedDivision === division}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900">{division}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Site Selection */}
        {selectedDivision && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Site
            </label>
            <div className="grid grid-cols-4 gap-4">
              {sites.map((site) => (
                <label key={site} className={`
                  flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedSite === site 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}
                `}>
                  <input
                    type="radio"
                    name="site"
                    value={site}
                    checked={selectedSite === site}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">{site}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Load Values Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load per Unit (HRS)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedSite ? (
                plantsAndProcesses.map((process, index) => {
                  const loadState = getLoadState(process.STANDARD_PROCESS, process.PLANT_NAME);
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {process.PLANT_NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {process.STANDARD_PROCESS}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={getLoadValue(process.STANDARD_PROCESS, process.PLANT_NAME)}
                          onChange={(e) => handleLoadValueChange(
                            process.STANDARD_PROCESS,
                            process.PLANT_NAME,
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-24 px-2 py-1 text-sm rounded border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date().toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSave(process.STANDARD_PROCESS, process.PLANT_NAME)}
                          disabled={loadState?.saving || loadState?.saved}
                          className={`p-1 rounded ${
                            loadState?.saved
                              ? 'text-green-600'
                              : loadState?.saving
                              ? 'text-gray-400'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {loadState?.saved ? (
                            <Check size={18} />
                          ) : (
                            <Save size={18} className={loadState?.saving ? 'animate-pulse' : ''} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Select a site to view processes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}