import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  rows: number;
  columns: number;
}

const TableSkeleton = ({ rows = 5, columns = 4 }: Props) => {
  return (
    <div className={'flex flex-col justify-center py-3'}>
      <div role="table" aria-busy="true" className="overflow-auto">
        <table role="table" className="w-full table-auto">
          <thead role="rowgroup">
            <tr role="row">
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} role="columnheader" className="px-2">
                  <Skeleton className={'h-8 w-full rounded'} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} role="row">
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    role="cell"
                    className={cn(
                      'px-2',
                      colIndex === 0
                        ? 'w-[50px]'
                        : colIndex === 1 && columns > 2
                          ? 'w-[100px]'
                          : 'flex-1'
                    )}
                  >
                    <Skeleton className={'h-8 w-full rounded'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
