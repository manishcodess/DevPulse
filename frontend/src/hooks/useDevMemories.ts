import { useState, useEffect, useCallback } from 'react';
import { fetchMemories, addMemory, deleteMemory, updateProfileInsights } from '../services/memoryService';
import { DevMemory, ToastFn, UserCredentials } from '../types';

export function useDevMemories(showToast?: ToastFn, userCredentials?: UserCredentials | null) {
  const [memories, setMemories] = useState<DevMemory[]>([]);
  const [targetRole, setTargetRole] = useState<string>(userCredentials?.targetRole || '');
  const [targetCompanies, setTargetCompanies] = useState<string[]>(userCredentials?.targetCompanies || []);
  const [preferredLanguage, setPreferredLanguage] = useState<string>(userCredentials?.preferredLanguage || '');
  const [loading, setLoading] = useState<boolean>(false);

  const loadMemories = useCallback(async () => {
    if (!userCredentials?.id && !userCredentials?._id && !userCredentials?.name) return;
    setLoading(true);
    try {
      const data = await fetchMemories();
      if (data.devMemories) {
        setMemories(data.devMemories);
      }
      if (data.targetRole !== undefined) setTargetRole(data.targetRole);
      if (data.targetCompanies !== undefined) setTargetCompanies(data.targetCompanies);
      if (data.preferredLanguage !== undefined) setPreferredLanguage(data.preferredLanguage);
    } catch (err: any) {
      console.warn('Could not fetch dev memories:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userCredentials]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleAddMemory = async (text: string, category = 'general'): Promise<boolean> => {
    if (!text.trim()) return false;
    try {
      const result = await addMemory(text.trim(), category);
      if (result.devMemories) {
        setMemories(result.devMemories);
      }
      if (showToast) showToast('AI Memory added successfully!', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to add memory:', err);
      if (showToast) showToast(err.message || 'Failed to add memory', 'error');
      return false;
    }
  };

  const handleDeleteMemory = async (memoryId: string): Promise<void> => {
    try {
      const result = await deleteMemory(memoryId);
      if (result.devMemories) {
        setMemories(result.devMemories);
      } else {
        setMemories(prev => prev.filter(m => m._id !== memoryId));
      }
      if (showToast) showToast('Insight removed from AI memory', 'info');
    } catch (err: any) {
      console.error('Failed to delete memory:', err);
      if (showToast) showToast(err.message || 'Failed to delete memory', 'error');
    }
  };

  const handleUpdateInsights = async (insights: {
    targetRole?: string;
    targetCompanies?: string[];
    preferredLanguage?: string;
  }): Promise<boolean> => {
    try {
      const result = await updateProfileInsights(insights);
      if (result.targetRole !== undefined) setTargetRole(result.targetRole);
      if (result.targetCompanies !== undefined) setTargetCompanies(result.targetCompanies);
      if (result.preferredLanguage !== undefined) setPreferredLanguage(result.preferredLanguage);
      if (showToast) showToast('Career targets updated!', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to update insights:', err);
      if (showToast) showToast(err.message || 'Failed to update insights', 'error');
      return false;
    }
  };

  return {
    memories,
    targetRole,
    targetCompanies,
    preferredLanguage,
    loading,
    refreshMemories: loadMemories,
    handleAddMemory,
    handleDeleteMemory,
    handleUpdateInsights,
  };
}

