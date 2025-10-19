/**
 * Guests Filter Toolbar
 * Search-first layout with filters, quick toggles, saved views, and actions
 */

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, Download, Plus, Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import { Separator } from "../ui/separator";

export type FilterState = {
  search: string;
  status: string[];
  types: string[];
  alerts: string[];
  vipOnly: boolean;
  checkInFrom?: Date | null;
  checkInTo?: Date | null;
  sort: string;
};

const SAVED_VIEWS = [
  { id: "all", name: "All Guests", icon: "👥" },
  { id: "vip", name: "VIP Only", icon: "⭐" },
  { id: "onboard", name: "Currently Onboard", icon: "⛵" },
  { id: "expected", name: "Expected Arrivals", icon: "📅" },
];

const STATUS_OPTIONS = [
  { value: "onboard", label: "Onboard" },
  { value: "expected", label: "Expected" },
  { value: "departed", label: "Departed" },
];

const TYPE_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "vip", label: "VIP" },
  { value: "owner", label: "Owner" },
  { value: "crew-guest", label: "Crew Guest" },
];

const ALERT_OPTIONS = [
  { value: "allergy", label: "Allergies" },
  { value: "dietary", label: "Dietary Restrictions" },
  { value: "medical", label: "Medical Alerts" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "checkin-asc", label: "Check-in (Earliest)" },
  { value: "checkin-desc", label: "Check-in (Latest)" },
  { value: "cabin-asc", label: "Cabin (A-Z)" },
];

export default function GuestsToolbar({
  onFiltersChange,
  onExport,
  onAddGuest,
}: {
  onFiltersChange?: (s: FilterState) => void;
  onExport?: (s: FilterState) => void;
  onAddGuest?: () => void;
}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    types: [],
    alerts: [],
    vipOnly: false,
    checkInFrom: null,
    checkInTo: null,
    sort: "name-asc",
  });

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);

  // Emit changes to parent
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" focuses search
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById("guests-search-input")?.focus();
      }
      // "f" or "F" opens filters popover
      if ((e.key === "f" || e.key === "F") && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsFiltersOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayFilter = useCallback((key: "status" | "types" | "alerts", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }, []);

  const clearSearch = useCallback(() => {
    updateFilters({ search: "" });
  }, [updateFilters]);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: "",
      status: [],
      types: [],
      alerts: [],
      vipOnly: false,
      checkInFrom: null,
      checkInTo: null,
      sort: filters.sort, // Keep sort
    });
  }, [filters.sort]);

  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    if (key === "search" || key === "vipOnly") {
      updateFilters({ [key]: key === "search" ? "" : false });
    } else if (key === "checkInFrom" || key === "checkInTo") {
      updateFilters({ [key]: null });
    } else if (value && (key === "status" || key === "types" || key === "alerts")) {
      toggleArrayFilter(key, value);
    }
  }, [updateFilters, toggleArrayFilter]);

  const applySavedView = useCallback((viewId: string) => {
    switch (viewId) {
      case "vip":
        setFilters((prev) => ({ ...prev, vipOnly: true, status: [], types: ["vip", "owner"] }));
        break;
      case "onboard":
        setFilters((prev) => ({ ...prev, vipOnly: false, status: ["onboard"], types: [] }));
        break;
      case "expected":
        setFilters((prev) => ({ ...prev, vipOnly: false, status: ["expected"], types: [] }));
        break;
      default:
        clearAllFilters();
    }
    setIsSavedViewsOpen(false);
  }, [clearAllFilters]);

  // Active filter chips
  const activeFilters = [
    ...filters.status.map((s) => ({ key: "status", value: s, label: STATUS_OPTIONS.find((o) => o.value === s)?.label || s })),
    ...filters.types.map((t) => ({ key: "types", value: t, label: TYPE_OPTIONS.find((o) => o.value === t)?.label || t })),
    ...filters.alerts.map((a) => ({ key: "alerts", value: a, label: ALERT_OPTIONS.find((o) => o.value === a)?.label || a })),
    ...(filters.vipOnly ? [{ key: "vipOnly", value: "true", label: "VIP Only" }] : []),
    ...(filters.checkInFrom ? [{ key: "checkInFrom", value: "", label: `From: ${format(filters.checkInFrom, "MMM d")}` }] : []),
    ...(filters.checkInTo ? [{ key: "checkInTo", value: "", label: `To: ${format(filters.checkInTo, "MMM d")}` }] : []),
  ];

  const hasActiveFilters = activeFilters.length > 0 || filters.search;

  return (
    <div className="space-y-3">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search - Priority */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="guests-search-input"
            type="text"
            placeholder="Search name, cabin, allergy…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-9 pr-8"
            aria-label="Search guests"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <kbd className="absolute right-9 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border rounded bg-muted pointer-events-none hidden sm:inline-block">
            /
          </kbd>
        </div>

        {/* Quick Toggles - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant={filters.status.includes("onboard") ? "default" : "outline"}
            size="sm"
            onClick={() => toggleArrayFilter("status", "onboard")}
            className="h-8"
          >
            Onboard
          </Button>
          <Button
            variant={filters.status.includes("expected") ? "default" : "outline"}
            size="sm"
            onClick={() => toggleArrayFilter("status", "expected")}
            className="h-8"
          >
            Expected
          </Button>
          <Button
            variant={filters.vipOnly ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ vipOnly: !filters.vipOnly })}
            className="h-8"
          >
            VIP
          </Button>
        </div>

        {/* Filters Popover */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" aria-label="Open filters">
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                  {activeFilters.length}
                </Badge>
              )}
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border rounded bg-muted">
                F
              </kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Filters</h4>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter("status", option.value)}
                      />
                      <Label htmlFor={`status-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Types */}
              <div className="space-y-2">
                <Label className="text-sm">Guest Types</Label>
                <div className="space-y-2">
                  {TYPE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`type-${option.value}`}
                        checked={filters.types.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter("types", option.value)}
                      />
                      <Label htmlFor={`type-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Alerts */}
              <div className="space-y-2">
                <Label className="text-sm">Dietary & Allergies</Label>
                <div className="space-y-2">
                  {ALERT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`alert-${option.value}`}
                        checked={filters.alerts.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter("alerts", option.value)}
                      />
                      <Label htmlFor={`alert-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm">Check-in Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {filters.checkInFrom ? format(filters.checkInFrom, "MMM d") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.checkInFrom || undefined}
                        onSelect={(date) => updateFilters({ checkInFrom: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {filters.checkInTo ? format(filters.checkInTo, "MMM d") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.checkInTo || undefined}
                        onSelect={(date) => updateFilters({ checkInTo: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="flex-1">
                  Clear All
                </Button>
                <Button size="sm" onClick={() => setIsFiltersOpen(false)} className="flex-1">
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved Views */}
        <Popover open={isSavedViewsOpen} onOpenChange={setIsSavedViewsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Views</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground">Saved Views</p>
              </div>
              {SAVED_VIEWS.map((view) => (
                <Button
                  key={view.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => applySavedView(view.id)}
                  className="w-full justify-start h-8"
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.name}
                </Button>
              ))}
              <Separator className="my-2" />
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-muted-foreground">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Save current view...
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1 hidden lg:block" />

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Sort */}
          <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value })}>
            <SelectTrigger className="w-[140px] h-8" aria-label="Sort guests">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.(filters)}
            className="h-8 hidden sm:flex"
            aria-label="Export to CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>

          {/* Add Guest */}
          <Button size="sm" onClick={onAddGuest} className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.key}-${filter.value}-${index}`}
              variant="secondary"
              className="gap-1 pr-1 pl-2 py-1"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.key as keyof FilterState, filter.value)}
                className="h-4 w-4 p-0 hover:bg-transparent"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
