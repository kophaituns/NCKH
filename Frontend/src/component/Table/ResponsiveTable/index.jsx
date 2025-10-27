import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import styles from './ResponsiveTable.module.scss';

function ResponsiveTable({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No data available"
}) {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (columnKey) => {
    if (sortField !== columnKey) return <FontAwesomeIcon icon={faSort} className={styles.sortIcon} />;
    return <FontAwesomeIcon icon={sortDirection === 'asc' ? faSortUp : faSortDown} className={styles.sortIconActive} />;
  };

  const renderActions = (item) => (
    <div className={styles.actions}>
      {onView && (
        <button 
          onClick={() => onView(item)}
          className={styles.actionBtn}
          title="View"
          type="button"
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
      )}
      {onEdit && (
        <button 
          onClick={() => onEdit(item)}
          className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
          title="Edit"
          type="button"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      )}
      {onDelete && (
        <button 
          onClick={() => onDelete(item)}
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
          title="Delete"
          type="button"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyBody}>
          <p className={styles.emptyText}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`${column.sortable ? styles.sortable : ''} ${column.hideMobile ? styles.hideMobile : ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className={styles.headerContent}>
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className={styles.actionsHeader}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {sortedData.map((item, index) => (
              <tr key={index} className={styles.row}>
                {columns.map((column) => (
                  <td 
                    key={column.key}
                    className={column.hideMobile ? styles.hideMobile : ''}
                  >
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className={styles.actionsCell}>{renderActions(item)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResponsiveTable;
