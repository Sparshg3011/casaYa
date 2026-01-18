'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await apiService.tenants.getNotes() as ApiResponse<Note[]>;
        setNotes(response.data || []);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}