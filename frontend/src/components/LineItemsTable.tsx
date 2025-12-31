import React from 'react';
import type { LineItem } from '../types/invoice';

interface LineItemsTableProps {
  lineItems: LineItem[];
  editable?: boolean;
  onChange?: (index: number, field: keyof LineItem, value: string | number) => void;
}

export default function LineItemsTable({
  lineItems,
  editable = false,
  onChange,
}: LineItemsTableProps) {
  const handleChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    if (onChange) {
      const numericFields = ['quantity', 'unit_price', 'amount'];
      const parsedValue = numericFields.includes(field)
        ? parseFloat(value) || 0
        : value;
      onChange(index, field, parsedValue);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="cyber-table">
        <thead>
          <tr>
            <th className="w-12">#</th>
            <th>DESCRIPTION</th>
            <th className="text-right w-24">QTY</th>
            <th className="text-right w-32">UNIT PRICE</th>
            <th className="text-right w-32">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-gray-500 py-8">
                NO LINE ITEMS
              </td>
            </tr>
          ) : (
            lineItems.map((item, index) => (
              <tr key={item.id || index}>
                <td className="text-gray-500 font-mono">{index + 1}</td>
                <td>
                  {editable ? (
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) =>
                        handleChange(index, 'description', e.target.value)
                      }
                      className="cyber-input text-sm"
                    />
                  ) : (
                    <span className="text-gray-200">
                      {item.description || '-'}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {editable ? (
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(index, 'quantity', e.target.value)
                      }
                      className="cyber-input text-sm text-right w-20"
                    />
                  ) : (
                    <span className="text-gray-200 font-mono">{item.quantity}</span>
                  )}
                </td>
                <td className="text-right">
                  {editable ? (
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleChange(index, 'unit_price', e.target.value)
                      }
                      className="cyber-input text-sm text-right w-28"
                    />
                  ) : (
                    <span className="text-gray-200 font-mono">
                      {item.unit_price.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {editable ? (
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) =>
                        handleChange(index, 'amount', e.target.value)
                      }
                      className="cyber-input text-sm text-right w-28"
                    />
                  ) : (
                    <span className="text-cyber-green font-mono font-semibold">
                      {item.amount.toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {lineItems.length > 0 && (
          <tfoot>
            <tr className="border-t border-white/20">
              <td colSpan={4} className="text-right font-rajdhani font-semibold text-gray-300 py-4">
                TOTAL:
              </td>
              <td className="text-right font-mono font-bold text-cyber-cyan text-lg py-4">
                {lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
