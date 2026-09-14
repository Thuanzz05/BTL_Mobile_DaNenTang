export function ActivityChart({
  rows,
  label,
}: {
  rows: { ngay: string; so_luong: number }[];
  label: string;
}) {
  const max = Math.max(1, ...rows.map((row) => Number(row.so_luong)));

  return (
    <div
      className="bar-chart"
      role="img"
      aria-label={
        label + ': ' + rows.map((row) => row.ngay.slice(0, 10) + ' có ' + row.so_luong).join(', ')
      }
    >
      {rows.map((row) => (
        <div className="chart-column" key={row.ngay}>
          <span className="chart-value">{row.so_luong}</span>
          <div className="chart-track">
            <div style={{ height: (Number(row.so_luong) / max) * 100 + '%' }} />
          </div>
          <span className="chart-label">
            {row.ngay.slice(5, 10).split('-').reverse().join('/')}
          </span>
        </div>
      ))}
    </div>
  );
}
