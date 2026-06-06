import { BusinessDashboard } from "./BusinessDashboard";
import { BusinessExpensesScreen } from "./BusinessExpensesScreen";
import { BusinessIncomeScreen } from "./BusinessIncomeScreen";
import { BusinessReportsScreen } from "./BusinessReportsScreen";

type BusinessView = "dashboard" | "income" | "expenses" | "reports" | "add";

type Props = {
  view: BusinessView;
  addOpen: boolean;
  onViewChange: (view: BusinessView) => void;
  onAddClose: () => void;
};

export function BusinessSpace({ view, addOpen, onViewChange, onAddClose }: Props) {
  // "+" footer button → open income screen with add modal (default add = income)
  if (view === "income" || (addOpen && view === "dashboard")) {
    return (
      <BusinessIncomeScreen
        onBack={() => { onAddClose(); onViewChange("dashboard"); }}
        externalAddOpen={addOpen && view === "dashboard" ? addOpen : false}
        onExternalAddClose={onAddClose}
      />
    );
  }
  if (view === "expenses") {
    return (
      <BusinessExpensesScreen
        onBack={() => { onAddClose(); onViewChange("dashboard"); }}
        externalAddOpen={addOpen}
        onExternalAddClose={onAddClose}
      />
    );
  }
  if (view === "reports") return <BusinessReportsScreen onBack={() => onViewChange("dashboard")} />;
  return <BusinessDashboard onNavigate={(tab) => onViewChange(tab as BusinessView)} />;
}
