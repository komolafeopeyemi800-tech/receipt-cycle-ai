import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface CategorySpend {
  name: string;
  value: number;
  color: string;
}

interface SpendingChartProps {
  data: CategorySpend[];
  totalSpent: number;
  currency?: string;
}

export function SpendingChart({ data, totalSpent, currency = "$" }: SpendingChartProps) {
  return (
    <div className="card-elevated p-5">
      <h3 className="section-title">Spending by Category</h3>
      
      <div className="flex items-center gap-4">
        {/* Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold">{currency}{(totalSpent / 1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2">
          {data.slice(0, 6).map((category) => (
            <div key={category.name} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate capitalize">
                  {category.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {currency}{category.value.toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
