import { supabase } from './supabase';
import type { PlanningStep } from '../types';

export const fetchPlanningSteps = async (): Promise<PlanningStep[]> => {
  try {
    const { data, error } = await supabase
      .from('planning_steps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching planning steps:', error);
    throw error;
  }
};

export const savePlanningStep = async (step: Omit<PlanningStep, 'id' | 'created_at' | 'created_by' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('planning_steps')
      .insert([step])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving planning step:', error);
    throw error;
  }
};

export const updatePlanningStep = async (id: string, step: Partial<PlanningStep>) => {
  try {
    const { error } = await supabase
      .from('planning_steps')
      .update(step)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating planning step:', error);
    throw error;
  }
};

export const deletePlanningStep = async (id: string) => {
  try {
    const { error } = await supabase
      .from('planning_steps')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting planning step:', error);
    throw error;
  }
};