import React, { useState } from 'react';
import { Table, Button, Card, Spinner } from 'react-bootstrap';
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
        <Button 
          size="sm" 
          variant="outline-primary" 
          onClick={() => onView(item)}
          className={styles.actionBtn}
          title="View"
        >
          <FontAwesomeIcon icon={faEye} />
        </Button>
      )}
      {onEdit && (
        <Button 
          size="sm" 
          variant="outline-warning" 
          onClick={() => onEdit(item)}
          className={styles.actionBtn}
          title="Edit"
        >
          <FontAwesomeIcon icon={faEdit} />
        </Button>
      )}
      {onDelete && (
        <Button 
          size="sm" 
          variant="outline-danger" 
          onClick={() => onDelete(item)}
          className={styles.actionBtn}
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`${styles.emptyCard} border-0`}>
        <Card.Body className={styles.emptyBody}>
          <p className={styles.emptyText}>{emptyMessage}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <Table responsive className={styles.table} hover>
          <thead className={styles.thead}>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`${column.sortable ? styles.sortable : ''} ${column.hideMobile ? 'd-none d-md-table-cell' : ''}`}
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
                    className={`${column.hideMobile ? 'd-none d-md-table-cell' : ''}`}
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
        </Table>
      </div>
    </div>
  );
}

export default ResponsiveTable;
