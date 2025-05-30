import React, { useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import CSS for daterangepicker globally
import 'daterangepicker/daterangepicker.css';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  className?: string;
}

export const DateRangePicker = ({ 
  value, 
  onChange, 
  disabled = false,
  className 
}: DateRangePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<any>(null);

  const formatDateRangeDisplay = (range: DateRange): string => {
    if (!range.from && !range.to) {
      return 'Select date range';
    }
    
    if (range.from && range.to) {
      if (range.from.getTime() === range.to.getTime()) {
        return format(range.from, "EEE, d MMM yyyy");
      }
      return `${format(range.from, "EEE, d MMM yyyy")} – ${format(range.to, "EEE, d MMM yyyy")}`;
    }
    
    if (range.from) {
      return format(range.from, "EEE, d MMM yyyy");
    }
    
    if (range.to) {
      return format(range.to, "EEE, d MMM yyyy");
    }
    
    return 'Select date range';
  };

  const initializeDateRangePicker = useCallback(async () => {
    if (!inputRef.current) return;

    // Dynamically import jQuery and daterangepicker
    const [{ default: $ }, { default: moment }] = await Promise.all([
      import('jquery'),
      import('moment')
    ]);

    // Import daterangepicker after jQuery is loaded
    await import('daterangepicker');

    const $input = $(inputRef.current);

    // Get current week (Monday to Sunday)
    const getCurrentWeek = () => {
      const now = moment();
      const startOfWeek = now.clone().startOf('isoWeek'); // Monday
      const endOfWeek = now.clone().endOf('isoWeek'); // Sunday
      return { start: startOfWeek, end: endOfWeek };
    };

    const currentWeek = getCurrentWeek();

    const config = {
      opens: 'left',
      drops: 'down',
      showDropdowns: true,
      showWeekNumbers: false,
      showISOWeekNumbers: false,
      timePicker: false,
      autoApply: false,
      locale: {
        format: 'ddd, D MMM YYYY',
        separator: ' – ',
        applyLabel: 'Apply',
        cancelLabel: 'Cancel',
        weekLabel: 'W',
        firstDay: 1, // Monday
      },
      startDate: value.from ? moment(value.from) : currentWeek.start,
      endDate: value.to ? moment(value.to) : currentWeek.end,
      maxDate: moment(), // Disable future dates
      ranges: {
        'Today': [moment(), moment()],
        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'This week': [currentWeek.start, currentWeek.end],
        'Last week': [
          moment().subtract(1, 'weeks').startOf('isoWeek'),
          moment().subtract(1, 'weeks').endOf('isoWeek')
        ],
        'Last 2 weeks': [
          moment().subtract(2, 'weeks').startOf('isoWeek'),
          moment().subtract(1, 'weeks').endOf('isoWeek')
        ],
        'This month': [moment().startOf('month'), moment().endOf('month')],
        'Last month': [
          moment().subtract(1, 'month').startOf('month'),
          moment().subtract(1, 'month').endOf('month')
        ]
      }
    };

    $input.daterangepicker(config);

    // Store reference to the picker
    pickerRef.current = $input.data('daterangepicker');

    // Handle apply event
    $input.on('apply.daterangepicker', (ev: any, picker: any) => {
      const newRange: DateRange = {
        from: picker.startDate.toDate(),
        to: picker.endDate.toDate()
      };
      onChange(newRange);
    });

    // Handle cancel event
    $input.on('cancel.daterangepicker', () => {
      // Revert to current value
      if (pickerRef.current) {
        pickerRef.current.setStartDate(value.from ? moment(value.from) : currentWeek.start);
        pickerRef.current.setEndDate(value.to ? moment(value.to) : currentWeek.end);
      }
    });

    // Custom click handler for deselection logic
    $input.on('show.daterangepicker', () => {
      setTimeout(() => {
        const $calendar = $('.daterangepicker');
        
        $calendar.off('click.customDeselect').on('click.customDeselect', 'td.available', function(e) {
          const clickedDate = moment($(this).attr('data-title'), 'r');
          
          if (!clickedDate.isValid()) return;
          
          const currentStart = pickerRef.current?.startDate;
          const currentEnd = pickerRef.current?.endDate;
          
          // Check if clicked date matches current selection
          const isClickedStart = currentStart && clickedDate.isSame(currentStart, 'day');
          const isClickedEnd = currentEnd && clickedDate.isSame(currentEnd, 'day');
          const isSingleDay = currentStart && currentEnd && currentStart.isSame(currentEnd, 'day');
          
          if (isClickedStart || isClickedEnd) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isSingleDay && (isClickedStart || isClickedEnd)) {
              // Clear both if it's a single day selection
              const emptyRange: DateRange = { from: undefined, to: undefined };
              onChange(emptyRange);
              pickerRef.current?.hide();
            } else if (isClickedStart && !isClickedEnd) {
              // Clear start date, keep end as new start
              const newRange: DateRange = {
                from: currentEnd?.toDate(),
                to: undefined
              };
              onChange(newRange);
              pickerRef.current?.hide();
            } else if (isClickedEnd && !isClickedStart) {
              // Clear end date, keep start
              const newRange: DateRange = {
                from: currentStart?.toDate(),
                to: undefined
              };
              onChange(newRange);
              pickerRef.current?.hide();
            }
          }
        });
      }, 100);
    });

    // Set initial display
    inputRef.current.value = formatDateRangeDisplay(value);

  }, [value, onChange]);

  useEffect(() => {
    if (!disabled) {
      initializeDateRangePicker();
    }

    return () => {
      if (pickerRef.current) {
        const $input = $(inputRef.current);
        $input.off('apply.daterangepicker cancel.daterangepicker show.daterangepicker');
        pickerRef.current.remove();
      }
    };
  }, [initializeDateRangePicker, disabled]);

  // Update display when value changes externally
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = formatDateRangeDisplay(value);
    }
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          readOnly
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "pl-10 cursor-pointer"
          )}
          placeholder="Select date range"
        />
        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
};
