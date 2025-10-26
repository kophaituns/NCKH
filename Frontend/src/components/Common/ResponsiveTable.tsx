import React, { useState } from 'react';
import { Table, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  hideMobile?: boolean;
  hideTablet?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  cardView?: boolean; // For mobile card layout
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No data available",
  cardView = true
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
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

  const renderActions = (item: any) => (
    <div className="d-flex gap-1">
      {onView && (
        <Button size="sm" variant="outline-primary" onClick={() => onView(item)}>
          <FontAwesomeIcon icon={faEye} />
          <span className="d-none d-sm-inline ms-1">View</span>
        </Button>
      )}
      {onEdit && (
        <Button size="sm" variant="outline-warning" onClick={() => onEdit(item)}>
          <FontAwesomeIcon icon={faEdit} />
          <span className="d-none d-sm-inline ms-1">Edit</span>
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="outline-danger" onClick={() => onDelete(item)}>
          <FontAwesomeIcon icon={faTrash} />
          <span className="d-none d-sm-inline ms-1">Delete</span>
        </Button>
      )}
    </div>
  );

  const renderTableView = () => (
    <div className="table-responsive table-responsive-enhanced">
      <Table responsive className="mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                className={`
                  ${column.hideMobile ? 'hide-mobile d-none d-md-table-cell' : ''}
                  ${column.hideTablet ? 'd-none d-lg-table-cell' : ''}
                  ${column.sortable ? 'cursor-pointer user-select-none' : ''}
                `}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <div className="d-flex align-items-center">
                  {column.label}
                  {column.sortable && (
                    <FontAwesomeIcon 
                      icon={faSort} 
                      className={`ms-1 ${sortField === column.key ? 'text-primary' : 'text-muted'}`}
                    />
                  )}
                </div>
              </th>
            ))}
            {(onView || onEdit || onDelete) && (
              <th className="text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td 
                  key={column.key}
                  className={`
                    ${column.hideMobile ? 'hide-mobile d-none d-md-table-cell' : ''}
                    ${column.hideTablet ? 'd-none d-lg-table-cell' : ''}
                  `}
                  data-label={column.label}
                >
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </td>
              ))}
              {(onView || onEdit || onDelete) && (
                <td className="text-center">
                  {renderActions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderCardView = () => (
    <div className="d-md-none">
      {sortedData.map((item, index) => (
        <Card key={index} className="mb-3 card-responsive">
          <Card.Body>
            {columns.filter(col => !col.hideMobile).map((column) => (
              <div key={column.key} className="d-flex justify-content-between align-items-center mb-2">
                <strong className="text-muted">{column.label}:</strong>
                <span>
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </span>
              </div>
            ))}
            {(onView || onEdit || onDelete) && (
              <div className="mt-3 pt-3 border-top">
                {renderActions(item)}
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="text-center py-5">
        <Card.Body>
          <p className="text-muted mb-0">{emptyMessage}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="d-none d-md-block">
        <Card className="border-0 shadow-sm card-responsive">
          <Card.Body className="p-0">
            {renderTableView()}
          </Card.Body>
        </Card>
      </div>

      {/* Mobile Card View */}
      {cardView && renderCardView()}
    </>
  );
};

export default ResponsiveTable;