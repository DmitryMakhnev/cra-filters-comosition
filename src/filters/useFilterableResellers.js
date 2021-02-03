import { useCallback, useEffect, useMemo, useState } from 'react';
import resellersPureData from './resellers.json';
import { createFiltration } from '../lib/createFiltration';

export const useResellers = () => {
  // use async emulation
  const [state, setState] = useState({
    isLoading: true,
    data: null
  });

  useEffect(() => {
    setTimeout(() => {
      setState({
        isLoading: false,
        data: resellersPureData
      })
    }, 100);
  }, []);

  return state;
}

const INTERNATION_COUNTRY = 'International'
const transformResellersForFiltering = pureReseller => pureReseller.map(pureReseller => ({
  ...pureReseller,
  countries: pureReseller.international
    ? [INTERNATION_COUNTRY].concat(pureReseller.countries)
    : pureReseller.countries
}));

const extractResellersFilters = filterableResellers => ({
  resellerLevel: Array.from(
    new Set(filterableResellers.map(reseller => reseller.resellerLevel))
  ),
  countries: Array.from(
    new Set(filterableResellers.flatMap(reseller => reseller.countries))
  ),
});

const buildFiltersViewModelNarrow = (allFilters, activeFilters, filteredResellers) =>
  Object.entries(allFilters).map(([filteringField, filterParts]) => {
    const allowedFilterPart = Array.from(
      new Set(
        filteredResellers.flatMap(reseller => reseller[filteringField])
      )
    );

    const sortedFilterParts = filterParts.slice().sort();

    return {
      id: filteringField,
      displayName: filteringField,
      parts: sortedFilterParts.map(filterPart => ({
        id: filterPart,
        displayName: filterPart || '__EMPTY__',
        isActive: activeFilters[filteringField]?.includes(filterPart) ?? false,
        isDisabled: !allowedFilterPart.includes(filterPart)
      }))
    };
  });

const buildFiltersViewModelExpand = (allFilters, activeFilters) =>
  Object.entries(allFilters).map(([filteringField, filterParts]) => {
    const sortedFilterParts = filterParts.slice().sort();

    return {
      id: filteringField,
      displayName: filteringField,
      parts: sortedFilterParts.map(filterPart => ({
        id: filterPart,
        displayName: filterPart || '__EMPTY__',
        isActive: activeFilters[filteringField]?.includes(filterPart) ?? false,
        isDisabled: false
      }))
    };
  });

const useFiltersState = (initialState = {}) => {
  const [activeFilters, setActiveFilters] = useState(initialState);

  const onFilterChange = useCallback(
    (filterId, changedFilterPart, isActive) => {
      setActiveFilters(currentActiveFilters => {
        let activeFilterParts;
        if (isActive) {
          activeFilterParts = (currentActiveFilters[filterId] || []).concat(changedFilterPart);
        } else {
          activeFilterParts = currentActiveFilters[filterId].filter(item => item !== changedFilterPart)
        }
        return {
          ...currentActiveFilters,
          [filterId]: activeFilterParts
        };
      })
    },
    [setActiveFilters]
  );

  const reset = useCallback(() => {
    setActiveFilters(initialState);
  }, [setActiveFilters]);

  return {
    activeFilters,
    onFilterChange,
    reset
  };
};

const filterTypes = ['narrowing', 'expansion'];

// filters
const filterByCountriesNarrow = (resellers, activeFilters) =>
  resellers.filter(
    reseller => activeFilters.countries?.every(
      country => reseller.countries.includes(country)
    ) ?? true
  );

const filterByResellerLevelNarrow = (resellers, activeFilters) =>
  resellers.filter(
    reseller => activeFilters.resellerLevel?.every(
      resellerLevel => reseller.resellerLevel === resellerLevel
    ) ?? true
  );

const filterByCountriesExpand = (resellers, activeFilters, { allItems: allResellers }) => {
  if (activeFilters.countries?.length) {
    const subset = allResellers.filter(
      reseller => reseller.countries.some(
        country => activeFilters.countries.includes(country)
      )
    );
    return Array.from(
      new Set(resellers.concat(subset))
    );
  }
  return resellers;
};

const filterByResellerLevelExpand = (resellers, activeFilters, { allItems: allResellers }) => {
  if (activeFilters.resellerLevel?.length) {
    const subset = allResellers.filter(
      reseller => activeFilters.resellerLevel.includes(reseller.resellerLevel)
    );
    return Array.from(
      new Set(resellers.concat(subset))
    )
  }
  return resellers;
};

const checkAnyFilterSelected = activeFilters => Object.values(activeFilters)
  .some(activeFilter => activeFilter.length !== 0)

export const useFilterableResellers = () => {
  // data preparing part
  const {
    isLoading,
    data: pureResellers
  } = useResellers();

  const resellersForFiltration = useMemo(
    () => transformResellersForFiltering(pureResellers || []),
    [pureResellers]
  );

  // filters preparing part
  const allFilters = useMemo(
    () => extractResellersFilters(resellersForFiltration),
    [resellersForFiltration]
  );

  const {
    activeFilters,
    onFilterChange,
    reset
  } = useFiltersState();

  // filters resolving
  const [currentFilterType, setFilterType] = useState(filterTypes[0]);
  const changeFilterType = useCallback(filterType => {
    reset();
    setFilterType(filterType);
  }, [reset, setFilterType])

  const filterResellers = useMemo(
    () => currentFilterType === filterTypes[0]
      ? createFiltration(
        filterByCountriesNarrow,
        filterByResellerLevelNarrow
      )
      : createFiltration(
        filterByCountriesExpand,
        filterByResellerLevelExpand
      ),
    [currentFilterType]
  );

  // filtration
  const filteredResellers = useMemo(
    () => filterResellers(
      resellersForFiltration,
      activeFilters,
      allFilters,
      currentFilterType === filterTypes[1] && checkAnyFilterSelected(activeFilters)
    ),
    [filterResellers, resellersForFiltration, activeFilters, allFilters, currentFilterType]
  );

  // rebuild filters view model
  const filters = useMemo(
    () => currentFilterType === filterTypes[0]
      ? buildFiltersViewModelNarrow(allFilters, activeFilters, filteredResellers)
      : buildFiltersViewModelExpand(allFilters, activeFilters, filteredResellers),
    [currentFilterType, allFilters, activeFilters, filteredResellers]
  );

  return {
    isLoading,
    onFilterChange,
    filteredResellers,
    filters,

    filterTypes,
    currentFilterType,
    setFilterType: changeFilterType
  };
};
