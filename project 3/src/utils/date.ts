export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const calculateRemainingDays = (planned: string, actual: string) => {
  if (!planned) return null;
  
  const plannedDate = new Date(planned);
  const compareDate = actual ? new Date(actual) : new Date();
  
  const diffTime = plannedDate.getTime() - compareDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const validateDateOrder = (
  team: string,
  date: string,
  type: 'planned' | 'actual',
  teamOrder: string[],
  planningDates: Record<string, { planned: string; actual: string }>
) => {
  const teamIndex = teamOrder.indexOf(team);
  const selectedDate = new Date(date);
  
  if (type === 'planned') {
    if (teamIndex > 0) {
      const prevTeam = teamOrder[teamIndex - 1];
      const prevPlannedDate = planningDates[prevTeam].planned;
      if (prevPlannedDate && new Date(prevPlannedDate) >= selectedDate) {
        return false;
      }
    }
  }
  
  if (type === 'actual') {
    if (selectedDate > new Date()) {
      return false;
    }
    
    if (teamIndex > 0) {
      const prevTeam = teamOrder[teamIndex - 1];
      const prevActualDate = planningDates[prevTeam].actual;
      if (prevActualDate && new Date(prevActualDate) >= selectedDate) {
        return false;
      }
    }
  }
  
  return true;
};