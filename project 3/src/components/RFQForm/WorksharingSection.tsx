import { Plus, Trash2 } from 'lucide-react';
import { type MasterDataType } from '../../types';

type WorksharingLine = {
  process: string;
  plant: string;
  qty_to_quote: number;
};

type WorksharingSectionProps = {
  masterData: MasterDataType;
  worksharingLines: WorksharingLine[];
  totalQtyToQuote: number;
  onAddLine: () => void;
  onUpdateLine: (index: number, field: keyof WorksharingLine, value: string | number) => void;
  onRemoveLine?: (index: number) => void;
};

export default function WorksharingSection({
  masterData,
  worksharingLines,
  totalQtyToQuote,
  onAddLine,
  onUpdateLine,
  onRemoveLine
}: WorksharingSectionProps) {
  const getAvailablePlants = (process: string) => {
    return masterData['EXISTING PROCESS']
      .filter(ep => ep.STANDARD_PROCESS === process)
      .map(ep => ep.PLANT_NAME);
  };

  const calculateRemainingQty = () => {
    const totalAllocated = worksharingLines.reduce((sum, line) => sum + line.qty_to_quote, 0);
    return totalQtyToQuote - totalAllocated;
  };

  const remainingQty = calculateRemainingQty();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Worksharing</h2>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-50 px-3 py-1 rounded text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="ml-1 font-medium">{totalQtyToQuote}</span>
          </div>
          <button
            type="button"
            onClick={onAddLine}
            className="flex items-center px-2 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
            disabled={worksharingLines.length >= 8}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Line
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1 bg-gray-50 rounded text-xs font-medium text-gray-600">
          <div className="col-span-5">Process</div>
          <div className="col-span-5">Plant</div>
          <div className="col-span-2">Qty</div>
        </div>

        {/* Lines */}
        {worksharingLines.map((line, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center group">
            <div className="col-span-5">
              <select
                value={line.process}
                onChange={(e) => onUpdateLine(index, 'process', e.target.value)}
                className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              >
                <option value="">Select process</option>
                {masterData.PROCESS.map((process) => (
                  <option key={process.id} value={process.STANDARD_PROCESS}>
                    {process.STANDARD_PROCESS}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-5">
              <select
                value={line.plant}
                onChange={(e) => onUpdateLine(index, 'plant', e.target.value)}
                className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                disabled={!line.process}
              >
                <option value="">Select plant</option>
                {getAvailablePlants(line.process).map((plant) => (
                  <option key={plant} value={plant}>
                    {plant}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-center space-x-1">
              <input
                type="number"
                min="0"
                value={line.qty_to_quote}
                onChange={(e) => onUpdateLine(index, 'qty_to_quote', parseInt(e.target.value) || 0)}
                className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
              {onRemoveLine && (
                <button
                  type="button"
                  onClick={() => onRemoveLine(index)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="flex justify-between items-center pt-2 mt-2 border-t text-sm">
          <span className="font-medium text-gray-600">Remaining:</span>
          <span className={`font-bold ${remainingQty !== 0 ? 'text-red-600' : 'text-green-600'}`}>
            {remainingQty}
          </span>
        </div>
      </div>
    </div>
  );
}