import React from 'react';
import { useFilterableResellers } from './useFilterableResellers';

export const FiltersLayout = () => {
  const {
    isLoading,
    filters,
    onFilterChange,
    filteredResellers,

    filterTypes,
    currentFilterType,
    setFilterType
  } = useFilterableResellers();

  if (isLoading) {
    return 'Loading...';
  }

  return (
    <div>
      <div>
        {filterTypes.map(filterType => (
          <label key={filterType}>
            <input
              type="radio"
              checked={filterType === currentFilterType}
              onChange={() => setFilterType(filterType)}
            />
            {filterType}
          </label>
        ))}
      </div>
       {/*table for layout*/}
      <table>
        <tbody>
          <tr valign="top">
            <td width="400">
              {filteredResellers.map(reseller => (
                <div key={reseller.url + reseller.company}>
                  <h5>{reseller.company}</h5>
                  <p>{reseller.email}</p>
                  <b>Level: {reseller.resellerLevel}</b>
                  <ul>
                    {reseller.countries.map(country => (
                      <li key={country}>{country}</li>
                    ))}
                  </ul>
                  <hr />
                </div>
              ))}
            </td>

            <td valign="top">
              {Object.values(filters).map(filter => (
                <div key={filter.id}>
                  <h4>Filter: {filter.displayName}</h4>
                  <div>
                    {filter.parts.map(part => (
                      <div key={part.id || '_'}>
                        <label>
                          <input
                            type="checkbox"
                            checked={part.isActive}
                            onChange={() => onFilterChange(filter.id, part.id, !part.isActive)}
                            disabled={part.isDisabled}
                          />
                          {part.isDisabled ? <s>{part.displayName}</s> : part.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
};
