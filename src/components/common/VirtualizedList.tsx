import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Paper } from '@mui/material';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    data: T[];
  }) => React.ReactElement;
  className?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className,
}: VirtualizedListProps<T>) {
  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      return renderItem({ index, style, data: items });
    },
    [items, renderItem]
  );

  const memoizedItems = useMemo(() => items, [items]);

  return (
    <Paper className={className}>
      <List
        height={height}
        width="100%"
        itemCount={memoizedItems.length}
        itemSize={itemHeight}
        itemData={memoizedItems}
      >
        {ItemRenderer}
      </List>
    </Paper>
  );
}

export default React.memo(VirtualizedList) as <T>(
  props: VirtualizedListProps<T>
) => React.ReactElement;
