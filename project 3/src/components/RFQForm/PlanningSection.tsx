import { type TeamType } from '../../types';
import { TEAMS } from '../../constants';
import { calculateRemainingDays, validateDateOrder } from '../../utils/date';

type PlanningDates = Record<TeamType, { planned: string; actual: string }>;

type PlanningSectionProps = {
  planningDates: PlanningDates;
  onDateChange: (team: TeamType, type: 'planned' | 'actual', value: string) => void;
};

export default function PlanningSection({ planningDates, onDateChange }: PlanningSectionProps) {
  const getCurrentTeam = () => {
    const teamOrder: TeamType[] = ['BLU', 'PIN', 'EOQ', 'GRE', 'RED'];
    
    for (const team of teamOrder) {
      if (!planningDates[team].actual) {
        return team;
      }
    }
    
    return null;
  };

  const handleDateChange = (team: TeamType, type: 'planned' | 'actual', value: string) => {
    const teamOrder: TeamType[] = ['BLU', 'PIN', 'EOQ', 'GRE', 'RED'];
    
    if (value && !validateDateOrder(team, value, type, teamOrder, planningDates)) {
      alert(`La date ${type === 'planned' ? 'planifiée' : 'réelle'} doit être postérieure à celle de l'équipe précédente${type === 'actual' ? ' et ne peut pas être dans le futur' : ''}`);
      return;
    }

    onDateChange(team, type, value);
  };

  const currentTeam = getCurrentTeam();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Planning</h2>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Next:</span>
          <span className={`font-medium ${
            currentTeam ? TEAMS[currentTeam].color.replace('bg-', 'text-').replace('-100', '-600') : ''
          }`}>
            {currentTeam ? TEAMS[currentTeam].name : 'COMPLETED'}
          </span>
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-24 px-2 py-1 text-left text-xs font-medium text-gray-500">
                DATES
              </th>
              {Object.entries(TEAMS).map(([key, team]) => (
                <th key={key} className={`px-2 py-1 text-left text-xs font-medium ${team.color}`}>
                  {team.name.replace(' team', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="px-2 py-1 font-medium text-xs text-gray-500">Planned</td>
              {(Object.keys(TEAMS) as TeamType[]).map((team) => (
                <td key={team} className="px-2 py-1">
                  <input
                    type="date"
                    value={planningDates[team].planned}
                    onChange={(e) => handleDateChange(team, 'planned', e.target.value)}
                    className="w-full h-7 px-1 text-xs rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1 font-medium text-xs text-gray-500">Actual</td>
              {(Object.keys(TEAMS) as TeamType[]).map((team) => (
                <td key={team} className="px-2 py-1">
                  <input
                    type="date"
                    value={planningDates[team].actual}
                    onChange={(e) => handleDateChange(team, 'actual', e.target.value)}
                    className="w-full h-7 px-1 text-xs rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-1 font-medium text-xs text-gray-500">Days</td>
              {(Object.keys(TEAMS) as TeamType[]).map((team) => {
                const remainingDays = calculateRemainingDays(
                  planningDates[team].planned,
                  planningDates[team].actual
                );
                return (
                  <td key={team} className="px-2 py-1">
                    {remainingDays !== null && (
                      <span className={`text-sm font-bold ${
                        remainingDays > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {remainingDays}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}