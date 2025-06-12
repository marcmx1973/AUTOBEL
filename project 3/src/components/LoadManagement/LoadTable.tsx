import { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { fetchRFQs } from '../../lib/supabase';
import { fetchLoadPerUnit } from '../../lib/capacity';
import { useMasterData } from '../../hooks/useMasterData';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

type LoadTableRow = {
  reference: string;
  planningStep: string;
  plant: string;
  qtyParts: number;
  loadPerUnit: number;
  hours: number;
  startDate: string;
  endDate: string;
  division?: string;
};

type SortConfig = {
  key: keyof LoadTableRow;
  direction: 'asc' | 'desc';
} | null;

const CORPORATE_STEPS = ['CBOM/SPH', 'COSTING', 'PRICING'] as const;

export default function LoadTable() {
  const { masterData, loading: loadingMasterData } = useMasterData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadData, setLoadData] = useState<LoadTableRow[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    if (masterData) {
      loadQuotations();
    }
  }, [masterData]);

  const getStakeholderDivision = (stakeholderName: string | undefined): string | undefined => {
    if (!stakeholderName || !masterData) return undefined;

    const stakeholder = masterData.STAKEHOLDER.find(s => s.STAKEHOLDER_NAME === stakeholderName);
    if (!stakeholder) return undefined;

    const plant = masterData.PLANT.find(p => p.PLANT_NAME === stakeholder.PLANT_NAME);
    if (!plant) return undefined;

    const site = masterData.SITE.find(s => s.SITE_NAME === plant.SITE_NAME);
    if (!site) return undefined;

    return site.DIVISION_NAME;
  };

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const [rfqs, loadPerUnitData] = await Promise.all([
        fetchRFQs(),
        fetchLoadPerUnit()
      ]);
      
      // Create load per unit lookup
      const loadPerUnitLookup: Record<string, number> = {};
      loadPerUnitData.forEach(load => {
        const process = masterData?.PROCESS.find(p => p.id === load.process_id);
        const plant = masterData?.PLANT.find(p => p.id === load.plant_id);
        if (process && plant) {
          loadPerUnitLookup[`${plant.PLANT_NAME}-${process.STANDARD_PROCESS}`] = load.hours_per_unit;
        }
      });

      // Filter RFQs in PROPOSAL status
      const proposalRfqs = rfqs.filter(rfq => rfq.phase_status === 'PROPOSAL');
      
      // Transform RFQs into load table rows
      const rows: LoadTableRow[] = [];
      
      proposalRfqs.forEach(rfq => {
        // Get planning dates
        const bluPlanning = rfq.rfq_planning.find(p => p.team === 'BLU');
        const pinPlanning = rfq.rfq_planning.find(p => p.team === 'PIN');
        const eoqPlanning = rfq.rfq_planning.find(p => p.team === 'EOQ');
        const grePlanning = rfq.rfq_planning.find(p => p.team === 'GRE');

        // Calculate total pieces
        const totalPieces = rfq.total_qty_to_quote;

        // Get proposal leader's division
        const proposalLeaderDivision = getStakeholderDivision(rfq.proposal_leader);
        const corporateDivision = proposalLeaderDivision || 'UNKNOWN';

        // Always add corporate planning steps
        rows.push(
          // CBOM/SPH Step
          {
            reference: rfq.reference,
            planningStep: 'CBOM/SPH',
            plant: `CORPORATE ${corporateDivision}`,
            qtyParts: totalPieces,
            loadPerUnit: totalPieces === 0 ? 20 : 0.5,
            hours: totalPieces === 0 ? 20 : totalPieces * 0.5,
            startDate: bluPlanning?.planned_date || '',
            endDate: pinPlanning?.planned_date || '',
            division: corporateDivision
          },

          // COSTING Step
          {
            reference: rfq.reference,
            planningStep: 'COSTING',
            plant: `CORPORATE ${corporateDivision}`,
            qtyParts: totalPieces,
            loadPerUnit: calculateCostingHours(totalPieces) / Math.max(1, totalPieces),
            hours: calculateCostingHours(totalPieces),
            startDate: pinPlanning?.planned_date || '',
            endDate: eoqPlanning?.planned_date || '',
            division: corporateDivision
          },

          // PRICING Step
          {
            reference: rfq.reference,
            planningStep: 'PRICING',
            plant: `CORPORATE ${corporateDivision}`,
            qtyParts: totalPieces,
            loadPerUnit: calculateCostingHours(totalPieces) / Math.max(1, totalPieces),
            hours: calculateCostingHours(totalPieces),
            startDate: eoqPlanning?.planned_date || '',
            endDate: grePlanning?.planned_date || '',
            division: corporateDivision
          }
        );

        // Add rows for each worksharing entry
        rfq.rfq_worksharing.forEach(ws => {
          // Get plant's division
          const plant = masterData?.PLANT.find(p => p.PLANT_NAME === ws.plant);
          if (!plant) return;

          const site = masterData?.SITE.find(s => s.SITE_NAME === plant.SITE_NAME);
          if (!site) return;

          // Get load per unit for this process/plant combination
          const loadPerUnit = loadPerUnitLookup[`${ws.plant}-${ws.process}`] || 0;
          const totalHours = ws.qty_to_quote * loadPerUnit;

          rows.push({
            reference: rfq.reference,
            planningStep: ws.process,
            plant: ws.plant,
            qtyParts: ws.qty_to_quote,
            loadPerUnit: loadPerUnit,
            hours: totalHours,
            startDate: pinPlanning?.planned_date || '',
            endDate: eoqPlanning?.planned_date || '',
            division: site.DIVISION_NAME
          });
        });
      });

      setLoadData(rows);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setError('Failed to load quotation data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCostingHours = (totalPieces: number): number => {
    if (totalPieces === 0) return 20;
    if (totalPieces <= 10) return 16;
    if (totalPieces <= 50) return 32;
    if (totalPieces <= 250) return 50;
    if (totalPieces <= 999) return 80;
    return 160;
  };

  const handleSort = (key: keyof LoadTableRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedData = [...loadData].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];

    // Handle date fields
    if (key === 'startDate' || key === 'endDate') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    // Handle numeric fields
    if (key === 'qtyParts' || key === 'loadPerUnit' || key === 'hours') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key: keyof LoadTableRow) => {
    if (sortConfig?.key === key) {
      return (
        <ArrowUpDown 
          size={16} 
          className={`inline ml-1 transform ${
            sortConfig.direction === 'desc' ? 'rotate-180' : ''
          }`} 
        />
      );
    }
    return <ArrowUpDown size={16} className="inline ml-1 text-gray-300" />;
  };

  if (loading || loadingMasterData) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Load Table</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('reference')}
              >
                <div className="flex items-center">
                  Reference
                  {getSortIcon('reference')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('planningStep')}
              >
                <div className="flex items-center">
                  Planning Step
                  {getSortIcon('planningStep')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('plant')}
              >
                <div className="flex items-center">
                  Plant
                  {getSortIcon('plant')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('division')}
              >
                <div className="flex items-center">
                  Division
                  {getSortIcon('division')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('qtyParts')}
              >
                <div className="flex items-center">
                  Qty Parts
                  {getSortIcon('qtyParts')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('loadPerUnit')}
              >
                <div className="flex items-center">
                  Load/Unit
                  {getSortIcon('loadPerUnit')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('hours')}
              >
                <div className="flex items-center">
                  Hours
                  {getSortIcon('hours')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center">
                  Start Date
                  {getSortIcon('startDate')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('endDate')}
              >
                <div className="flex items-center">
                  End Date
                  {getSortIcon('endDate')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr 
                key={`${row.reference}-${row.planningStep}-${index}`}
                className={CORPORATE_STEPS.includes(row.planningStep as typeof CORPORATE_STEPS[number]) ? 'bg-gray-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.planningStep}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.plant}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.division || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.qtyParts}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.loadPerUnit.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.hours.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.startDate ? new Date(row.startDate).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.endDate ? new Date(row.endDate).toLocaleDateString('fr-FR') : '-'}
                </td>
              </tr>
            ))}
            {loadData.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                  No quotations in PROPOSAL status found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}