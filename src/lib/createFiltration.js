export const createFiltration = (...filters) => (allItems, activeFilters, allFilters, isStartFromEmpty) => {
  const filtrationContext = {
    allItems,
    allFilters,
  };
  let result = isStartFromEmpty ? [] : allItems;
  filters.forEach(filter => {
    result = filter(result, activeFilters, filtrationContext);
  });
  return result;
};
