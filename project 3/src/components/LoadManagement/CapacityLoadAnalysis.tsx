import { useState, useEffect } from 'react';
import { useMasterData } from '../../hooks/useMasterData';
import { fetchRFQs } from '../../lib/supabase';
import { fetchNominalCapacities, fetchLoadPerUnit } from '../../lib/capacity';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import WeekLoadPopup from './WeekLoadPopup';

type WeeklyLoad = {
  weekNumber: number;
  weekYear: number;
  startDate: Date;
  endDate: Date;
  loads: {
    [plantProcessId: string]: {
      total: number;
      details: Array<{
        rfqReference: string;
        planningStep: string;
        hours: number;
      }>;
    };
  };
};

type PlantProcess = {
  plant: string;
  process: string;
  capacity: number;
};

type PlantData = {
  plant: string;
  processes: PlantProcess[];
};

export default function CapacityLoadAnalysis() {
  const { masterData, loading: loadingMasterData } = useMasterData();
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [weeklyLoads, setWeeklyLoads] = useState<WeeklyLoad[]>([]);
  const [nominalCapacities, setNominalCapacities] = useState<Record<string, number>>({});
  const [loadPerUnit, setLoadPerUnit] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyLoad | null>(null);
  const [selectedPlantProcess, setSelectedPlantProcess] = useState<string | null>(null);
  const [plantProcesses, setPlantProcesses] = useState<PlantData[]>([]);

  useEffect(() => {
    if (masterData && selectedDivision) {
      const plants = masterData.PLANT.filter(plant => {
        const site = masterData.SITE.find(s => s.SITE_NAME === plant.SITE_NAME);
        return site && site.DIVISION_NAME === selectedDivision;
      });

      const processes = plants.map(plant => {
        const plantProcesses = masterData['EXISTING PROCESS']
          .filter(ep => ep.PLANT_NAME === plant.PLANT_NAME)
          .map(ep => ({
            plant: plant.PLANT_NAME,
            process: ep.STANDARD_PROCESS,
            capacity: getCapacity(plant.PLANT_NAME, ep.STANDARD_PROCESS)
          }));
        return {
          plant: plant.PLANT_NAME,
          processes: plantProcesses
        };
      });

      // Add corporate processes with 40h capacity
      const corporateName = `CORPORATE ${selectedDivision}`;
      processes.unshift({
        plant: corporateName,
        processes: [
          { plant: corporateName, process: 'CBOM/SPH', capacity: 40 },
          { plant: corporateName, process: 'COSTING', capacity: 40 },
          { plant: corporateName, process: 'PRICING', capacity: 40 }
        ]
      });

      setPlantProcesses(processes);
    }
  }, [masterData, selectedDivision, nominalCapacities]);

  useEffect(() => {
    loadData();
  }, [selectedDivision]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rfqs, capacities, loads] = await Promise.all([
        fetchRFQs(),
        fetchNominalCapacities(),
        fetchLoadPerUnit()
      ]);

      // Create nominal capacity lookup
      const nominalLookup: Record<string, number> = {};
      capacities.forEach(cap => {
        const process = masterData?.PROCESS.find(p => p.id === cap.process_id);
        const plant = masterData?.PLANT.find(p => p.id === cap.plant_id);
        if (process && plant) {
          nominalLookup[`${plant.PLANT_NAME}-${process.STANDARD_PROCESS}`] = cap.weekly_hours;
        }
      });
      setNominalCapacities(nominalLookup);

      // Create load per unit lookup
      const loadLookup: Record<string, number> = {};
      loads.forEach(load => {
        const process = masterData?.PROCESS.find(p => p.id === load.process_id);
        const plant = masterData?.PLANT.find(p => p.id === load.plant_id);
        if (process && plant) {
          loadLookup[`${plant.PLANT_NAME}-${process.STANDARD_PROCESS}`] = load.hours_per_unit;
        }
      });
      setLoadPerUnit(loadLookup);

      // Generate weeks and calculate loads
      const weeks = generateWeeks();
      const weeklyLoadData = calculateWeeklyLoads(weeks, rfqs, loadLookup);
      setWeeklyLoads(weeklyLoadData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  };

  const getCapacity = (plant: string, process: string) => {
    if (plant.toLowerCase().startsWith('corporate')) {
      return 40;
    }
    return nominalCapacities[`${plant}-${process}`] || 160;
  };

  const generateWeeks = () => {
    const weeks: WeeklyLoad[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { weekNum, weekYear } = getISOWeek(weekStart);

      weeks.push({
        weekNumber: weekNum,
        weekYear,
        startDate: weekStart,
        endDate: weekEnd,
        loads: {}
      });
    }

    return weeks;
  };

  const getISOWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return { weekNum, weekYear: d.getFullYear() };
  };

  const calculateWeeklyLoads = (weeks: WeeklyLoad[], rfqs: any[], loadPerUnitLookup: Record<string, number>) => {
    return weeks.map(week => {
      const weekLoad = { ...week, loads: {} };

      rfqs.forEach(rfq => {
        const pinDate = rfq.rfq_planning.find((p: any) => p.team === 'PIN')?.planned_date;
        const eoqDate = rfq.rfq_planning.find((p: any) => p.team === 'EOQ')?.planned_date;

        if (!pinDate || !eoqDate) return;

        const startDate = new Date(pinDate);
        const endDate = new Date(eoqDate);
        
        const totalWeeks = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

        if (week.startDate >= startDate && week.startDate <= endDate) {
          rfq.rfq_worksharing.forEach((ws: any) => {
            const plant = masterData?.PLANT.find(p => p.PLANT_NAME === ws.plant);
            if (!plant) return;

            const site = masterData?.SITE.find(s => s.SITE_NAME === plant.SITE_NAME);
            if (!site || site.DIVISION_NAME !== selectedDivision) return;

            const plantProcessKey = `${ws.plant}-${ws.process}`;
            const loadPerUnit = loadPerUnitLookup[plantProcessKey] || 0;
            const totalHours = ws.qty_to_quote * loadPerUnit;
            const weeklyLoad = totalHours / totalWeeks;

            if (!weekLoad.loads[plantProcessKey]) {
              weekLoad.loads[plantProcessKey] = { total: 0, details: [] };
            }

            weekLoad.loads[plantProcessKey].total += weeklyLoad;
            weekLoad.loads[plantProcessKey].details.push({
              rfqReference: rfq.reference,
              planningStep: `${ws.process} (${ws.qty_to_quote} pcs)`,
              hours: weeklyLoad
            });
          });
        }
      });

      return weekLoad;
    });
  };

  const hasLoad = (plant: string, process: string) => {
    return weeklyLoads.some(week => {
      const key = `${plant}-${process}`;
      return (week.loads[key]?.total || 0) > 0;
    });
  };

  const filteredPlantProcesses = plantProcesses
    .map(plantData => ({
      ...plantData,
      processes: plantData.processes.filter(process => 
        hasLoad(process.plant, process.process)
      )
    }))
    .filter(plantData => plantData.processes.length > 0);

  const handleWeekClick = (week: WeeklyLoad, plantProcessKey: string) => {
    setSelectedWeek(week);
    setSelectedPlantProcess(plantProcessKey);
  };

  const calculateAverageLoad = (plantProcessKey: string) => {
    let totalLoad = 0;
    let weeksWithLoad = 0;
    
    // Only consider first 7 weeks for average
    weeklyLoads.slice(0, 7).forEach(week => {
      const load = week.loads[plantProcessKey]?.total || 0;
      if (load > 0) {
        totalLoad += load;
        weeksWithLoad++;
      }
    });

    return weeksWithLoad > 0 ? totalLoad / weeksWithLoad : 0;
  };

  if (loadingMasterData || !masterData) {
    return <LoadingSpinner />;
  }

  const divisions = Array.from(new Set(
    masterData.SITE.map(site => site.DIVISION_NAME)
  )).sort();

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Division Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Capacity Load Analysis</h2>
        
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
      </div>

      {/* Load Chart */}
      {selectedDivision && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="relative overflow-x-auto">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-30 bg-gray-50">
                  <tr>
                    <th scope="col" className="sticky left-0 z-20 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Plant / Process
                    </th>
                    {weeklyLoads.map((week) => (
                      <th
                        key={`${week.weekYear}-${week.weekNumber}`}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]"
                      >
                        <div>Week {week.weekNumber}</div>
                        <div className="text-gray-400 font-normal">
                          {week.startDate.toLocaleDateString('fr-FR')}
                        </div>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 w-[140px]"
                    >
                      <div>Average</div>
                      <div className="text-gray-400 font-normal">(7 weeks)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlantProcesses.map((plantData) => (
                    plantData.processes.map((process, processIndex) => {
                      const key = `${process.plant}-${process.process}`;
                      const averageLoad = calculateAverageLoad(key);
                      const averageUtilization = process.capacity > 0 ? (averageLoad / process.capacity) * 100 : 0;

                      return (
                        <tr key={key} className={processIndex > 0 ? 'border-t border-gray-100' : ''}>
                          <td className="sticky left-0 bg-white z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-[200px]">
                            <div>{process.plant}</div>
                            <div className="text-xs text-gray-500">
                              {process.process} ({process.capacity.toFixed(1)}h/week)
                            </div>
                          </td>
                          {weeklyLoads.map((week) => {
                            const load = week.loads[key]?.total || 0;
                            const utilization = process.capacity > 0 ? (load / process.capacity) * 100 : 0;
                            return (
                              <td 
                                key={`${week.weekYear}-${week.weekNumber}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer hover:bg-gray-50 w-[140px]"
                                onClick={() => handleWeekClick(week, key)}
                              >
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>{load.toFixed(1)}h</span>
                                    <span>{Math.round(utilization)}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        utilization > 100 
                                          ? 'bg-red-500' 
                                          : utilization > 80 
                                            ? 'bg-yellow-500' 
                                            : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          {/* Average Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-gray-50 w-[140px]">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>{averageLoad.toFixed(1)}h</span>
                                <span>{Math.round(averageUtilization)}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    averageUtilization > 100 
                                      ? 'bg-red-500' 
                                      : averageUtilization > 80 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(averageUtilization, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                  {filteredPlantProcesses.length === 0 && (
                    <tr>
                      <td colSpan={weeklyLoads.length + 2} className="px-6 py-4 text-center text-sm text-gray-500">
                        No load data to display for the selected division
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Load Details Popup */}
      {selectedWeek && selectedPlantProcess && (
        <WeekLoadPopup
          isOpen={true}
          onClose={() => {
            setSelectedWeek(null);
            setSelectedPlantProcess(null);
          }}
          weekNumber={selectedWeek.weekNumber}
          weekYear={selectedWeek.weekYear}
          weekDates={{
            start: selectedWeek.startDate,
            end: selectedWeek.endDate
          }}
          details={selectedWeek.loads[selectedPlantProcess]?.details || []}
          totalHours={selectedWeek.loads[selectedPlantProcess]?.total || 0}
          capacity={getCapacity(...selectedPlantProcess.split('-'))}
        />
      )}
    </div>
  );
}