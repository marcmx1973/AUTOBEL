export const validateRFQForm = (formData: {
  reference: string;
  round: string;
  opportunity: string;
  customer: string;
  program: string;
  total_qty_to_quote: number;
}) => {
  const errors: string[] = [];

  if (!formData.reference.trim()) errors.push('La référence est requise');
  if (!formData.round) errors.push('Le round est requis');
  if (!formData.opportunity.trim()) errors.push("L'opportunité est requise");
  if (!formData.customer) errors.push('Le client est requis');
  if (!formData.program) errors.push('Le programme est requis');
  if (formData.total_qty_to_quote <= 0) errors.push('La quantité totale doit être supérieure à 0');

  return errors;
};

export const validateWorksharing = (
  worksharingLines: Array<{ qty_to_quote: number }>,
  totalQtyToQuote: number
) => {
  const totalAllocated = worksharingLines.reduce((sum, line) => sum + line.qty_to_quote, 0);
  return totalAllocated <= totalQtyToQuote;
};