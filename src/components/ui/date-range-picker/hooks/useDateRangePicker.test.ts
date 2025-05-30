
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateRangePicker } from './useDateRangePicker';

// Mock date-fns functions
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    isSameDay: vi.fn((a: Date, b: Date) => a.getTime() === b.getTime()),
    isBefore: vi.fn((a: Date, b: Date) => a.getTime() < b.getTime()),
  };
});

describe('useDateRangePicker - handleDateClick', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should clear both dates when clicking single-day range', () => {
    const may12 = new Date(2024, 4, 12); // May 12, 2024
    const initialValue = { from: may12, to: may12 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    act(() => {
      result.current.handleDateClick(may12);
    });

    expect(result.current.tempRange).toEqual({ 
      from: undefined, 
      to: undefined 
    });
  });

  it('should keep end date when clicking start date', () => {
    const may10 = new Date(2024, 4, 10);
    const may20 = new Date(2024, 4, 20);
    const initialValue = { from: may10, to: may20 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    act(() => {
      result.current.handleDateClick(may10);
    });

    expect(result.current.tempRange).toEqual({ 
      from: undefined, 
      to: may20 
    });
  });

  it('should keep start date when clicking end date', () => {
    const may10 = new Date(2024, 4, 10);
    const may20 = new Date(2024, 4, 20);
    const initialValue = { from: may10, to: may20 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    act(() => {
      result.current.handleDateClick(may20);
    });

    expect(result.current.tempRange).toEqual({ 
      from: may10, 
      to: undefined 
    });
  });

  it('should promote remaining date to from when clearing creates invalid range', () => {
    const may20 = new Date(2024, 4, 20);
    const initialValue = { from: undefined, to: may20 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    const may10 = new Date(2024, 4, 10);
    
    act(() => {
      result.current.handleDateClick(may10);
    });

    expect(result.current.tempRange).toEqual({ 
      from: may10, 
      to: may20 
    });
  });

  it('should clear to when clicking same date as to', () => {
    const may20 = new Date(2024, 4, 20);
    const initialValue = { from: undefined, to: may20 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    act(() => {
      result.current.handleDateClick(may20);
    });

    expect(result.current.tempRange).toEqual({ 
      from: undefined, 
      to: undefined 
    });
  });

  it('should start new selection when clicking different date in existing range', () => {
    const may10 = new Date(2024, 4, 10);
    const may20 = new Date(2024, 4, 20);
    const may15 = new Date(2024, 4, 15);
    const initialValue = { from: may10, to: may20 };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    act(() => {
      result.current.handleDateClick(may15);
    });

    expect(result.current.tempRange).toEqual({ 
      from: may15, 
      to: undefined 
    });
  });

  it('should select first date when no dates are selected', () => {
    const initialValue = { from: undefined, to: undefined };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    const may10 = new Date(2024, 4, 10);
    
    act(() => {
      result.current.handleDateClick(may10);
    });

    expect(result.current.tempRange).toEqual({ 
      from: may10, 
      to: undefined 
    });
  });

  it('should complete range when clicking second date', () => {
    const may10 = new Date(2024, 4, 10);
    const initialValue = { from: may10, to: undefined };
    
    const { result } = renderHook(() => 
      useDateRangePicker(initialValue, mockOnChange)
    );

    const may20 = new Date(2024, 4, 20);
    
    act(() => {
      result.current.handleDateClick(may20);
    });

    expect(result.current.tempRange).toEqual({ 
      from: may10, 
      to: may20 
    });
  });
});
