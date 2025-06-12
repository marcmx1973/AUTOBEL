import { X } from 'lucide-react';

type LoadDetail = {
  rfqReference: string;
  planningStep: string;
  hours: number;
};

type WeekLoadPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  weekYear: number;
  weekDates: { start: Date; end: Date };
  details: LoadDetail[];
  totalHours: number;
  capacity: number;
};

export default function WeekLoadPopup({ 
  isOpen, 
  onClose, 
  weekNumber,
  weekYear,
  weekDates,
  details,
  totalHours,
  capacity
}: WeekLoadPopupProps) {
  if (!isOpen) return null;

  // Sort details by hours in descending order
  const sortedDetails = [...details].sort((a, b) => b.hours - a.hours);
  const utilization = (totalHours / capacity) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Week {weekNumber} ({weekYear}) Load Details
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {weekDates.start.toLocaleDateString('fr-FR')} - {weekDates.end.toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {sortedDetails.map((detail, index) => {
              const percentage = (detail.hours / capacity) * 100;
              return (
                <div key={`${detail.rfqReference}-${index}`} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {detail.rfqReference} - {detail.planningStep}
                    </span>
                    <span className="text-gray-500">
                      {detail.hours.toFixed(1)}h ({percentage.toFixed(1)}% of capacity)
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded overflow-hidden">
                    <div 
                      className={`h-full ${
                        percentage > 100 
                          ? 'bg-red-500' 
                          : percentage > 80 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Load</span>
              <span>
                {totalHours.toFixed(1)} hours ({Math.round(utilization)}% of capacity)
              </span>
            </div>
            <div className="mt-2 h-4 bg-gray-100 rounded overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}